"""
GET /feature-importance — global RF feature importance + RFECV ranks (PRD Ch. 11).

Returns all 20 features ordered by mean-decrease-in-impurity importance,
annotating which were retained by RFECV (rank=1) vs. eliminated (rank>=2).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.prediction import FeatureImportanceItem, FeatureImportanceResponse
from app.services.inference import get_active_model_version, get_feature_importance

router = APIRouter(tags=["importance"])


@router.get("/feature-importance", response_model=FeatureImportanceResponse)
def feature_importance() -> FeatureImportanceResponse:
    """
    Return RF feature importances and RFECV selection status.

    - Pulls importances directly from the active loaded pipeline's RF step.
    - Selected features (rank=1) are those included by RFECV.
    - Eliminated features have importance=0.0 and rank>=2.
    - Results are sorted by importance descending.
    """
    try:
        items_raw = get_feature_importance()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=f"Model artifact unavailable: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to compute importances: {exc}") from exc

    items = [FeatureImportanceItem(**item) for item in items_raw]
    n_selected = sum(1 for i in items if i.selected)
    version = get_active_model_version()

    return FeatureImportanceResponse(
        features=items,
        model_version=version,
        n_selected=n_selected,
    )
