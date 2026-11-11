"""
Automated contract and security tests for Scoped Auth (PRD Chapter 10.4).

Verifies:
- Seeded pricing-analyst login (`POST /auth/login`) issues a valid HS256 JWT.
- Invalid credentials return 401 Unauthorized.
- Unauthenticated requests to `/predict`, `/explain/{id}`, and `/whatif` return 401.
- Tampered or expired JWT tokens return 401.
- Authenticated requests to `/predict` and `/explain/{id}` succeed with 200.
- Authenticated request to `/whatif` reaches the route handler and raises NotImplementedError.
- Public endpoints (`/health` and `/feature-importance`) remain accessible without a token.
"""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.auth.jwt_handler import (  # noqa: E402
    SEEDED_PASSWORD,
    SEEDED_USERNAME,
    create_access_token,
    seed_analyst_user,
)
from app.db.session import init_db  # noqa: E402
from app.main import app  # noqa: E402

VALID_PREDICT_PAYLOAD = {
    "battery_power": 1500,
    "blue": 1,
    "clock_speed": 2.0,
    "dual_sim": 0,
    "fc": 5,
    "four_g": 1,
    "int_memory": 32,
    "m_dep": 0.5,
    "mobile_wt": 140,
    "n_cores": 4,
    "pc": 10,
    "px_height": 980,
    "px_width": 1249,
    "ram": 2048,
    "sc_h": 12,
    "sc_w": 8,
    "talk_time": 11,
    "three_g": 1,
    "touch_screen": 1,
    "wifi": 1,
}


@pytest.fixture(scope="module")
def unauth_client():
    """TestClient with no Authorization header."""
    init_db()
    seed_analyst_user()
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Seeded Analyst Login & Token Issuance
# ---------------------------------------------------------------------------

class TestAnalystLogin:
    def test_seeded_analyst_login_returns_200_and_jwt(self, unauth_client):
        resp = unauth_client.post(
            "/auth/login",
            json={"username": SEEDED_USERNAME, "password": SEEDED_PASSWORD},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["username"] == SEEDED_USERNAME
        assert body["role"] == "analyst"
        assert len(body["access_token"].split(".")) == 3

    def test_login_wrong_password_returns_401(self, unauth_client):
        resp = unauth_client.post(
            "/auth/login",
            json={"username": SEEDED_USERNAME, "password": "wrong-password"},
        )
        assert resp.status_code == 401

    def test_login_unknown_user_returns_401(self, unauth_client):
        resp = unauth_client.post(
            "/auth/login",
            json={"username": "nonexistent_user", "password": SEEDED_PASSWORD},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 2. Protected Endpoints Reject Unauthenticated / Bad Tokens with 401
# ---------------------------------------------------------------------------

class TestProtectedRoutesRequireJWT:
    def test_unauthenticated_predict_returns_401(self, unauth_client):
        """DoD requirement: unauthenticated request to /predict returns 401."""
        resp = unauth_client.post("/predict", json=VALID_PREDICT_PAYLOAD)
        assert resp.status_code == 401, (
            f"Expected 401 for unauthenticated /predict, got {resp.status_code}: {resp.text}"
        )

    def test_unauthenticated_explain_returns_401(self, unauth_client):
        resp = unauth_client.get("/explain/1")
        assert resp.status_code == 401

    def test_unauthenticated_whatif_returns_401(self, unauth_client):
        resp = unauth_client.post("/whatif", json={"baseline_prediction_id": 1, "adjustments": {"ram": 3000}})
        assert resp.status_code == 401

    def test_malformed_token_on_predict_returns_401(self, unauth_client):
        resp = unauth_client.post(
            "/predict",
            json=VALID_PREDICT_PAYLOAD,
            headers={"Authorization": "Bearer not.a.valid.jwt"},
        )
        assert resp.status_code == 401

    def test_tampered_signature_returns_401(self, unauth_client):
        token = create_access_token()
        tampered = token[:-4] + "XXXX"
        resp = unauth_client.post(
            "/predict",
            json=VALID_PREDICT_PAYLOAD,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert resp.status_code == 401

    def test_expired_token_returns_401(self, unauth_client):
        expired_token = create_access_token(expires_delta=timedelta(seconds=-10))
        resp = unauth_client.post(
            "/predict",
            json=VALID_PREDICT_PAYLOAD,
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401
        assert "expired" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 3. Authenticated Requests Succeed on Protected Endpoints
# ---------------------------------------------------------------------------

class TestAuthenticatedAccess:
    def test_login_then_predict_and_explain_succeeds(self, unauth_client):
        login_resp = unauth_client.post(
            "/auth/login",
            json={"username": SEEDED_USERNAME, "password": SEEDED_PASSWORD},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        pred_resp = unauth_client.post(
            "/predict", json=VALID_PREDICT_PAYLOAD, headers=headers
        )
        assert pred_resp.status_code == 200, pred_resp.text
        pred_id = pred_resp.json()["prediction_id"]

        explain_resp = unauth_client.get(f"/explain/{pred_id}", headers=headers)
        assert explain_resp.status_code == 200, explain_resp.text
        assert explain_resp.json()["prediction_id"] == pred_id

    def test_authenticated_whatif_succeeds(self, unauth_client):
        token = create_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        pred_resp = unauth_client.post(
            "/predict", json=VALID_PREDICT_PAYLOAD, headers=headers
        )
        assert pred_resp.status_code == 200
        pred_id = pred_resp.json()["prediction_id"]

        whatif_resp = unauth_client.post(
            "/whatif",
            json={"baseline_prediction_id": pred_id, "adjustments": {"ram": 3500}},
            headers=headers,
        )
        assert whatif_resp.status_code == 200, whatif_resp.text


# ---------------------------------------------------------------------------
# 4. Public Endpoints Remain Public (PRD Chapter 10.4)
# ---------------------------------------------------------------------------

class TestPublicEndpoints:
    def test_health_is_public_without_jwt(self, unauth_client):
        resp = unauth_client.get("/health")
        assert resp.status_code == 200

    def test_feature_importance_is_public_without_jwt(self, unauth_client):
        resp = unauth_client.get("/feature-importance")
        assert resp.status_code == 200
        assert "features" in resp.json()

