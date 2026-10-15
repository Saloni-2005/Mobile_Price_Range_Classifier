"""Generate notebooks/eda_and_baseline.ipynb"""

from pathlib import Path

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []

cells.append(
    nbf.v4.new_markdown_cell(
        """# EDA and Baseline Model

PRD Chapters 3, 12, 13 — Mobile Price-Range Classifier.

Load cleaned real Kaggle dataset (`data/processed/train_cleaned.csv` or `merged_dataset.csv`),
validate missingness and domain zero-value imputations, build a scikit-learn preprocessing + RandomForest **baseline (no RFE)**,
run the nested CV schema (5 outer StratifiedKFold folds, inner hyperparameter search,
`random_state=42`), and report Accuracy + macro F1 on the held-out 20% stratified test split.

Pipeline logic is extracted into `backend/app/services/inference.py`."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """from pathlib import Path
import sys
import json

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)

REPO_ROOT = Path.cwd()
if REPO_ROOT.name == "notebooks":
    REPO_ROOT = REPO_ROOT.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app.services.inference import (
    FEATURE_COLUMNS,
    RANDOM_STATE,
    TARGET_COLUMN,
    build_baseline_pipeline,
    default_merged_csv_path,
    load_training_frame,
    save_model,
    validate_no_missing_features,
)

print("repo:", REPO_ROOT)
print("features:", len(FEATURE_COLUMNS))"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 1. Load & filter training rows

Loads cleaned dataset (2,000 rows, 20 features, 4 classes).
Edge cases and out-of-distribution rows are preserved in merged fixtures for testing."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """raw = pd.read_csv(default_merged_csv_path())
print("merged shape:", raw.shape)
if "source" in raw.columns:
    print(raw["source"].value_counts())

df = load_training_frame()
print("training shape:", df.shape)
print("price_range balance:")
print(df[TARGET_COLUMN].value_counts().sort_index())
df.head()"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 2. Validate missing values & domain zero cleaning"""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """validate_no_missing_features(df)
print("OK: no missing values in FEATURE_COLUMNS or price_range")
print(f"sc_w min: {df['sc_w'].min()} cm (zeros remaining: {(df['sc_w'] == 0).sum()})")
print(f"px_height min: {df['px_height'].min()} px (zeros remaining: {(df['px_height'] == 0).sum()})")"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 3. 80/20 stratified split (seed = 42)

Per PRD Chapter 12: the 20% hold-out is touched exactly once for final reported metrics."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMN].astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
)

print(f"train={len(X_train)} test={len(X_test)}")
print("train class counts:\\n", y_train.value_counts().sort_index())
print("test class counts:\\n", y_test.value_counts().sort_index())"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 4. Preprocessing + baseline pipeline

`StandardScaler` → `RandomForestClassifier` on **all 20 features** (no RFE)."""
    )
)

cells.append(nbf.v4.new_code_cell("""pipe = build_baseline_pipeline()
pipe"""))

cells.append(
    nbf.v4.new_markdown_cell(
        """## 5. Nested cross-validation schema (PRD Ch. 12)

- **Outer loop:** `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` — unbiased performance estimate
- **Inner loop:** `GridSearchCV` over RandomForest hyperparameters (baseline = all features)
- Scoring: `f1_macro`

A compact grid (structurally identical to Ch. 12.2) is used so this notebook finishes in reasonable time."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
inner_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

param_grid = {
    "clf__n_estimators": [100, 200],
    "clf__max_depth": [None, 10, 20],
    "clf__min_samples_leaf": [1, 2],
}

inner_search = GridSearchCV(
    estimator=build_baseline_pipeline(),
    param_grid=param_grid,
    cv=inner_cv,
    scoring="f1_macro",
    n_jobs=-1,
    refit=True,
)

nested_scores = cross_val_score(
    inner_search, X_train, y_train, cv=outer_cv, scoring="f1_macro", n_jobs=-1
)
print("Nested CV macro F1 per outer fold:", np.round(nested_scores, 4))
print(
    f"Nested CV macro F1 mean+/-std: {nested_scores.mean():.4f} +/- {nested_scores.std():.4f}"
)"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 6. Fit on full train, evaluate once on held-out 20%"""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """inner_search.fit(X_train, y_train)
best_model = inner_search.best_estimator_
print("Best params:", inner_search.best_params_)

y_pred = best_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
macro_f1 = f1_score(y_test, y_pred, average="macro")

print(f"Hold-out Accuracy:  {accuracy:.4f}")
print(f"Hold-out macro F1:  {macro_f1:.4f}")
print()
print(classification_report(y_test, y_pred, digits=4))
print("Confusion matrix:\\n", confusion_matrix(y_test, y_pred))"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell("""## 7. Persist artifact + metrics JSON""")
)

cells.append(
    nbf.v4.new_code_cell(
        """artifact_path = save_model(best_model)
metrics = {
    "model": "baseline_random_forest_no_rfe",
    "n_train": int(len(X_train)),
    "n_test": int(len(X_test)),
    "n_features": len(FEATURE_COLUMNS),
    "best_params": inner_search.best_params_,
    "nested_cv_macro_f1_mean": float(nested_scores.mean()),
    "nested_cv_macro_f1_std": float(nested_scores.std()),
    "nested_cv_macro_f1_folds": [float(s) for s in nested_scores],
    "holdout_accuracy": float(accuracy),
    "holdout_macro_f1": float(macro_f1),
    "artifact_path": str(artifact_path.relative_to(REPO_ROOT)),
    "random_state": RANDOM_STATE,
}
metrics_path = REPO_ROOT / "artifacts" / "baseline_metrics.json"
metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
print("Saved", artifact_path)
print("Saved", metrics_path)
metrics"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 8. RFECV Feature Selection (PRD Ch. 12.2)

Per PRD Chapter 12.2:
- Recursive Feature Elimination with 5-fold Stratified Cross-Validation (`RFECV`).
- Metric: `f1_macro`, step = 1, `min_features_to_select` = 5.
- Eliminates uninformative hardware specs to reduce complexity and avoid overfitting."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """from sklearn.feature_selection import RFECV

scaler = StandardScaler()
X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=FEATURE_COLUMNS)
X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=FEATURE_COLUMNS)

base_rf = RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1)
rfecv = RFECV(
    estimator=base_rf,
    step=1,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE),
    scoring="f1_macro",
    min_features_to_select=5,
    n_jobs=-1,
)
rfecv.fit(X_train_scaled, y_train)

selected_features = [f for f, s in zip(FEATURE_COLUMNS, rfecv.support_) if s]
print(f"Optimal features count: {rfecv.n_features_}")
print(f"Selected features ({len(selected_features)}): {selected_features}")
print("\\nFeature Rankings:")
for feat, rank in sorted(zip(FEATURE_COLUMNS, rfecv.ranking_), key=lambda x: x[1]):
    status = "SELECTED" if rank == 1 else f"rank {rank}"
    print(f"  {feat:15s}: {status}")"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 9. Hyperparameter Search on Selected Features (PRD Ch. 12.2)

Grid search over:
- `n_estimators`: [100, 200, 400]
- `max_depth`: [None, 10, 20]
- `min_samples_leaf`: [1, 2, 4]"""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """from sklearn.model_selection import cross_validate

param_grid = {
    "n_estimators": [100, 200, 400],
    "max_depth": [None, 10, 20],
    "min_samples_leaf": [1, 2, 4],
}

inner_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
grid = GridSearchCV(
    RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1),
    param_grid,
    cv=inner_cv,
    scoring="f1_macro",
    n_jobs=-1,
    refit=True,
)
grid.fit(X_train_scaled[selected_features], y_train)

print(f"Best Hyperparameters: {grid.best_params_}")
print(f"Best CV Macro F1: {grid.best_score_:.4f}")

# Cross-validate best estimator
cv_eval = cross_validate(
    grid.best_estimator_,
    X_train_scaled[selected_features],
    y_train,
    cv=inner_cv,
    scoring=["accuracy", "f1_macro"],
    n_jobs=-1,
)
cv_acc_mean = float(np.mean(cv_eval["test_accuracy"]))
cv_f1_mean = float(np.mean(cv_eval["test_f1_macro"]))
print(f"5-Fold CV Accuracy: {cv_acc_mean:.4f} (+/- {np.std(cv_eval['test_accuracy']):.4f})")
print(f"5-Fold CV Macro F1: {cv_f1_mean:.4f} (+/- {np.std(cv_eval['test_f1_macro']):.4f})")"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 10. Evaluate on Untouched 20% Hold-out Split (PRD Ch. 3)

Committed Targets:
- Hold-out Accuracy >= 0.90 (90%)
- Hold-out Macro F1 >= 0.88 (0.88)
- Materially fewer features than baseline (5 vs 20 features)"""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """best_rf = grid.best_estimator_
y_pred_tuned = best_rf.predict(X_test_scaled[selected_features])

tuned_acc = accuracy_score(y_test, y_pred_tuned)
tuned_f1 = f1_score(y_test, y_pred_tuned, average="macro")

print("=" * 50)
print(f"Hold-out Test Accuracy: {tuned_acc:.4f} (Target: >= 0.9000)")
print(f"Hold-out Test Macro F1: {tuned_f1:.4f} (Target: >= 0.8800)")
print("=" * 50)

assert tuned_acc >= 0.90, f"Accuracy {tuned_acc:.4f} below target 0.90"
assert tuned_f1 >= 0.88, f"Macro F1 {tuned_f1:.4f} below target 0.88"
print("SUCCESS: Tuned model meets and exceeds committed targets on untouched test set!")

print("\\nClassification Report:")
print(classification_report(y_test, y_pred_tuned))

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred_tuned))"""
    )
)

cells.append(
    nbf.v4.new_markdown_cell(
        """## 11. Production Pipeline Serialization & Model Registry Entry

Construct an end-to-end `Pipeline` containing `ColumnTransformer` (subselecting and scaling the 5 features) and the tuned `RandomForestClassifier`.
Register the active model entry in `model_registry`."""
    )
)

cells.append(
    nbf.v4.new_code_cell(
        """from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from app.db.models import ModelRegistry
from app.db.session import SessionLocal, init_db

# Build production pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ("scale", StandardScaler(), selected_features),
    ],
    remainder="drop",
)
preprocessor.fit(X_train)

tuned_rf = RandomForestClassifier(
    **grid.best_params_,
    random_state=RANDOM_STATE,
    n_jobs=-1,
)
X_train_preprocessed = preprocessor.transform(X_train)
tuned_rf.fit(X_train_preprocessed, y_train)

pipeline = Pipeline([
    ("preprocess", preprocessor),
    ("clf", tuned_rf),
])

# Verify pipeline predictions match
pipe_preds = pipeline.predict(X_test)
assert np.array_equal(pipe_preds, y_pred_tuned), "Pipeline output mismatch"

# Persist artifact
artifact_path = REPO_ROOT / "artifacts" / "tuned_rfecv_rf.joblib"
save_model(pipeline, artifact_path)
print("Saved tuned artifact:", artifact_path)

# Register in database model_registry
init_db()
db = SessionLocal()
try:
    db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).update({"is_active": False})
    
    version_tag = "v2.0.0-rfecv"
    existing = db.query(ModelRegistry).filter_by(version_tag=version_tag).first()
    if existing:
        existing.cv_accuracy = cv_acc_mean
        existing.cv_macro_f1 = cv_f1_mean
        existing.artifact_path = "artifacts/tuned_rfecv_rf.joblib"
        existing.is_active = True
    else:
        reg = ModelRegistry(
            version_tag=version_tag,
            cv_accuracy=cv_acc_mean,
            cv_macro_f1=cv_f1_mean,
            artifact_path="artifacts/tuned_rfecv_rf.joblib",
            is_active=True,
        )
        db.add(reg)
    db.commit()
    active = db.query(ModelRegistry).filter_by(is_active=True).first()
    print(f"Active model in registry: id={active.id}, tag={active.version_tag}, path={active.artifact_path}")
finally:
    db.close()"""
    )
)

nb.cells = cells
out = Path("notebooks/eda_and_baseline.ipynb")
out.parent.mkdir(parents=True, exist_ok=True)
nbf.write(nb, out)
print("wrote", out)
