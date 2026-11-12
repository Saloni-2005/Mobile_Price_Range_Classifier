# ADR-001: Use Recursive Feature Elimination with Cross-Validation (RFECV + Random Forest) for Feature Selection

- **Status:** Accepted
- **Date:** 2026-10-15 (Updated 2026-11-12 with final evaluation outcomes)

---

## Context

The Kaggle Mobile Price Classification dataset contains 2,000 labeled device records across 20 hardware and connectivity attributes (`battery_power`, `blue`, `clock_speed`, `dual_sim`, `fc`, `four_g`, `int_memory`, `m_dep`, `mobile_wt`, `n_cores`, `pc`, `px_height`, `px_width`, `ram`, `sc_h`, `sc_w`, `talk_time`, `three_g`, `touch_screen`, `wifi`) targeting 4 balanced price tiers (`0: Low`, `1: Mid`, `2: Mid-High`, `3: High`).

Training a baseline Random Forest across all 20 raw features ([scripts/train_baseline.py](../../scripts/train_baseline.py)) yielded only **87.50%** hold-out accuracy (`0.8744` macro F1) and a **2.75 percentage-point train-to-CV generalization gap** (`90.25%` 5-fold CV vs. `87.50%` test). In a 20-feature tree ensemble where `max_features="sqrt"` samples ~4 random features per split, 15 low-signal binary/radio flags dilute split selection, frequently causing trees to partition on noisy attributes (`blue`, `three_g`, `dual_sim`, `clock_speed`) before consulting primary price drivers like `ram` and `battery_power`.

Furthermore, our interactive What-If Hardware & Margin Sandbox (`POST /whatif`) requires exposing the highest-leverage hardware sliders so product managers can explore BOM trade-offs without tuning 20 separate controls simultaneously.

---

## Decision

We adopt **Recursive Feature Elimination with 5-fold Stratified Cross-Validation (`RFECV`)** wrapped around a `RandomForestClassifier(random_state=42)` (`scoring="f1_macro"`, `min_features_to_select=5`), followed by `RandomizedSearchCV` (`n_iter=25`, 5-fold Stratified CV) to tune hyperparameters on the selected feature subset ([scripts/train_tuned.py](../../scripts/train_tuned.py)).

To prevent any data leakage, both `RFECV` and `RandomizedSearchCV` are fitted strictly on the 1,600-row cleaned training split (`data/processed/train_split.csv`), while the 400-row stratified test split (`data/processed/test_split.csv`) remains untouched until final evaluation.

---

## Alternatives Considered

1. **Univariate Mutual Information (`SelectKBest(mutual_info_classif)`):**
   - *Pros:* Fast, model-agnostic single pass.
   - *Cons:* Evaluates each feature in isolation and fails to capture multi-feature interactions critical to tree splits (e.g., how `px_height` and `px_width` jointly define display resolution tier thresholds alongside `ram`).
2. **L1 Regularization (`LogisticRegression(penalty="l1")` / Lasso):**
   - *Pros:* Embedded sparsity with convex optimization.
   - *Cons:* Assumes linear log-odds decision boundaries in standardized feature space; drops non-linear interaction features (`mobile_wt`, `px_height`) that tree ensembles exploit effectively.
3. **No Feature Selection (Retain all 20 features):**
   - *Pros:* Zero preprocessing step; all raw fields directly influence trees.
   - *Cons:* Suffers from feature dilution in random subspace sampling (`max_features="sqrt"`), resulting in `87.50%` test accuracy (`50/400` misclassifications) and bloated SHAP waterfall charts crowded with near-zero noise bars.

---

## Consequences

- **Positive (Accuracy & Generalization):**
  - `RFECV` pruned the feature space by **75%** (from 20 features down to the 5 core hardware drivers: `ram`, `battery_power`, `px_height`, `px_width`, and `mobile_wt`).
  - Hold-out test accuracy improved by **+6.50 percentage points** (**87.50% -> 94.00%**, macro F1 **0.8744 -> 0.9399**, multiclass ROC-AUC **0.9794 -> 0.9936**), cutting total test misclassifications in half (`50` errors down to `24`, with `0` errors exceeding 1 adjacent price tier).
  - The train-to-test generalization gap shrank from `2.75%` to **1.44%** (`92.56%` CV vs. `94.00%` hold-out test).
- **Positive (Inference Latency & UX):**
  - TreeSHAP explanation latency dropped well below the 400 ms SLA (`p95 < 45 ms`), and the What-If Sandbox focuses cleanly on the 5 active hardware drivers while keeping the full 20-feature API contract intact (`DeviceSpecs` schema).
- **Negative / Trade-offs:**
  - Modifications to the 15 pruned connectivity/camera attributes (`fc`, `pc`, `four_g`, `wifi`, etc.) have zero marginal effect on the active `v1.1.0-tuned-rfecv` prediction. This behavior is explicitly documented in the [Model Card](../model_card.md) and surfaced in the UI via `ACTIVE RFE` badges.

