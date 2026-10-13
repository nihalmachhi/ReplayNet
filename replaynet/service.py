import hashlib
import json
from datetime import UTC, datetime
from uuid import uuid4

from replaynet.lab.simulator import simulate
from replaynet.measure.confidence import wilson_interval
from replaynet.normalize.events import normalize_event
from replaynet.normalize.redact import redact
from replaynet.schemas import ScenarioSpec
from replaynet.store import Store


def now():
    return datetime.now(UTC).isoformat()


class ReplayService:
    def __init__(self, store: Store):
        self.store = store

    def ingest(self, source: str, lines: list[str]):
        if not lines or len(lines) > 10000:
            raise ValueError("Bundle must contain between 1 and 10000 events")
        events = []
        for number, line in enumerate(lines, 1):
            try:
                raw = json.loads(line)
                if not isinstance(raw, dict):
                    raise ValueError("JSONL item must be an object")
                events.append(normalize_event(redact(raw), source))
            except (json.JSONDecodeError, ValueError, TypeError) as error:
                raise ValueError(f"Line {number}: {error}") from error
        events.sort(key=lambda event: event["timestamp"])
        digest = hashlib.sha256(json.dumps(events, sort_keys=True).encode()).hexdigest()
        identifier, created = str(uuid4()), now()
        self.store.insert("bundles", identifier, {"events": events}, created, digest)
        return self.store.get("bundles", identifier)

    def create_spec(self, spec: ScenarioSpec):
        identifier, created = str(uuid4()), now()
        self.store.insert("specs", identifier, spec.model_dump(), created)
        return {**self.store.get("specs", identifier), "status": "draft"}

    def run(self, spec_id: str, repetitions: int, seed: int):
        spec = self.store.get("specs", spec_id)
        if not spec:
            return None
        trials = [simulate(spec["fault"], spec["build"], seed + i) for i in range(repetitions)]
        failures = sum(trials)
        low, high = wilson_interval(failures, repetitions)
        verdict = (
            ("REPRODUCED" if low >= 0.5 else "INCONCLUSIVE")
            if spec["build"] == "buggy"
            else ("REGRESSION_GUARDED" if high < 0.5 else "INCONCLUSIVE")
        )
        payload = {
            "spec_id": spec_id,
            "repetitions": repetitions,
            "seed": seed,
            "failure_count": failures,
            "failure_rate": round(failures / repetitions, 4),
            "wilson_95": [round(low, 4), round(high, 4)],
            "verdict": verdict,
            "trials": trials,
            "lab": "deterministic-in-process-simulator",
        }
        identifier, created = str(uuid4()), now()
        self.store.insert("runs", identifier, payload, created)
        return self.store.get("runs", identifier)

    def minimize(self, spec_id: str):
        spec = self.store.get("specs", spec_id)
        if not spec:
            return None
        params = spec.get("parameters", {})
        return {
            "spec_id": spec_id,
            "original_parameters": params,
            "minimal_parameters": {},
            "removed_parameters": list(params),
            "method": "single-pass optional-parameter reduction",
            "note": "Toy simulator has no parameterized traffic. Validate reductions in a real lab.",
        }
