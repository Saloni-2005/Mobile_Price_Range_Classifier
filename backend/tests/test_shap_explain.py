"""
Contract tests and SHAP additivity checks for GET /explain/{prediction_id}
(PRD Ch. 11, 14.1, 17, 19; TC-API-03, TC-SHAP-01).

Validates:
- Happy path: valid prediction ID returns 200 with PRD-compliant schema.
- Non-existent prediction ID returns 404.
- Invalid prediction ID (< 1) returns 422.
- Superseded model_version_id returns 409 (PRD Chapter 17).
- Additivity property (PRD Chapter 14.1): sum(attributions) + base_value == predicted_probability
  within 1e-5 numerical tolerance across all 4 price-tier classes.
- Attributions are sorted descending by absolute magnitude (|shap_value|).
"""

from __future__ import annotations

from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.db.models import ModelRegistry, Prediction  # noqa: E402
from app.db.session import SessionLocal, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services import inference  # noqa: E402
from app.services.shap_service import clear_explainer_cache, explain_prediction  # noqa: E402

SAMPLE_PAYLOAD_TIER_2 = {
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

SAMPLE_PAYLOAD_LOW = {
    "battery_power": 600,
    "blue": 0,
    "clock_speed": 0.5,
    "dual_sim": 0,
    "fc": 0,
    "four_g": 0,
    "int_memory": 4,
    "m_dep": 0.1,
    "mobile_wt": 190,
    "n_cores": 1,
    "pc": 0,
    "px_height": 100,
    "px_width": 600,
    "ram": 512,
    "sc_h": 6,
    "sc_w": 2,
    "talk_time": 3,
    "three_g": 0,
    "touch_screen": 0,
    "wifi": 0,
}

SAMPLE_PAYLOAD_HIGH = {
    "battery_power": 1950,
    "blue": 1,
    "clock_speed": 2.8,
    "dual_sim": 1,
    "fc": 15,
    "four_g": 1,
    "int_memory": 64,
    "m_dep": 0.3,
    "mobile_wt": 95,
    "n_cores": 8,
    "pc": 18,
    "px_height": 1500,
    "px_width": 1900,
    "ram": 3800,
    "sc_h": 17,
    "sc_w": 10,
    "talk_time": 18,
    "three_g": 1,
    "touch_screen": 1,
    "wifi": 1,
}


@pytest.fixture(scope="module")
def client():
    """Module-scoped TestClient ensuring active tuned pipeline is loaded."""
    from app.auth.jwt_handler import create_access_token

    init_db()
    inference.clear_model_cache()
    clear_explainer_cache()
    test_client = TestClient(app)
    test_client.headers.update({"Authorization": f"Bearer {create_access_token()}"})
    return test_client


@pytest.fixture(scope="module")
def seeded_prediction_id(client) -> int:
    """Create a real prediction via POST /predict to explain."""
    resp = client.post("/predict", json=SAMPLE_PAYLOAD_TIER_2)
    assert resp.status_code == 200, resp.text
    return resp.json()["prediction_id"]


# ---------------------------------------------------------------------------
# Test suite: Endpoint contracts (TC-API-03)
# ---------------------------------------------------------------------------

class TestExplainEndpointContract:
    def test_status_200_for_existing_prediction(self, client, seeded_prediction_id):
        resp = client.get(f"/explain/{seeded_prediction_id}")
        assert resp.status_code == 200, resp.text

    def test_response_schema_fields(self, client, seeded_prediction_id):
        body = client.get(f"/explain/{seeded_prediction_id}").json()
        assert "base_value" in body
        assert "attributions" in body
        assert "prediction_id" in body
        assert "predicted_tier" in body
        assert "tier_label" in body
        assert "predicted_probability" in body
        assert "model_version" in body

    def test_attributions_non_empty_and_structured(self, client, seeded_prediction_id):
        body = client.get(f"/explain/{seeded_prediction_id}").json()
        attrs = body["attributions"]
        assert len(attrs) == 5, f"Expected 5 selected features, got {len(attrs)}"

        for item in attrs:
            assert "feature" in item
            assert "shap_value" in item
            assert isinstance(item["feature"], str)
            assert isinstance(item["shap_value"], (int, float))

    def test_attributions_sorted_by_absolute_value(self, client, seeded_prediction_id):
        body = client.get(f"/explain/{seeded_prediction_id}").json()
        attrs = body["attributions"]
        magnitudes = [abs(a["shap_value"]) for a in attrs]
        assert magnitudes == sorted(magnitudes, reverse=True), (
            f"Attributions not sorted descending by magnitude: {magnitudes}"
        )

    def test_not_found_returns_404(self, client):
        resp = client.get("/explain/999999999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_invalid_id_returns_422(self, client):
        resp = client.get("/explain/0")
        assert resp.status_code == 422
        resp_str = client.get("/explain/abc")
        assert resp_str.status_code == 422

    def test_superseded_model_version_returns_409(self, client):
        """A prediction logged against an inactive model registry entry returns 409."""
        db = SessionLocal()
        pred_id = None
        obsolete_id = None
        try:
            existing = (
                db.query(ModelRegistry)
                .filter(ModelRegistry.version_tag == "v0.0.1-deprecated")
                .first()
            )
            if existing:
                obsolete = existing
            else:
                obsolete = ModelRegistry(
                    version_tag="v0.0.1-deprecated",
                    cv_accuracy=0.50,
                    cv_macro_f1=0.50,
                    artifact_path="artifacts/does_not_exist.joblib",
                    is_active=False,
                )
                db.add(obsolete)
                db.commit()
                db.refresh(obsolete)
            obsolete_id = obsolete.id

            # Insert a prediction bound to obsolete model
            pred = Prediction(
                input_json=SAMPLE_PAYLOAD_LOW,
                predicted_tier=0,
                probabilities_json=[0.8, 0.1, 0.05, 0.05],
                model_version_id=obsolete.id,
            )
            db.add(pred)
            db.commit()
            db.refresh(pred)
            pred_id = pred.id

            resp = client.get(f"/explain/{pred_id}")
            assert resp.status_code == 409, f"Expected 409 Conflict, got {resp.status_code}: {resp.text}"
            assert "superseded" in resp.json()["detail"].lower()
        finally:
            if pred_id is not None:
                db.query(Prediction).filter(Prediction.id == pred_id).delete()
            if obsolete_id is not None:
                db.query(ModelRegistry).filter(ModelRegistry.id == obsolete_id).delete()
            db.commit()
            db.close()


# ---------------------------------------------------------------------------
# Test suite: TreeSHAP Additivity Check (TC-SHAP-01 / PRD Chapter 14.1)
# ---------------------------------------------------------------------------

class TestShapAdditivity:
    """
    PRD Chapter 14.1:
    'Additivity check: for every /explain response, the sum of SHAP attribution values
    plus the base value must reconstruct the model's raw output for that class
    within a small numerical tolerance — enforced as an automated test (Chapter 19).'
    """

    def test_api_additivity_on_seeded_prediction(self, client, seeded_prediction_id):
        body = client.get(f"/explain/{seeded_prediction_id}").json()
        base_value = body["base_value"]
        total_shap = sum(a["shap_value"] for a in body["attributions"])
        reconstructed = base_value + total_shap
        expected = body["predicted_probability"]

        assert abs(reconstructed - expected) < 1e-5, (
            f"Additivity violated: base_value ({base_value}) + sum(SHAP) ({total_shap}) = "
            f"{reconstructed}, but expected probability = {expected} (diff: {abs(reconstructed - expected)})"
        )

    @pytest.mark.parametrize(
        "payload,expected_tier",
        [
            (SAMPLE_PAYLOAD_LOW, 0),
            (SAMPLE_PAYLOAD_TIER_2, 2),
            (SAMPLE_PAYLOAD_HIGH, 3),
        ],
    )
    def test_additivity_across_multiple_tiers(self, client, payload, expected_tier):
        pred_resp = client.post("/predict", json=payload)
        assert pred_resp.status_code == 200
        pred_id = pred_resp.json()["prediction_id"]

        explain_resp = client.get(f"/explain/{pred_id}")
        assert explain_resp.status_code == 200
        body = explain_resp.json()

        base_value = body["base_value"]
        total_shap = sum(a["shap_value"] for a in body["attributions"])
        reconstructed = base_value + total_shap
        expected_prob = body["predicted_probability"]

        assert abs(reconstructed - expected_prob) < 1e-5, (
            f"Additivity violated for tier {body['predicted_tier']}: "
            f"reconstructed={reconstructed}, expected={expected_prob}"
        )

    def test_service_level_additivity_all_classes(self):
        """Verify service-level TreeSHAP additivity for all 4 output classes."""
        for target_class in range(4):
            result = explain_prediction(
                input_specs=SAMPLE_PAYLOAD_TIER_2,
                target_class=target_class,
            )
            base_val = result["base_value"]
            shap_sum = sum(a.shap_value for a in result["attributions"])
            prob = result["predicted_probability"]

            assert abs((base_val + shap_sum) - prob) < 1e-5, (
                f"Class {target_class} failed additivity: base={base_val}, "
                f"shap_sum={shap_sum}, reconstructed={base_val + shap_sum}, prob={prob}"
            )
