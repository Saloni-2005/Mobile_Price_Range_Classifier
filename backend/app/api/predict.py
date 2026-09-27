"""
POST /predict — price-tier prediction with DB logging (PRD Ch. 11).

Loads the active model_registry pipeline, returns predicted tier +
class probabilities, and writes a row to the predictions table.
"""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import ModelRegistry, Prediction
from app.db.session import SessionLocal, init_db
from app.schemas.prediction import (
    TIER_LABELS,
    PredictRequest,
    PredictResponse,
)
from app.services.inference import (
    FEATURE_COLUMNS,
    get_active_artifact_path,
    get_active_model_version,
    load_model,
)

router = APIRouter(tags=["predict"])


# ---------------------------------------------------------------------------
# DB dependency
# ---------------------------------------------------------------------------

def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/predict", response_model=PredictResponse, status_code=200)
def predict(body: PredictRequest, db: Session = Depends(get_db)) -> PredictResponse:
    """
    Predict mobile price tier from device specifications.

    - Validates all 20 feature fields via Pydantic (422 on bad input).
    - Loads the active model artifact (tuned RFECV pipeline by default).
    - Logs input + result to the `predictions` table.
    - Returns predicted tier (0–3), human label, and per-class probabilities.
    """
    # 1. Load model
    try:
        pipeline = load_model()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Model artifact unavailable: {exc}") from exc

    # 2. Build input DataFrame in the correct column order
    row = {col: getattr(body, col) for col in FEATURE_COLUMNS}
    df = pd.DataFrame([row])

    # 3. Predict
    predicted_tier = int(pipeline.predict(df)[0])
    probabilities = pipeline.predict_proba(df)[0].tolist()

    # 4. Resolve active model_registry row (for FK)
    active_registry = (
        db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).first()
    )
    if active_registry is None:
        raise HTTPException(
            status_code=503,
            detail="No active model found in model_registry. Run train_tuned.py first.",
        )

    # 5. Log to predictions table
    pred_row = Prediction(
        input_json=row,
        predicted_tier=predicted_tier,
        probabilities_json=probabilities,
        model_version_id=active_registry.id,
    )
    db.add(pred_row)
    db.commit()
    db.refresh(pred_row)

    return PredictResponse(
        predicted_tier=predicted_tier,
        tier_label=TIER_LABELS[predicted_tier],
        probabilities=probabilities,
        model_version=active_registry.version_tag,
        prediction_id=pred_row.id,
    )
