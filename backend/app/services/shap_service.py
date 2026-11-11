"""
TreeSHAP explainer service (PRD Chapters 7.1, 11, 14; ADR-004).

Computes exact local feature attributions using shap.TreeExplainer on the
active RandomForestClassifier model. TreeSHAP evaluates exact Shapley values
in polynomial time, guaranteeing the mathematical additivity property:
    sum(attributions) + base_value = model_output_probability
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

# Ensure matplotlib uses a persistent writable cache directory
_mpl_cache = Path(__file__).resolve().parents[3] / "artifacts" / ".matplotlib_cache"
_mpl_cache.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(_mpl_cache))

import numpy as np
import pandas as pd
import shap
from sklearn.pipeline import Pipeline

from app.schemas.prediction import TIER_LABELS, FeatureAttribution
from app.services.inference import FEATURE_COLUMNS, load_model

_cached_explainer: shap.TreeExplainer | None = None
_cached_model_id: int | None = None


def clear_explainer_cache() -> None:
    """Clear cached explainer instance."""
    global _cached_explainer, _cached_model_id
    _cached_explainer = None
    _cached_model_id = None


def get_selected_feature_names(pipeline: Pipeline) -> list[str]:
    """Extract list of feature names consumed by the classifier."""
    pre = pipeline.named_steps.get("preprocess")
    if pre is not None and hasattr(pre, "transformers_"):
        for name, _trans, cols in pre.transformers_:
            if name != "remainder":
                return list(cols)
    return ["battery_power", "mobile_wt", "px_height", "px_width", "ram"]


def get_tree_explainer(pipeline: Pipeline | None = None) -> shap.TreeExplainer:
    """
    Get or create a cached shap.TreeExplainer for the pipeline's RandomForestClassifier.
    """
    global _cached_explainer, _cached_model_id

    target_pipeline = pipeline or load_model()
    clf = target_pipeline.named_steps["clf"]

    clf_id = id(clf)
    if _cached_explainer is not None and _cached_model_id == clf_id:
        return _cached_explainer

    explainer = shap.TreeExplainer(clf)
    _cached_explainer = explainer
    _cached_model_id = clf_id
    return explainer


def explain_prediction(
    input_specs: dict[str, Any],
    target_class: int | None = None,
    pipeline: Pipeline | None = None,
) -> dict[str, Any]:
    """
    Compute local TreeSHAP attributions for a single device specification.

    Parameters
    ----------
    input_specs : dict[str, Any]
        Device specification dictionary containing feature values.
    target_class : int | None
        Price tier to explain (0..3). If None, explains the predicted tier.
    pipeline : Pipeline | None
        Trained pipeline. If None, active model is loaded.

    Returns
    -------
    dict[str, Any] with:
        - target_class: int
        - tier_label: str
        - base_value: float
        - predicted_probability: float
        - attributions: list[FeatureAttribution] (sorted by |shap_value| desc)
    """
    active_pipe = pipeline or load_model()
    pre = active_pipe.named_steps["preprocess"]
    clf = active_pipe.named_steps["clf"]

    # Ensure full feature row (with defaults or zeroes if any are omitted)
    row = {col: input_specs.get(col, 0) for col in FEATURE_COLUMNS}
    df = pd.DataFrame([row])

    # Transform through preprocessor (ColumnTransformer)
    X_trans = pre.transform(df)

    # Class probabilities and predicted class
    probs = clf.predict_proba(X_trans)[0]
    if target_class is None:
        target_class = int(clf.predict(X_trans)[0])
    else:
        target_class = int(target_class)

    target_prob = float(probs[target_class])
    tier_label = TIER_LABELS.get(target_class, f"Tier {target_class}")

    # TreeSHAP computation
    explainer = get_tree_explainer(active_pipe)
    shap_vals = explainer.shap_values(X_trans)

    # Handle shape differences across shap versions
    # Case 1: ndarray of shape (n_samples, n_features, n_classes)
    # Case 2: list of n_classes ndarrays, each (n_samples, n_features)
    if isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 3:
        class_shap = shap_vals[0, :, target_class]
    elif isinstance(shap_vals, list):
        class_shap = shap_vals[target_class][0]
    else:
        class_shap = shap_vals[0]

    # Base value (expected value for this class)
    expected = explainer.expected_value
    if isinstance(expected, (list, np.ndarray)):
        base_val = float(expected[target_class])
    else:
        base_val = float(expected)

    # Feature names matching the classifier input
    selected_features = get_selected_feature_names(active_pipe)

    attributions: list[FeatureAttribution] = []
    for idx, feat in enumerate(selected_features):
        raw_val = input_specs.get(feat)
        feat_val = float(raw_val) if raw_val is not None else None
        attributions.append(
            FeatureAttribution(
                feature=feat,
                shap_value=float(class_shap[idx]),
                feature_value=feat_val,
            )
        )

    # Sort descending by absolute attribution magnitude (PRD Ch. 14.2)
    attributions.sort(key=lambda a: abs(a.shap_value), reverse=True)

    return {
        "target_class": target_class,
        "tier_label": tier_label,
        "base_value": base_val,
        "predicted_probability": target_prob,
        "attributions": attributions,
    }
