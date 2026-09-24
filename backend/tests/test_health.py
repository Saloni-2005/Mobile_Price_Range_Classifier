"""Contract tests for GET /health (PRD Ch. 11 / 19)."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure backend package is importable when pytest is run from repo root or backend/
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402
from app.services import inference  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)


def test_health_ok_when_artifact_present(client, monkeypatch):
    artifact = REPO_ROOT / "artifacts" / "baseline_rf.joblib"
    assert artifact.exists(), "Train baseline first (scripts/train_baseline.py)"

    monkeypatch.setattr(inference, "DEFAULT_ARTIFACT_PATH", artifact)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["model_loaded"] is True
    assert body["status"] == "ok"


def test_health_degraded_when_artifact_missing(client, monkeypatch, tmp_path):
    missing = tmp_path / "does_not_exist.joblib"
    monkeypatch.setattr(inference, "DEFAULT_ARTIFACT_PATH", missing)
    inference.clear_model_cache()

    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["model_loaded"] is False
    assert body["status"] == "degraded"
