"""
Train tuned RFECV + Random Forest model (PRD Chapter 12.2).

Performs:
1. 80/20 stratified split (seed=42) on cleaned Kaggle dataset.
2. RFECV feature selection (cv=5, scoring='f1_macro', step=1, min_features_to_select tuned 5-15).
3. GridSearchCV over RandomForest hyperparameters on selected features:
   n_estimators in {100, 200, 400}, max_depth in {None, 10, 20}, min_samples_leaf in {1, 2, 4}.
4. Final evaluation on untouched hold-out 20% test set (verifying Accuracy >= 90%, macro F1 >= 0.88).
5. Build and serialize scikit-learn Pipeline with ColumnTransformer to artifacts/tuned_rfecv_rf.joblib.
6. Register the active model in the database model_registry table.
7. Save evaluation metrics to artifacts/tuned_metrics.json.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import RFECV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.db.models import ModelRegistry
from app.db.session import SessionLocal, init_db
from app.services.inference import (
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    load_training_frame,
)


def run_tuned_pipeline():
    print("=" * 60)
    print("Mobile Price-Range Classifier — Tuned RFECV + RF Training")
    print("=" * 60)

    # 1. Load data
    df = load_training_frame()
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].astype(int)
    print(f"Loaded {len(df)} rows, {len(FEATURE_COLUMNS)} features.")

    # 2. 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )
    print(f"Train split: {len(X_train)} rows | Test split: {len(X_test)} rows")

    # Scale for RFECV
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=FEATURE_COLUMNS)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=FEATURE_COLUMNS)

    # 3. RFECV feature selection
    print("\n[Step 1] Running RFECV feature selection (cv=5, scoring='f1_macro')...")
    cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    base_rf = RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1)

    rfecv = RFECV(
        estimator=base_rf,
        step=1,
        cv=cv_strategy,
        scoring="f1_macro",
        min_features_to_select=5,
        n_jobs=-1,
    )
    rfecv.fit(X_train_scaled, y_train)

    selected_features = [f for f, s in zip(FEATURE_COLUMNS, rfecv.support_) if s]
    print(f"-> Optimal features count: {rfecv.n_features_}")
    print(f"-> Selected features: {selected_features}")
    print("-> Full feature rankings:")
    for feat, rank in sorted(zip(FEATURE_COLUMNS, rfecv.ranking_), key=lambda x: x[1]):
        status = "SELECTED" if rank == 1 else f"rank {rank}"
        print(f"   - {feat:15s}: {status}")

    # 4. Hyperparameter Search on selected features
    print("\n[Step 2] Running GridSearchCV over RandomForest hyperparameters...")
    param_grid = {
        "n_estimators": [100, 200, 400],
        "max_depth": [None, 10, 20],
        "min_samples_leaf": [1, 2, 4],
    }
    grid = GridSearchCV(
        RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1),
        param_grid,
        cv=cv_strategy,
        scoring="f1_macro",
        n_jobs=-1,
        refit=True,
    )
    grid.fit(X_train_scaled[selected_features], y_train)

    print(f"-> Best Hyperparameters: {grid.best_params_}")
    print(f"-> Best Inner CV Macro F1: {grid.best_score_:.4f}")

    # Compute CV metrics (Accuracy & Macro F1) across folds with best estimator
    cv_eval = cross_validate(
        grid.best_estimator_,
        X_train_scaled[selected_features],
        y_train,
        cv=cv_strategy,
        scoring=["accuracy", "f1_macro"],
        n_jobs=-1,
    )
    cv_acc_mean = float(np.mean(cv_eval["test_accuracy"]))
    cv_f1_mean = float(np.mean(cv_eval["test_f1_macro"]))
    print(f"-> 5-Fold CV Accuracy: {cv_acc_mean:.4f} (+/- {np.std(cv_eval['test_accuracy']):.4f})")
    print(f"-> 5-Fold CV Macro F1: {cv_f1_mean:.4f} (+/- {np.std(cv_eval['test_f1_macro']):.4f})")

    # 5. Evaluate on untouched Hold-out Test Set
    print("\n[Step 3] Evaluating on untouched hold-out test set (400 devices)...")
    best_rf = grid.best_estimator_
    y_pred = best_rf.predict(X_test_scaled[selected_features])

    test_accuracy = float(accuracy_score(y_test, y_pred))
    test_macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"Hold-out Test Accuracy : {test_accuracy:.4f} (Target: >= 0.9000)")
    print(f"Hold-out Test Macro F1 : {test_macro_f1:.4f} (Target: >= 0.8800)")

    if test_accuracy >= 0.90 and test_macro_f1 >= 0.88:
        print("[SUCCESS] Model meets and exceeds committed PRD targets!")
    else:
        print("[WARNING] Targets not met, investigate fallback plan.")

    # 6. Build Production Pipeline
    print("\n[Step 4] Assembling and verifying production Pipeline...")
    preprocessor = ColumnTransformer(
        transformers=[
            ("scale", StandardScaler(), selected_features),
        ],
        remainder="drop",
    )
    # Fit preprocessor on X_train (has all 20 columns)
    preprocessor.fit(X_train)

    # Train a new RF with best params on preprocessed data
    tuned_rf = RandomForestClassifier(
        **grid.best_params_,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    X_train_preprocessed = preprocessor.transform(X_train)
    tuned_rf.fit(X_train_preprocessed, y_train)

    production_pipeline = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("clf", tuned_rf),
        ]
    )

    # Verify pipeline on raw test data
    pipeline_preds = production_pipeline.predict(X_test)
    assert np.array_equal(pipeline_preds, y_pred), "Pipeline predictions mismatch!"
    print("-> Pipeline verification verified: exact match with evaluated model.")

    # Save artifact
    artifact_path = REPO_ROOT / "artifacts" / "tuned_rfecv_rf.joblib"
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(production_pipeline, artifact_path)
    print(f"-> Serialized production pipeline to {artifact_path}")

    # 7. Save metrics JSON
    metrics_data = {
        "model_type": "RFECV + RandomForestClassifier",
        "version_tag": "v2.0.0-rfecv",
        "selected_features": selected_features,
        "n_features": len(selected_features),
        "best_params": grid.best_params_,
        "cv_accuracy_mean": cv_acc_mean,
        "cv_macro_f1_mean": cv_f1_mean,
        "holdout_accuracy": test_accuracy,
        "holdout_macro_f1": test_macro_f1,
        "confusion_matrix": cm,
        "classification_report": report,
        "meets_targets": bool(test_accuracy >= 0.90 and test_macro_f1 >= 0.88),
    }
    metrics_path = REPO_ROOT / "artifacts" / "tuned_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"-> Saved metrics to {metrics_path}")

    # 8. Register in model_registry table
    print("\n[Step 5] Registering model in model_registry...")
    init_db()
    db = SessionLocal()
    try:
        # Mark all previous models as inactive
        db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).update(
            {"is_active": False}
        )

        version_tag = "v2.0.0-rfecv"
        existing = db.query(ModelRegistry).filter_by(version_tag=version_tag).first()
        if existing:
            existing.cv_accuracy = cv_acc_mean
            existing.cv_macro_f1 = cv_f1_mean
            existing.artifact_path = str(artifact_path.relative_to(REPO_ROOT)).replace("\\", "/")
            existing.is_active = True
            print(f"-> Updated existing model registry entry: {version_tag}")
        else:
            reg_entry = ModelRegistry(
                version_tag=version_tag,
                cv_accuracy=cv_acc_mean,
                cv_macro_f1=cv_f1_mean,
                artifact_path=str(artifact_path.relative_to(REPO_ROOT)).replace("\\", "/")
                or "artifacts/tuned_rfecv_rf.joblib",
                is_active=True,
            )
            db.add(reg_entry)
            print(f"-> Inserted new model registry entry: {version_tag}")

        db.commit()
        active = db.query(ModelRegistry).filter_by(is_active=True).first()
        print(f"-> Active model in registry: id={active.id}, tag={active.version_tag}, path={active.artifact_path}")
    finally:
        db.close()

    print("\nDone! Point 1 training, serialization, evaluation, and DB registration complete.")
    return metrics_data


if __name__ == "__main__":
    run_tuned_pipeline()
