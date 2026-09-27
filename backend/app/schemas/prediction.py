"""
Pydantic schemas for /predict and /feature-importance (PRD Ch. 11).

All 20 feature columns accepted at /predict with field-level validation
matching the dataset's known ranges so that invalid inputs fail with 422
before they ever reach the model.
"""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request schema — POST /predict
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """
    Full 20-feature device specification for price-tier prediction.

    Field bounds are derived from the Kaggle dataset (PRD Ch. 12).
    Unknown / extra fields are rejected (model='forbid').
    """

    model_config = ConfigDict(extra="forbid")

    battery_power: Annotated[int, Field(ge=500, le=2000, description="Battery capacity (mAh)")]
    blue: Annotated[int, Field(ge=0, le=1, description="Bluetooth (0/1)")]
    clock_speed: Annotated[float, Field(ge=0.5, le=3.0, description="Processor speed (GHz)")]
    dual_sim: Annotated[int, Field(ge=0, le=1, description="Dual SIM support (0/1)")]
    fc: Annotated[int, Field(ge=0, le=19, description="Front camera (MP)")]
    four_g: Annotated[int, Field(ge=0, le=1, description="4G support (0/1)")]
    int_memory: Annotated[int, Field(ge=2, le=64, description="Internal memory (GB)")]
    m_dep: Annotated[float, Field(ge=0.1, le=1.0, description="Mobile depth (cm)")]
    mobile_wt: Annotated[int, Field(ge=80, le=200, description="Weight (g)")]
    n_cores: Annotated[int, Field(ge=1, le=8, description="Number of processor cores")]
    pc: Annotated[int, Field(ge=0, le=20, description="Primary camera (MP)")]
    px_height: Annotated[int, Field(ge=0, le=1960, description="Pixel resolution height")]
    px_width: Annotated[int, Field(ge=500, le=1998, description="Pixel resolution width")]
    ram: Annotated[int, Field(ge=256, le=3998, description="RAM (MB)")]
    sc_h: Annotated[int, Field(ge=5, le=19, description="Screen height (cm)")]
    sc_w: Annotated[int, Field(ge=0, le=18, description="Screen width (cm)")]
    talk_time: Annotated[int, Field(ge=2, le=20, description="Battery talk time (h)")]
    three_g: Annotated[int, Field(ge=0, le=1, description="3G support (0/1)")]
    touch_screen: Annotated[int, Field(ge=0, le=1, description="Touch screen (0/1)")]
    wifi: Annotated[int, Field(ge=0, le=1, description="WiFi support (0/1)")]


# ---------------------------------------------------------------------------
# Response schema — POST /predict
# ---------------------------------------------------------------------------

TIER_LABELS: dict[int, str] = {
    0: "Low",
    1: "Mid",
    2: "Mid-High",
    3: "High",
}


class PredictResponse(BaseModel):
    """Prediction result with tier label and per-class probabilities."""

    predicted_tier: int = Field(..., ge=0, le=3, description="Predicted price-range class (0–3)")
    tier_label: str = Field(..., description="Human-readable tier label")
    probabilities: list[float] = Field(
        ...,
        description="Softmax-style class probabilities [tier0, tier1, tier2, tier3]",
    )
    model_version: str = Field(..., description="Active model version tag from model_registry")
    prediction_id: int = Field(..., description="Row id from the predictions table")


# ---------------------------------------------------------------------------
# Response schema — GET /feature-importance
# ---------------------------------------------------------------------------

class FeatureImportanceItem(BaseModel):
    """Single feature with its RFECV rank and RF importance score."""

    feature: str
    importance: float = Field(..., ge=0.0, le=1.0)
    rank: int = Field(..., ge=1, description="RFECV ranking (1 = selected)")
    selected: bool = Field(..., description="True if RFECV included the feature")


class FeatureImportanceResponse(BaseModel):
    """Ordered list of all features by RF mean decrease in impurity."""

    features: list[FeatureImportanceItem]
    model_version: str
    n_selected: int
