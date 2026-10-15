"""
Model loading and preprocessing pipeline for price-range inference.

Pipeline logic aligned with notebooks/eda_and_baseline.ipynb.
Prediction endpoints (/predict, /whatif) are intentionally not implemented yet.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# Spec features only — excludes target and merge metadata columns.
FEATURE_COLUMNS: list[str] = [
    "battery_power",
    "blue",
    "clock_speed",
    "dual_sim",
    "fc",
    "four_g",
    "int_memory",
    "m_dep",
    "mobile_wt",
    "n_cores",
    "pc",
    "px_height",
    "px_width",
    "ram",
    "sc_h",
    "sc_w",
    "talk_time",
    "three_g",
    "touch_screen",
    "wifi",
]

TARGET_COLUMN = "price_range"
SOURCE_COLUMN = "source"
TRAIN_SOURCE_VALUE = "synthetic_train"
RANDOM_STATE = 42

# Default and tuned artifact locations
_REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ARTIFACT_PATH = _REPO_ROOT / "artifacts" / "baseline_rf.joblib"
TUNED_ARTIFACT_PATH = _REPO_ROOT / "artifacts" / "tuned_rfecv_rf.joblib"

# RFE-selected top features
SELECTED_FEATURES: list[str] = [
    "battery_power",
    "mobile_wt",
    "px_height",
    "px_width",
    "ram",
]

_model: Pipeline | None = None


def get_active_artifact_path() -> Path:
    """Return path to active model artifact from registry or disk fallback."""
    try:
        from app.db.models import ModelRegistry
        from app.db.session import SessionLocal

        db = SessionLocal()
        active = (
            db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).first()
        )
        db.close()
        if active and active.artifact_path:
            p = _REPO_ROOT / active.artifact_path
            if p.exists():
                return p
    except Exception:
        pass
    if TUNED_ARTIFACT_PATH.exists():
        return TUNED_ARTIFACT_PATH
    return DEFAULT_ARTIFACT_PATH


def project_root() -> Path:
    return _REPO_ROOT


def default_cleaned_csv_path() -> Path:
    return _REPO_ROOT / "data" / "processed" / "train_cleaned.csv"


def default_merged_csv_path() -> Path:
    preferred = _REPO_ROOT / "data" / "raw" / "merged_dataset.csv"
    if preferred.exists():
        return preferred
    return _REPO_ROOT / "data" / "raw" / "merged_dataset_PLACEHOLDER.csv"


def load_training_frame(csv_path: Path | None = None) -> pd.DataFrame:
    """
    Load training frame for modeling.

    Prefers data/processed/train_cleaned.csv when available.
    Supports merged_dataset.csv and merged_dataset_PLACEHOLDER.csv (filtering out fixtures).
    """
    if csv_path is None:
        cleaned_path = default_cleaned_csv_path()
        if cleaned_path.exists():
            return pd.read_csv(cleaned_path)
        path = default_merged_csv_path()
    else:
        path = csv_path

    df = pd.read_csv(path)
    if SOURCE_COLUMN in df.columns:
        valid_sources = ["kaggle_train", "synthetic_train"]
        train = df.loc[df[SOURCE_COLUMN].isin(valid_sources)].copy()
        if train.empty:
            raise ValueError(f"No rows with {SOURCE_COLUMN} in {valid_sources}")
        return train.reset_index(drop=True)

    validate_no_missing_features(df)
    return df.reset_index(drop=True)


def validate_no_missing_features(df: pd.DataFrame) -> None:
    """Assert training features and target have no missing values."""
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    null_counts = df[FEATURE_COLUMNS + [TARGET_COLUMN]].isna().sum()
    bad = null_counts[null_counts > 0]
    if not bad.empty:
        raise ValueError(
            "Unexpected missing values in training features/target:\n"
            + bad.to_string()
        )


def build_baseline_pipeline(
    n_estimators: int = 200,
    max_depth: int | None = None,
    min_samples_leaf: int = 1,
) -> Pipeline:
    """
    scikit-learn Pipeline: scale numeric features, then RandomForest (all features).

    Trees do not require scaling; StandardScaler is included for a reusable,
    production-shaped pipeline and for future non-tree estimators.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("scale", StandardScaler(), FEATURE_COLUMNS),
        ],
        remainder="drop",
    )
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("clf", clf),
        ]
    )


def save_model(model: Any, path: Path | None = None) -> Path:
    path = path or DEFAULT_ARTIFACT_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    return path


def load_model(path: Path | None = None, *, force_reload: bool = False) -> Pipeline:
    """Load (and cache) the trained pipeline artifact."""
    global _model
    artifact = path or get_active_artifact_path()
    if _model is not None and not force_reload and path is None:
        return _model
    if not artifact.exists():
        raise FileNotFoundError(f"Model artifact not found: {artifact}")
    model = joblib.load(artifact)
    if path is None:
        _model = model
    return model


def is_model_loadable(path: Path | None = None) -> bool:
    """Return True if the model artifact exists and can be loaded via joblib."""
    artifact = path or DEFAULT_ARTIFACT_PATH
    try:
        load_model(artifact, force_reload=True)
        return True
    except Exception:
        return False


def clear_model_cache() -> None:
    global _model
    _model = None


# ---------------------------------------------------------------------------
# Registry helpers
# ---------------------------------------------------------------------------

def get_active_model_version() -> str:
    """Return the version_tag of the active model_registry entry."""
    try:
        from app.db.models import ModelRegistry
        from app.db.session import SessionLocal

        db = SessionLocal()
        active = db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).first()
        db.close()
        if active:
            return active.version_tag
    except Exception:
        pass
    return "unknown"


# ---------------------------------------------------------------------------
# Feature-importance helpers
# ---------------------------------------------------------------------------

def get_feature_importance() -> list[dict]:
    """
    Return per-feature importance + RFECV rank from the active Pipeline.

    The tuned pipeline built in train_tuned.py has:
      pipeline["preprocess"] = ColumnTransformer (selected features only)
      pipeline["clf"]        = RandomForestClassifier

    The function handles both:
    - tuned pipeline: ColumnTransformer whose transformers list column names
    - baseline pipeline: ColumnTransformer over all FEATURE_COLUMNS
    """
    import numpy as np

    pipeline = load_model()
    clf = pipeline.named_steps["clf"]
    preprocessor = pipeline.named_steps["preprocess"]

    # Determine which features the pipeline was trained on
    # ColumnTransformer stores them as (name, transformer, columns)
    transformer_cols: list[str] = []
    for _, _, cols in preprocessor.transformers_:
        if isinstance(cols, list):
            transformer_cols.extend(cols)
        elif hasattr(cols, "tolist"):
            transformer_cols.extend(cols.tolist())

    trained_features = transformer_cols if transformer_cols else FEATURE_COLUMNS

    # RF importance array aligns with trained_features
    importances: list[float] = clf.feature_importances_.tolist()

    # Build a lookup: feature -> importance for trained features
    trained_imp = dict(zip(trained_features, importances))

    # Rank all FEATURE_COLUMNS: selected (rank=1) vs eliminated (rank > 1)
    # Use importance as proxy for rank among eliminated features
    result = []
    non_selected_feats = [f for f in FEATURE_COLUMNS if f not in trained_features]
    # Assign pseudo-ranks >= 2 to eliminated features (sorted by 0 importance)
    pseudo_rank = 2
    pseudo_ranks: dict[str, int] = {}
    for feat in non_selected_feats:
        pseudo_ranks[feat] = pseudo_rank
        pseudo_rank += 1

    for feat in FEATURE_COLUMNS:
        if feat in trained_imp:
            result.append(
                {
                    "feature": feat,
                    "importance": round(trained_imp[feat], 6),
                    "rank": 1,
                    "selected": True,
                }
            )
        else:
            result.append(
                {
                    "feature": feat,
                    "importance": 0.0,
                    "rank": pseudo_ranks[feat],
                    "selected": False,
                }
            )

    # Sort by importance descending
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result
