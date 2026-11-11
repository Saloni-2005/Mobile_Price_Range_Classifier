"""
POST /whatif — Assisted Pricing Optimization Engine what-if simulation endpoint
(PRD Chapters 5.2, 5.3, 10.4, 11, 15.3).

Accepts a baseline prediction ID and specification adjustments (slider deltas),
re-runs inference on the active model, computes the illustrative margin delta,
flags extrapolated features, and logs a record to `whatif_simulations`.
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
from sqlalchemy.orm import Session

from app.auth.jwt_handler import require_analyst_jwt
from app.db.models import ModelRegistry, Prediction, WhatIfSimulation
from app.db.session import SessionLocal, init_db
from app.schemas.prediction import (
    TIER_LABELS,
    VALID_FEATURE_NAMES,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.inference import (
    FEATURE_COLUMNS,
    get_active_model_version,
    load_model,
)
from app.services.margin_model import compute_whatif_margin_delta

router = APIRouter(tags=["whatif"])


def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/whatif", response_model=WhatIfResponse, status_code=200)
def whatif(
    body: WhatIfRequest,
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_analyst_jwt),
) -> WhatIfResponse:
    """
    Simulate specification trade-offs against a logged baseline prediction.

    - Validates adjustment feature names and physical non-negativity (422 on invalid).
    - Allows slider values beyond training range and flags them as extrapolated (PRD Ch. 15.3).
    - Re-scores with active model pipeline.
    - Computes illustrative BOM & margin delta (PRD Ch. 5.3).
    - Persists simulation to `whatif_simulations` table (PRD Ch. 9).
    """
    # 1. Validate adjustment feature names and numeric values
    unknown_keys = [k for k in body.adjustments if k not in VALID_FEATURE_NAMES]
    if unknown_keys:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown specification feature(s) in adjustments: {unknown_keys}",
        )

    for feat, val in body.adjustments.items():
        if isinstance(val, bool) or not isinstance(val, (int, float)):
            raise HTTPException(
                status_code=422,
                detail=f"Adjustment value for '{feat}' must be a number.",
            )
        if math.isnan(float(val)) or math.isinf(float(val)) or float(val) < 0:
            raise HTTPException(
                status_code=422,
                detail=f"Adjustment value for '{feat}' must be a non-negative finite number.",
            )

    # 2. Fetch baseline prediction
    baseline_pred = (
        db.query(Prediction)
        .filter(Prediction.id == body.baseline_prediction_id)
        .first()
    )
    if baseline_pred is None:
        raise HTTPException(
            status_code=404,
            detail=f"Baseline prediction #{body.baseline_prediction_id} not found.",
        )

    # 3. Merge baseline specs with adjustments
    baseline_specs = dict(baseline_pred.input_json)
    adjusted_specs = dict(baseline_specs)
    for feat, val in body.adjustments.items():
        adjusted_specs[feat] = val

    # Ensure full 20-column ordering for the pipeline
    ordered_row = {col: adjusted_specs.get(col, 0) for col in FEATURE_COLUMNS}
    df = pd.DataFrame([ordered_row])

    # 4. Run inference on adjusted specs
    try:
        pipeline = load_model()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503, detail=f"Model artifact unavailable: {exc}"
        ) from exc

    resulting_tier = int(pipeline.predict(df)[0])
    resulting_probs = [float(p) for p in pipeline.predict_proba(df)[0].tolist()]

    baseline_tier = int(baseline_pred.predicted_tier)
    baseline_probs = [float(p) for p in baseline_pred.probabilities_json]
    prob_shifts = [
        round(adj_p - base_p, 6)
        for adj_p, base_p in zip(resulting_probs, baseline_probs)
    ]

    # 5. Compute illustrative BOM & margin delta + extrapolation flags
    margin_info = compute_whatif_margin_delta(
        baseline_specs=baseline_specs,
        baseline_tier=baseline_tier,
        adjusted_specs=ordered_row,
        resulting_tier=resulting_tier,
    )

    # 6. Persist simulation row to `whatif_simulations`
    sim_row = WhatIfSimulation(
        prediction_id=baseline_pred.id,
        adjusted_spec_json=ordered_row,
        resulting_tier=resulting_tier,
        margin_estimate=margin_info["resulting_margin_usd"],
    )
    db.add(sim_row)
    db.commit()
    db.refresh(sim_row)

    active_reg = (
        db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).first()
    )
    model_version = (
        active_reg.version_tag if active_reg else get_active_model_version()
    )

    resulting_label = TIER_LABELS.get(resulting_tier, f"Tier {resulting_tier}")
    baseline_label = TIER_LABELS.get(baseline_tier, f"Tier {baseline_tier}")

    return WhatIfResponse(
        simulation_id=sim_row.id,
        baseline_prediction_id=baseline_pred.id,
        baseline_tier=baseline_tier,
        baseline_label=baseline_label,
        baseline_probabilities=baseline_probs,
        predicted_tier=resulting_tier,
        predicted_price_range=resulting_tier,
        tier_label=resulting_label,
        label=resulting_label,
        probabilities=resulting_probs,
        class_probabilities=resulting_probs,
        probability_shifts=prob_shifts,
        margin_estimate=margin_info["resulting_margin_usd"],
        margin_estimate_delta=margin_info["margin_estimate_delta"],
        margin_pct_delta=margin_info["margin_pct_delta"],
        baseline_bom_usd=margin_info["baseline_bom_usd"],
        adjusted_bom_usd=margin_info["adjusted_bom_usd"],
        bom_cost_delta_usd=margin_info["bom_cost_delta_usd"],
        baseline_tier_midpoint_usd=margin_info["baseline_tier_midpoint_usd"],
        resulting_tier_midpoint_usd=margin_info["resulting_tier_midpoint_usd"],
        adjusted_specs=ordered_row,
        is_extrapolated=margin_info["is_extrapolated"],
        extrapolated_features=margin_info["extrapolated_features"],
        is_illustrative=True,
        caveat=margin_info["caveat"],
        model_version=model_version,
    )
