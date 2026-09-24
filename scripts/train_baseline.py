"""
Train baseline RandomForest (no RFE) with nested CV schema from PRD Ch. 12.

Writes:
  - artifacts/baseline_rf.joblib
  - artifacts/baseline_metrics.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.services.inference import (  # noqa: E402
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    build_baseline_pipeline,
    load_training_frame,
    save_model,
    validate_no_missing_features,
)


def main() -> None:
    df = load_training_frame()
    validate_no_missing_features(df)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    # Nested CV schema (PRD Ch. 12): 5 outer StratifiedKFold folds;
    # inner loop = GridSearchCV over RF hyperparams (baseline = all features, no RFE).
    # Full PRD grid is large; a reduced but structurally identical grid is used
    # so training finishes in reasonable time. Feature selection via RFECV can be integrated subsequently.
    outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    inner_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    param_grid = {
        "clf__n_estimators": [100, 200],
        "clf__max_depth": [None, 10, 20],
        "clf__min_samples_leaf": [1, 2],
    }

    pipe = build_baseline_pipeline()
    inner_search = GridSearchCV(
        estimator=pipe,
        param_grid=param_grid,
        cv=inner_cv,
        scoring="f1_macro",
        n_jobs=-1,
        refit=True,
    )

    # Unbiased outer-fold estimates of the nested procedure
    nested_scores = cross_val_score(
        inner_search,
        X_train,
        y_train,
        cv=outer_cv,
        scoring="f1_macro",
        n_jobs=-1,
    )

    # Fit inner search on full train for final model selection, then evaluate once on test
    inner_search.fit(X_train, y_train)
    best_model = inner_search.best_estimator_
    y_pred = best_model.predict(X_test)

    accuracy = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))

    artifact_path = save_model(best_model)
    metrics = {
        "model": "baseline_random_forest_no_rfe",
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "n_features": len(FEATURE_COLUMNS),
        "best_params": inner_search.best_params_,
        "nested_cv_macro_f1_mean": float(np.mean(nested_scores)),
        "nested_cv_macro_f1_std": float(np.std(nested_scores)),
        "nested_cv_macro_f1_folds": [float(s) for s in nested_scores],
        "holdout_accuracy": accuracy,
        "holdout_macro_f1": macro_f1,
        "artifact_path": str(artifact_path.relative_to(REPO_ROOT)),
        "random_state": RANDOM_STATE,
    }

    metrics_path = REPO_ROOT / "artifacts" / "baseline_metrics.json"
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
