"""GET /health — liveness check confirming the model artifact is loadable (PRD Ch. 11)."""

from fastapi import APIRouter

from app.services.inference import DEFAULT_ARTIFACT_PATH, is_model_loadable

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    model_loaded = is_model_loadable()
    return {
        "status": "ok" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "artifact_path": str(DEFAULT_ARTIFACT_PATH),
    }
