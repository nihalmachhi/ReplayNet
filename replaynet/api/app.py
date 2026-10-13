from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from replaynet.config import Settings
from replaynet.schemas import HypothesisDecision, RunRequest, ScenarioSpec
from replaynet.security import Role, require_role
from replaynet.service import ReplayService
from replaynet.store import Store


def create_app(database_path: str | None = None):
    settings = Settings()
    store = Store(database_path or settings.database_path)
    service = ReplayService(store)
    app = FastAPI(title="ReplayNet", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_methods=["GET", "POST", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.state.service, app.state.store = service, store

    @app.get("/health")
    def health():
        return {"status": "ok", "mode": "offline-lab"}

    @app.post("/api/v1/bundles", status_code=201)
    async def upload(file: UploadFile = File(...), _: Role = Depends(require_role(Role.operator))):
        content = await file.read(settings.max_bundle_bytes + 1)
        if len(content) > settings.max_bundle_bytes:
            raise HTTPException(413, "Evidence bundle exceeds 5 MiB")
        try:
            return service.ingest(
                file.filename or "evidence.jsonl", content.decode("utf-8").splitlines()
            )
        except (UnicodeDecodeError, ValueError) as error:
            raise HTTPException(422, str(error)) from error

    @app.get("/api/v1/bundles")
    def bundles(_: Role = Depends(require_role(Role.viewer))):
        return store.list("bundles")

    @app.get("/api/v1/bundles/{bundle_id}/timeline")
    def timeline(bundle_id: str, _: Role = Depends(require_role(Role.viewer))):
        bundle = store.get("bundles", bundle_id)
        if not bundle:
            raise HTTPException(404, "Bundle not found")
        return {"bundle_id": bundle_id, "sha256": bundle["sha256"], "events": bundle["events"]}

    @app.get("/api/v1/hypotheses")
    def hypotheses(_: Role = Depends(require_role(Role.viewer))):
        return service.hypotheses()

    @app.patch("/api/v1/hypotheses/{hypothesis_id}")
    def decide(
        hypothesis_id: str,
        decision: HypothesisDecision,
        _: Role = Depends(require_role(Role.operator)),
    ):
        if not any(item["id"] == hypothesis_id for item in service.hypotheses()):
            raise HTTPException(404, "Hypothesis not found")
        return store.save_decision(hypothesis_id, decision.model_dump())

    @app.post("/api/v1/specs", status_code=201)
    def create(spec: ScenarioSpec, _: Role = Depends(require_role(Role.operator))):
        return service.create_spec(spec)

    @app.get("/api/v1/specs")
    def specs(_: Role = Depends(require_role(Role.viewer))):
        return store.list("specs")

    @app.post("/api/v1/specs/{spec_id}/runs", status_code=201)
    def run(spec_id: str, request: RunRequest, _: Role = Depends(require_role(Role.operator))):
        result = service.run(spec_id, request.repetitions, request.seed)
        if result is None:
            raise HTTPException(404, "Scenario spec not found")
        return result

    @app.post("/api/v1/specs/{spec_id}/minimize")
    def minimize(spec_id: str, _: Role = Depends(require_role(Role.operator))):
        result = service.minimize(spec_id)
        if result is None:
            raise HTTPException(404, "Scenario spec not found")
        return result

    @app.get("/api/v1/tests")
    def runs(_: Role = Depends(require_role(Role.viewer))):
        return store.list("runs")

    return app


app = create_app()
