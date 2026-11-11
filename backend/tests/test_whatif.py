"""
Unit tests for `margin_model.py` and contract tests for `POST /whatif`
(PRD Chapters 5.2, 5.3, 11, 15.3, 19; TC-API-04).

Validates:
- Illustrative BOM and margin calculations are deterministic and transparent.
- Extrapolation detection flags values outside observed training ranges (PRD Ch. 15.3).
- POST /whatif re-runs inference, computes probability shifts & margin delta,
  persists a row to `whatif_simulations`, and returns the PRD Chapter 11 schema.
- Invalid adjustment feature names, negative values, or missing baseline IDs
  return 422 / 404 (never 500).
"""

from __future__ import annotations

from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

# pyrefly: ignore [missing-import]
from app.auth.jwt_handler import create_access_token  # noqa: E402
# pyrefly: ignore [missing-import]
from app.db.models import WhatIfSimulation  # noqa: E402
# pyrefly: ignore [missing-import]
from app.db.session import SessionLocal, init_db  # noqa: E402
# pyrefly: ignore [missing-import]
from app.main import app  # noqa: E402
# pyrefly: ignore [missing-import]
from app.services import inference  # noqa: E402
# pyrefly: ignore [missing-import]
from app.services.margin_model import (  # noqa: E402
    compute_whatif_margin_delta,
    detect_extrapolated_features,
    estimate_bom_cost,
    estimate_margin,
)

BASELINE_SPEC_LOW_MID = {
    "battery_power": 1100,
    "blue": 1,
    "clock_speed": 1.8,
    "dual_sim": 1,
    "fc": 4,
    "four_g": 1,
    "int_memory": 16,
    "m_dep": 0.5,
    "mobile_wt": 150,
    "n_cores": 4,
    "pc": 8,
    "px_height": 600,
    "px_width": 1000,
    "ram": 1200,
    "sc_h": 12,
    "sc_w": 7,
    "talk_time": 10,
    "three_g": 1,
    "touch_screen": 1,
    "wifi": 1,
}


@pytest.fixture(scope="module")
def client():
    init_db()
    inference.clear_model_cache()
    test_client = TestClient(app)
    test_client.headers.update({"Authorization": f"Bearer {create_access_token()}"})
    return test_client


@pytest.fixture(scope="module")
def baseline_prediction(client) -> dict:
    resp = client.post("/predict", json=BASELINE_SPEC_LOW_MID)
    assert resp.status_code == 200, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# 1. Unit tests — margin_model.py (PRD Ch. 5.3 / 15.3)
# ---------------------------------------------------------------------------

class TestMarginModelUnit:
    def test_bom_cost_increases_with_ram_and_battery(self):
        base_cost = estimate_bom_cost(BASELINE_SPEC_LOW_MID)
        upgraded = dict(BASELINE_SPEC_LOW_MID, ram=3200, battery_power=1800)
        upgraded_cost = estimate_bom_cost(upgraded)
        assert upgraded_cost > base_cost
        # Exact linear delta: (3200-1200)*0.012 + (1800-1100)*0.015 = 24.0 + 10.5 = 34.5
        assert abs((upgraded_cost - base_cost) - 34.50) < 1e-2

    def test_estimate_margin_uses_tier_midpoint(self):
        m0 = estimate_margin(BASELINE_SPEC_LOW_MID, predicted_tier=0)
        m3 = estimate_margin(BASELINE_SPEC_LOW_MID, predicted_tier=3)
        assert m3["tier_midpoint_usd"] > m0["tier_midpoint_usd"]
        assert m3["gross_margin_usd"] > m0["gross_margin_usd"]

    def test_compute_whatif_margin_delta_labels_illustrative(self):
        upgraded = dict(BASELINE_SPEC_LOW_MID, ram=3600)
        delta = compute_whatif_margin_delta(
            baseline_specs=BASELINE_SPEC_LOW_MID,
            baseline_tier=1,
            adjusted_specs=upgraded,
            resulting_tier=3,
        )
        assert delta["is_illustrative"] is True
        assert "illustrative" in delta["caveat"].lower()
        assert delta["bom_cost_delta_usd"] > 0
        assert delta["margin_estimate_delta"] > 0

    def test_extrapolation_detection_within_and_outside_bounds(self):
        assert detect_extrapolated_features(BASELINE_SPEC_LOW_MID) == []
        out_of_bounds = dict(
            BASELINE_SPEC_LOW_MID, ram=4800, battery_power=350, mobile_wt=240
        )
        flagged = detect_extrapolated_features(out_of_bounds)
        assert set(flagged) == {"battery_power", "mobile_wt", "ram"}


# ---------------------------------------------------------------------------
# 2. Contract tests — POST /whatif (PRD Ch. 11 / TC-API-04)
# ---------------------------------------------------------------------------

class TestWhatIfEndpointContract:
    def test_whatif_happy_path_upgrades_tier_and_logs_simulation(
        self, client, baseline_prediction
    ):
        pred_id = baseline_prediction["prediction_id"]
        resp = client.post(
            "/whatif",
            json={
                "baseline_prediction_id": pred_id,
                "adjustments": {"ram": 3800, "battery_power": 1900},
            },
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()

        # PRD Ch. 11 required fields
        assert "predicted_price_range" in body
        assert "predicted_tier" in body
        assert "label" in body
        assert "tier_label" in body
        assert "class_probabilities" in body
        assert "probabilities" in body
        assert "probability_shifts" in body
        assert "margin_estimate_delta" in body
        assert body["is_illustrative"] is True
        assert "illustrative" in body["caveat"].lower()

        # Upgrading RAM from 1200 -> 3800 and battery 1100 -> 1900 should shift tier up
        assert body["predicted_tier"] > body["baseline_tier"]
        assert abs(sum(body["probabilities"]) - 1.0) < 1e-5
        assert abs(sum(body["probability_shifts"])) < 1e-4

        # Verify DB persistence in whatif_simulations
        db = SessionLocal()
        try:
            sim = (
                db.query(WhatIfSimulation)
                .filter(WhatIfSimulation.id == body["simulation_id"])
                .first()
            )
            assert sim is not None
            assert sim.prediction_id == pred_id
            assert sim.resulting_tier == body["predicted_tier"]
        finally:
            db.close()

    def test_whatif_flags_extrapolated_slider_values(self, client, baseline_prediction):
        """PRD Chapter 15.3: slider values outside training bounds are flagged as extrapolated."""
        pred_id = baseline_prediction["prediction_id"]
        resp = client.post(
            "/whatif",
            json={
                "baseline_prediction_id": pred_id,
                "adjustments": {"ram": 5000, "battery_power": 2500},
            },
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["is_extrapolated"] is True
        assert "ram" in body["extrapolated_features"]
        assert "battery_power" in body["extrapolated_features"]

    def test_whatif_unknown_feature_returns_422(self, client, baseline_prediction):
        pred_id = baseline_prediction["prediction_id"]
        resp = client.post(
            "/whatif",
            json={
                "baseline_prediction_id": pred_id,
                "adjustments": {"nonexistent_spec": 100},
            },
        )
        assert resp.status_code == 422

    def test_whatif_empty_adjustments_returns_422(self, client, baseline_prediction):
        pred_id = baseline_prediction["prediction_id"]
        resp = client.post(
            "/whatif",
            json={"baseline_prediction_id": pred_id, "adjustments": {}},
        )
        assert resp.status_code == 422

    def test_whatif_negative_value_returns_422(self, client, baseline_prediction):
        pred_id = baseline_prediction["prediction_id"]
        resp = client.post(
            "/whatif",
            json={"baseline_prediction_id": pred_id, "adjustments": {"ram": -512}},
        )
        assert resp.status_code == 422

    def test_whatif_nonexistent_prediction_id_returns_404(self, client):
        resp = client.post(
            "/whatif",
            json={"baseline_prediction_id": 99999999, "adjustments": {"ram": 2048}},
        )
        assert resp.status_code == 404

