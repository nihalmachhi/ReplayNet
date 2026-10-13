import pytest
from fastapi.testclient import TestClient

from replaynet.api.app import create_app


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(str(tmp_path / "test.sqlite3"))) as test_client:
        yield test_client


@pytest.fixture
def tokens():
    return {
        name: {"Authorization": f"Bearer local-{name}-token"}
        for name in ("viewer", "operator", "admin")
    }
