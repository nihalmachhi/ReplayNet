def test_hypotheses_use_bundle_evidence_and_decisions_persist(client, tokens):
    evidence = b'{"id":"route-event","timestamp":"2026-01-01T00:00:00Z","kind":"routing-update"}\n{"id":"loss-event","timestamp":"2026-01-01T00:00:01Z","kind":"packet-loss"}\n'
    uploaded = client.post(
        "/api/v1/bundles", headers=tokens["operator"], files={"file": ("events.jsonl", evidence)}
    )
    assert uploaded.status_code == 201
    hypotheses = client.get("/api/v1/hypotheses", headers=tokens["viewer"]).json()
    assert len(hypotheses) == 1
    assert hypotheses[0]["supporting_event_ids"] == ["route-event", "loss-event"]
    assert "not a calibrated probability" in hypotheses[0]["method"]
    response = client.patch(
        f"/api/v1/hypotheses/{hypotheses[0]['id']}",
        headers=tokens["operator"],
        json={"status": "confirmed", "rationale": "Both event types are present"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"
    assert (
        client.patch(
            "/api/v1/hypotheses/missing",
            headers=tokens["operator"],
            json={"status": "rejected", "rationale": "No evidence found"},
        ).status_code
        == 404
    )
