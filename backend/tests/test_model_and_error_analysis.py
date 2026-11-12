"""
Automated Model Validation Gate & Error Analysis tests (PRD Chapters 3, 12, 15, 19, 20).

Test Case IDs covered:
- TC-CI-01: Model validation gate — asserts active model meets committed targets
  (Accuracy >= 90%, Macro F1 >= 0.88 on untouched 20% test split, and outperforms
  the 20-feature baseline using materially fewer features).
- TC-EVAL-01: Confusion matrix & adjacent-vs-severe error breakdown (PRD Ch. 15.1).
- TC-EVAL-02: Out-of-distribution (`data/test_fixtures/out_of_distribution.csv`)
  inference & probability calibration behavior (PRD Ch. 15.3).
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

import numpy as np
import pandas as pd

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

# pyrefly: ignore [missing-import]
from app.services.inference import (  # noqa: E402
    FEATURE_COLUMNS,
    SELECTED_FEATURES,
    TUNED_ARTIFACT_PATH,
    load_model,
)


class TestModelValidationGate:
    """TC-CI-01: CI Model Validation Gate (PRD Chapter 3, 12, 19)."""

    def test_tc_ci_01_tuned_model_meets_committed_targets(self):
        metrics_path = REPO_ROOT / "artifacts" / "tuned_metrics.json"
        baseline_path = REPO_ROOT / "artifacts" / "baseline_metrics.json"
        assert metrics_path.exists(), "Missing artifacts/tuned_metrics.json"
        assert baseline_path.exists(), "Missing artifacts/baseline_metrics.json"

        tuned = json.loads(metrics_path.read_text(encoding="utf-8"))
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))

        # 1. Committed PRD Chapter 3 targets on untouched 20% test set
        assert tuned["holdout_accuracy"] >= 0.90, (
            f"Hold-out accuracy {tuned['holdout_accuracy']:.4f} < 0.90 target"
        )
        assert tuned["holdout_macro_f1"] >= 0.88, (
            f"Hold-out macro F1 {tuned['holdout_macro_f1']:.4f} < 0.88 target"
        )

        # 2. 5-fold CV metrics meet committed thresholds
        assert tuned["cv_accuracy_mean"] >= 0.90
        assert tuned["cv_macro_f1_mean"] >= 0.88

        # 3. Outperforms Month 1 full-feature baseline with materially fewer features
        assert tuned["n_features"] < baseline["n_features"]
        assert tuned["n_features"] == len(SELECTED_FEATURES) == 5
        assert tuned["holdout_accuracy"] >= baseline["holdout_accuracy"]
        assert tuned["holdout_macro_f1"] >= baseline["holdout_macro_f1"]


class TestErrorAnalysisAndOOD:
    """TC-EVAL-01 & TC-EVAL-02: Error analysis and OOD fixture checks (PRD Chapter 15)."""

    def test_tc_eval_01_confusion_matrix_and_boundary_error_breakdown(self):
        err_path = REPO_ROOT / "artifacts" / "error_analysis.json"
        assert err_path.exists(), "Run scripts/run_error_analysis.py first"
        data = json.loads(err_path.read_text(encoding="utf-8"))

        cm = np.asarray(data["confusion_matrix"], dtype=int)
        assert cm.shape == (4, 4)
        assert int(cm.sum()) == 400

        # Diagonal sum matches 376/400 (94.00%)
        assert int(np.trace(cm)) == 376

        breakdown = data["error_severity_breakdown"]
        assert breakdown["total_errors"] == 24
        assert breakdown["adjacent_tier_errors_count"] == 24
        assert breakdown["severe_2plus_tier_errors_count"] == 0
        assert breakdown["adjacent_tier_share_of_errors_pct"] == 100.0

    def test_tc_eval_02_out_of_distribution_fixtures_produce_valid_probabilities(self):
        ood_path = REPO_ROOT / "data" / "test_fixtures" / "out_of_distribution.csv"
        assert ood_path.exists()
        ood_df = pd.read_csv(ood_path)
        assert len(ood_df) == 3

        pipeline = load_model(TUNED_ARTIFACT_PATH)
        preds = pipeline.predict(ood_df[FEATURE_COLUMNS])
        probas = pipeline.predict_proba(ood_df[FEATURE_COLUMNS])

        assert len(preds) == 3
        for idx in range(len(ood_df)):
            assert int(preds[idx]) in {0, 1, 2, 3}
            row_probs = probas[idx]
            assert len(row_probs) == 4
            assert abs(float(np.sum(row_probs)) - 1.0) < 1e-5
            # OOD contradictory rows should have depressed confidence (< 0.65) compared to normal inliers (~0.84)
            assert float(np.max(row_probs)) < 0.65

