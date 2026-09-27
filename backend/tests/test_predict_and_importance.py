"""
Contract tests for POST /predict and GET /feature-importance (PRD Ch. 11 / 19).

Coverage per spec:
- Happy path: valid request → 200 with correct schema.
- Validation error: missing/invalid field → 422 (never 500).
- Boundary-valid CSV: all rows from data/test_fixtures/boundary_valid.csv
  must return 200 with a sane tier without crashing.
- Invalid payloads JSON: all entries from data/test_fixtures/invalid_payloads.json
  must return 422.
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app  # noqa: E402
from app.services import inference  # noqa: E402

# ---------------------------------------------------------------------------
# Fixtures & helpers
# ---------------------------------------------------------------------------

TUNED_ARTIFACT = REPO_ROOT / "artifacts" / "tuned_rfecv_rf.joblib"
FIXTURES_DIR = REPO_ROOT / "data" / "test_fixtures"

VALID_PAYLOAD = {
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
def client():
    """TestClient that uses the tuned artifact; skips all tests if missing."""
    assert TUNED_ARTIFACT.exists(), (
        f"Tuned artifact missing: {TUNED_ARTIFACT}. Run: python scripts/train_tuned.py"
    )
    # Ensure the module-level cache is primed with the tuned pipeline
    inference.clear_model_cache()
    inference._REPO_ROOT  # touch module to ensure init
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /predict — happy path
# ---------------------------------------------------------------------------

class TestPredictHappyPath:
    def test_status_200(self, client):
        resp = client.post("/predict", json=VALID_PAYLOAD)
        assert resp.status_code == 200, resp.text

    def test_response_schema_fields(self, client):
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert "predicted_tier" in body
        assert "tier_label" in body
        assert "probabilities" in body
        assert "model_version" in body
        assert "prediction_id" in body

    def test_predicted_tier_in_range(self, client):
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert body["predicted_tier"] in (0, 1, 2, 3)

    def test_tier_label_matches_tier(self, client):
        from app.schemas.prediction import TIER_LABELS
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert body["tier_label"] == TIER_LABELS[body["predicted_tier"]]

    def test_probabilities_sum_to_one(self, client):
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert len(body["probabilities"]) == 4
        assert abs(sum(body["probabilities"]) - 1.0) < 1e-5

    def test_prediction_id_is_positive_int(self, client):
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert isinstance(body["prediction_id"], int)
        assert body["prediction_id"] > 0

    def test_model_version_not_empty(self, client):
        body = client.post("/predict", json=VALID_PAYLOAD).json()
        assert body["model_version"] not in ("", None)


# ---------------------------------------------------------------------------
# POST /predict — validation-error cases from invalid_payloads.json
# ---------------------------------------------------------------------------

class TestPredictValidationErrors:
    @pytest.fixture(autouse=True)
    def _load_invalid(self):
        path = FIXTURES_DIR / "invalid_payloads.json"
        assert path.exists(), f"Missing fixture: {path}"
        with open(path, encoding="utf-8") as f:
            self.invalid_payloads = json.load(f)

    def test_missing_required_field_ram_gives_422(self, client):
        """Payload without 'ram' must be rejected with 422."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "ram"}
        resp = client.post("/predict", json=payload)
        assert resp.status_code == 422

    def test_empty_payload_gives_422(self, client):
        resp = client.post("/predict", json={})
        assert resp.status_code == 422

    def test_all_invalid_payloads_never_500(self, client):
        """Every entry in invalid_payloads.json must return 422, never 5xx."""
        for entry in self.invalid_payloads:
            name = entry["name"]
            payload = entry["payload"]
            resp = client.post("/predict", json=payload)
            assert resp.status_code in (422,), (
                f"[{name}] Expected 422 but got {resp.status_code}: {resp.text}"
            )

    def test_all_invalid_payloads_not_500(self, client):
        """Extra insurance: none of the invalid payloads should cause a 500."""
        for entry in self.invalid_payloads:
            name = entry["name"]
            resp = client.post("/predict", json=entry["payload"])
            assert resp.status_code < 500, (
                f"[{name}] Got server error {resp.status_code}: {resp.text}"
            )


# ---------------------------------------------------------------------------
# POST /predict — boundary_valid.csv: every row must return 200, sane tier
# ---------------------------------------------------------------------------

class TestPredictBoundaryValid:
    @pytest.fixture(autouse=True)
    def _load_csv(self):
        path = FIXTURES_DIR / "boundary_valid.csv"
        assert path.exists(), f"Missing fixture: {path}"
        self.boundary_df = pd.read_csv(path)

    def test_all_boundary_rows_return_200(self, client):
        from app.schemas.prediction import PredictRequest

        feature_cols = list(PredictRequest.model_fields.keys())
        failures = []
        for idx, row in self.boundary_df.iterrows():
            # Build payload with only the 20 feature columns
            payload = {}
            for col in feature_cols:
                val = row.get(col)
                if pd.isna(val):
                    continue
                # Cast to int for integer fields, float for float fields
                field_info = PredictRequest.model_fields[col]
                annotation = str(field_info.annotation)
                if "float" in annotation.lower():
                    payload[col] = float(val)
                else:
                    payload[col] = int(val)

            resp = client.post("/predict", json=payload)
            if resp.status_code != 200:
                edge_case = row.get("edge_case_type", f"row_{idx}")
                failures.append(f"[{edge_case}] status={resp.status_code}: {resp.text[:200]}")

        assert not failures, "\n".join(failures)

    def test_all_boundary_tiers_in_range(self, client):
        from app.schemas.prediction import PredictRequest

        feature_cols = list(PredictRequest.model_fields.keys())
        for idx, row in self.boundary_df.iterrows():
            payload = {}
            for col in feature_cols:
                val = row.get(col)
                if pd.isna(val):
                    continue
                field_info = PredictRequest.model_fields[col]
                annotation = str(field_info.annotation)
                if "float" in annotation.lower():
                    payload[col] = float(val)
                else:
                    payload[col] = int(val)

            resp = client.post("/predict", json=payload)
            if resp.status_code == 200:
                tier = resp.json()["predicted_tier"]
                assert tier in (0, 1, 2, 3), f"row {idx}: unexpected tier {tier}"


# ---------------------------------------------------------------------------
# GET /feature-importance — happy path
# ---------------------------------------------------------------------------

class TestFeatureImportanceHappyPath:
    def test_status_200(self, client):
        resp = client.get("/feature-importance")
        assert resp.status_code == 200, resp.text

    def test_response_schema_fields(self, client):
        body = client.get("/feature-importance").json()
        assert "features" in body
        assert "model_version" in body
        assert "n_selected" in body

    def test_returns_all_20_features(self, client):
        body = client.get("/feature-importance").json()
        assert len(body["features"]) == 20

    def test_each_feature_has_required_keys(self, client):
        body = client.get("/feature-importance").json()
        for item in body["features"]:
            assert "feature" in item
            assert "importance" in item
            assert "rank" in item
            assert "selected" in item

    def test_selected_features_count_matches_n_selected(self, client):
        body = client.get("/feature-importance").json()
        n_selected_from_list = sum(1 for f in body["features"] if f["selected"])
        assert n_selected_from_list == body["n_selected"]

    def test_selected_features_have_rank_1(self, client):
        body = client.get("/feature-importance").json()
        for feat in body["features"]:
            if feat["selected"]:
                assert feat["rank"] == 1, (
                    f"Selected feature {feat['feature']} has rank {feat['rank']}, expected 1"
                )

    def test_importances_sum_to_approx_one(self, client):
        body = client.get("/feature-importance").json()
        total = sum(f["importance"] for f in body["features"])
        # Only selected features contribute; sum of RF importances = 1.0
        assert abs(total - 1.0) < 1e-4, f"Importance sum = {total}, expected ~1.0"

    def test_model_version_not_empty(self, client):
        body = client.get("/feature-importance").json()
        assert body["model_version"] not in ("", None)
