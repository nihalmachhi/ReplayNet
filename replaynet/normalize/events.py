from datetime import UTC, datetime
from typing import Any
from uuid import uuid4


def normalize_event(raw: dict[str, Any], source: str) -> dict:
    timestamp = raw.get("timestamp")
    if not isinstance(timestamp, str):
        raise ValueError("Each event needs an ISO-8601 timestamp")
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"Invalid event timestamp: {timestamp}") from error
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return {
        "id": str(raw.get("id") or uuid4()),
        "timestamp": parsed.astimezone(UTC).isoformat(),
        "uncertainty_ms": max(0, int(raw.get("uncertainty_ms", 0))),
        "source": source[:100],
        "kind": str(raw.get("kind", "observation"))[:80],
        "message": str(raw.get("message", ""))[:2000],
        "measured": bool(raw.get("measured", True)),
        "details": raw.get("details", {}) if isinstance(raw.get("details", {}), dict) else {},
    }
