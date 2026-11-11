"""
Execute PRD Chapter 15 Error Analysis against the real trained model (`artifacts/tuned_rfecv_rf.joblib`).

Computes and exports to `artifacts/error_analysis.json`:
1. Full 4x4 confusion matrix on the held-out 20% test set (400 devices).
2. Per-class precision, recall, F1-score, and support.
3. Boundary (adjacent-tier, |y_hat - y| == 1) vs. Severe (|y_hat - y| >= 2) misclassification breakdown (PRD Ch. 15.1).
4. Confidence calibration comparison between correct predictions and misclassified boundary predictions.
5. Out-of-distribution (OOD) behavior on `data/test_fixtures/out_of_distribution.csv` and boundary behavior on `data/test_fixtures/boundary_valid.csv`.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys
from typing import Any, cast

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

# pyrefly: ignore [missing-import]
from app.schemas.prediction import TIER_LABELS  # noqa: E402
# pyrefly: ignore [missing-import]
from app.services.inference import (  # noqa: E402
    FEATURE_COLUMNS,
    RANDOM_STATE,
    SELECTED_FEATURES,
    TARGET_COLUMN,
    TUNED_ARTIFACT_PATH,
    load_model,
    load_training_frame,
)
# pyrefly: ignore [missing-import]
from app.services.shap_service import explain_prediction  # noqa: E402


def run_error_analysis() -> dict[str, Any]:
    # 1. Load dataset & reproduce exact 80/20 stratified hold-out split
    df = load_training_frame()
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int)

    _X_train, X_test, _y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    X_test_df = pd.DataFrame(X_test, columns=pd.Index(FEATURE_COLUMNS)).reset_index(
        drop=True
    )
    pipeline = load_model(TUNED_ARTIFACT_PATH, force_reload=True)
    y_pred = np.asarray(pipeline.predict(X_test_df), dtype=int)
    y_proba = np.asarray(pipeline.predict_proba(X_test_df), dtype=float)

    cm = np.asarray(confusion_matrix(y_test, y_pred), dtype=int)
    report_raw = classification_report(y_test, y_pred, output_dict=True)
    report = cast(dict[str, Any], report_raw)
    acc = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))

    # 2. Boundary vs. Severe Misclassification Breakdown (PRD Chapter 15.1)
    y_true_arr = np.asarray(y_test, dtype=int)
    y_pred_arr = np.asarray(y_pred, dtype=int)
    tier_diffs = np.abs(y_pred_arr - y_true_arr)

    n_total = int(len(y_true_arr))
    n_correct = int(np.sum(tier_diffs == 0))
    n_errors = int(np.sum(tier_diffs > 0))
    n_adjacent_errors = int(np.sum(tier_diffs == 1))
    n_severe_2step = int(np.sum(tier_diffs == 2))
    n_severe_3step = int(np.sum(tier_diffs == 3))
    n_severe_total = int(np.sum(tier_diffs >= 2))

    # Pairwise error breakdown
    adjacent_pairs: dict[str, int] = {}
    for actual, pred in [(0, 1), (1, 0), (1, 2), (2, 1), (2, 3), (3, 2)]:
        count = int(cm[actual, pred])
        key = f"Tier {actual} ({TIER_LABELS[actual]}) -> Tier {pred} ({TIER_LABELS[pred]})"
        adjacent_pairs[key] = count

    # Confidence analysis on correct vs. misclassified samples
    max_probs = np.max(y_proba, axis=1)
    correct_mask = tier_diffs == 0
    error_mask = tier_diffs > 0

    mean_conf_correct = float(np.mean(max_probs[correct_mask]))
    median_conf_correct = float(np.median(max_probs[correct_mask]))
    mean_conf_errors = float(np.mean(max_probs[error_mask])) if n_errors > 0 else 0.0
    median_conf_errors = float(np.median(max_probs[error_mask])) if n_errors > 0 else 0.0

    # Collect detailed misclassified examples
    misclassified_samples: list[dict[str, Any]] = []
    error_indices = [int(i) for i in np.flatnonzero(error_mask).tolist()]
    for idx in error_indices:
        row_series = X_test_df.iloc[idx]
        selected_specs = {col: float(row_series[col]) for col in SELECTED_FEATURES}
        probs = [round(float(p), 4) for p in y_proba[idx].tolist()]
        true_tier = int(y_true_arr[idx])
        pred_tier = int(y_pred_arr[idx])
        misclassified_samples.append(
            {
                "test_index": idx,
                "actual_tier": true_tier,
                "predicted_tier": pred_tier,
                "tier_step_error": int(tier_diffs[idx]),
                "max_probability": round(float(max_probs[idx]), 4),
                "true_class_probability": round(float(y_proba[idx][true_tier]), 4),
                "probabilities": probs,
                "selected_specs": selected_specs,
            }
        )

    # 3. Evaluate on data/test_fixtures/out_of_distribution.csv
    ood_path = REPO_ROOT / "data" / "test_fixtures" / "out_of_distribution.csv"
    ood_df = pd.read_csv(ood_path)
    ood_X = ood_df[FEATURE_COLUMNS]
    ood_preds = np.asarray(pipeline.predict(ood_X), dtype=int)
    ood_probas = np.asarray(pipeline.predict_proba(ood_X), dtype=float)

    ood_results: list[dict[str, Any]] = []
    for row_idx in range(len(ood_df)):
        row = ood_df.iloc[row_idx]
        pred_tier = int(ood_preds[row_idx])
        row_proba = ood_probas[row_idx]
        probs = [round(float(p), 4) for p in row_proba.tolist()]
        max_p = round(float(np.max(row_proba)), 4)
        # Shannon entropy across 4 classes (max entropy = ln(4) ≈ 1.3863)
        clipped = np.clip(row_proba, 1e-9, 1.0)
        entropy = float(-np.sum(clipped * np.log(clipped)))

        row_dict: dict[str, Any] = {col: float(row[col]) for col in FEATURE_COLUMNS}
        shap_info = explain_prediction(
            row_dict, target_class=pred_tier, pipeline=pipeline
        )
        top_attributions = [
            {
                "feature": a.feature,
                "feature_value": a.feature_value,
                "shap_value": round(float(a.shap_value), 4),
            }
            for a in shap_info["attributions"]
        ]

        ood_results.append(
            {
                "row_index": row_idx,
                "edge_case_type": str(row["edge_case_type"]),
                "selected_specs": {
                    col: float(row[col]) for col in SELECTED_FEATURES
                },
                "predicted_tier": pred_tier,
                "tier_label": TIER_LABELS[pred_tier],
                "probabilities": probs,
                "max_confidence": max_p,
                "shannon_entropy": round(entropy, 4),
                "top_shap_attributions": top_attributions,
            }
        )

    # 4. Evaluate on data/test_fixtures/boundary_valid.csv
    boundary_path = REPO_ROOT / "data" / "test_fixtures" / "boundary_valid.csv"
    boundary_df = pd.read_csv(boundary_path)
    boundary_X = boundary_df[FEATURE_COLUMNS]
    boundary_preds = np.asarray(pipeline.predict(boundary_X), dtype=int)
    boundary_probas = np.asarray(pipeline.predict_proba(boundary_X), dtype=float)

    boundary_summary = {
        "n_rows": int(len(boundary_df)),
        "tier_distribution": {
            f"Tier {t} ({TIER_LABELS[t]})": int(np.sum(boundary_preds == t))
            for t in range(4)
        },
        "mean_confidence": round(float(np.mean(np.max(boundary_probas, axis=1))), 4),
        "min_confidence": round(float(np.min(np.max(boundary_probas, axis=1))), 4),
        "max_confidence": round(float(np.max(np.max(boundary_probas, axis=1))), 4),
    }

    per_class_metrics: dict[str, dict[str, float | int]] = {}
    for t in range(4):
        tier_rep = cast(dict[str, Any], report.get(str(t), {}))
        per_class_metrics[f"Tier {t} ({TIER_LABELS[t]})"] = {
            "precision": round(float(tier_rep.get("precision", 0.0)), 4),
            "recall": round(float(tier_rep.get("recall", 0.0)), 4),
            "f1_score": round(float(tier_rep.get("f1-score", 0.0)), 4),
            "support": int(float(tier_rep.get("support", 0))),
        }

    output: dict[str, Any] = {
        "model_version": "v2.0.0-rfecv",
        "artifact_path": "artifacts/tuned_rfecv_rf.joblib",
        "test_set_size": n_total,
        "holdout_accuracy": acc,
        "holdout_macro_f1": macro_f1,
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": per_class_metrics,
        "error_severity_breakdown": {
            "total_samples": n_total,
            "correct_predictions": n_correct,
            "total_errors": n_errors,
            "error_rate_pct": round(100.0 * n_errors / n_total, 2),
            "adjacent_tier_errors_count": n_adjacent_errors,
            "adjacent_tier_share_of_errors_pct": round(
                100.0 * n_adjacent_errors / max(1, n_errors), 2
            ),
            "adjacent_tier_rate_of_total_pct": round(
                100.0 * n_adjacent_errors / n_total, 2
            ),
            "severe_2plus_tier_errors_count": n_severe_total,
            "severe_2step_count": n_severe_2step,
            "severe_3step_count": n_severe_3step,
            "severe_share_of_errors_pct": round(
                100.0 * n_severe_total / max(1, n_errors), 2
            ),
            "adjacent_direction_counts": adjacent_pairs,
        },
        "confidence_analysis": {
            "mean_confidence_correct": round(mean_conf_correct, 4),
            "median_confidence_correct": round(median_conf_correct, 4),
            "mean_confidence_errors": round(mean_conf_errors, 4),
            "median_confidence_errors": round(median_conf_errors, 4),
        },
        "misclassified_samples": misclassified_samples,
        "out_of_distribution_analysis": ood_results,
        "boundary_valid_summary": boundary_summary,
    }

    out_path = REPO_ROOT / "artifacts" / "error_analysis.json"
    out_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Saved error analysis report to {out_path}")
    return output


if __name__ == "__main__":
    res = run_error_analysis()
    print(json.dumps(res["error_severity_breakdown"], indent=2))
    print(json.dumps(res["out_of_distribution_analysis"], indent=2))
