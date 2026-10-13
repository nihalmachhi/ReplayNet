def test_public_health_and_protected_routes(client, tokens):
    assert client.get("/health").status_code == 200
    assert client.get("/api/v1/bundles").status_code == 401
    assert client.get("/api/v1/bundles", headers={"Authorization": "Bearer bad"}).status_code == 401
    assert client.get("/api/v1/bundles", headers=tokens["viewer"]).status_code == 200


def test_viewer_is_forbidden_to_create_scenario(client, tokens):
    body = {
        "title": "Route regression",
        "fault": "route_blackhole",
        "build": "buggy",
        "oracle": "packet loss observed",
    }
    assert client.post("/api/v1/specs", headers=tokens["viewer"], json=body).status_code == 403
    assert client.post("/api/v1/specs", headers=tokens["operator"], json=body).status_code == 201


def test_operator_can_run_a_scenario(client, tokens):
    headers = tokens["operator"]
    response = client.post(
        "/api/v1/specs",
        headers=headers,
        json={
            "title": "Route regression",
            "fault": "route_blackhole",
            "build": "buggy",
            "oracle": "loss observed",
        },
    )
    result = client.post(
        f"/api/v1/specs/{response.json()['id']}/runs",
        headers=headers,
        json={"repetitions": 30, "seed": 11},
    )
    assert result.status_code == 201
    assert result.json()["verdict"] == "REPRODUCED"


def test_upload_is_protected_and_redacts_sensitive_content(client, tokens):
    content = (
        b'{"timestamp":"2026-01-02T03:04:05Z","message":"token=abc user@example.com at 10.2.3.4"}\n'
    )
    assert (
        client.post("/api/v1/bundles", files={"file": ("sample.jsonl", content)}).status_code == 401
    )
    result = client.post(
        "/api/v1/bundles", headers=tokens["operator"], files={"file": ("sample.jsonl", content)}
    )
    assert result.status_code == 201
    message = result.json()["events"][0]["message"]
    assert "abc" not in message and "user@example.com" not in message and "10.2.3.4" not in message


def test_upload_rejects_invalid_jsonl(client, tokens):
    response = client.post(
        "/api/v1/bundles", headers=tokens["operator"], files={"file": ("bad.jsonl", b"not json")}
    )
    assert response.status_code == 422
