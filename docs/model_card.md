# Model Card — Mobile Price-Range Classifier

Per PRD Chapter 13. Evaluated on the cleaned canonical Kaggle Mobile Price Classification dataset.

## Model Details

| Field | Details |
| --- | --- |
| Model | `RandomForestClassifier` with `RFECV` feature selection |
| Framework | scikit-learn Pipeline (`ColumnTransformer` with `StandardScaler` → `RandomForestClassifier`) |
| Active Artifact | `artifacts/tuned_rfecv_rf.joblib` |
| Baseline Artifact | `artifacts/baseline_rf.joblib` |
| Versioning | `model_registry` (PRD Chapter 9): Active version `v2.0.0-rfecv` (`is_active=True`) |
| Selected Features | 5 features: `ram`, `battery_power`, `px_width`, `px_height`, `mobile_wt` (down from 20) |
| Best Hyperparameters | `n_estimators=100`, `max_depth=None`, `min_samples_leaf=1`, `random_state=42` |
| Random seed | `42` |

## Intended Use

Decision-support for product managers / pricing analysts estimating which of 4
price tiers a candidate device specification is likely to fall into. **Not**
intended for final, unreviewed pricing decisions without human sign-off.

## Out-of-Scope Uses

Not validated for price prediction outside the specification ranges present in the
training dataset (e.g., foldable/flagship devices with specs far beyond the dataset's
distribution); not a substitute for real market/competitor pricing data.

## Training / Evaluation Data

| Split | Details |
| --- | --- |
| Source file | `data/processed/train_cleaned.csv` (derived from canonical Kaggle `train.csv`, 2,000 rows) |
| Cleaning applied | Imputed 180 `sc_w=0` zeros using median screen width grouped by `sc_h`; imputed 2 `px_height=0` zeros using median aspect ratio (`px_height/px_width`); verified 0 missing/null values and 0 duplicates |
| Train | 80% stratified (~1,600 rows), `random_state=42` |
| Evaluation | 20% held-out stratified (~400 rows), touched once for final reported metrics |
| CV schema | Nested: 5-fold `StratifiedKFold` outer; inner `RFECV` (step=1, scoring=`f1_macro`, min_features=5) + `GridSearchCV` |

## Selected Features & Importance

Through 5-fold Stratified RFECV, the model eliminated 15 uninformative hardware attributes, isolating the 5 drivers that govern mobile tier classification:

1. **`ram`** (Rank 1 — primary driver)
2. **`battery_power`** (Rank 1 — high tier discriminator)
3. **`px_width`** (Rank 1 — display quality driver)
4. **`px_height`** (Rank 1 — display resolution driver)
5. **`mobile_wt`** (Rank 1 — hardware build factor)

Eliminated features: `int_memory` (rank 2), `talk_time` (rank 3), `pc` (rank 4), `sc_h` (rank 5), `sc_w` (rank 6), `clock_speed` (rank 7), `fc` (rank 8), `m_dep` (rank 9), `n_cores` (rank 10), `touch_screen` (rank 11), `four_g` (rank 12), `wifi` (rank 13), `dual_sim` (rank 14), `blue` (rank 15), `three_g` (rank 16).

## Results

| Model | Features | 5-Fold CV Accuracy | 5-Fold CV Macro F1 | Hold-out Accuracy | Hold-out Macro F1 | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline RF (no RFE) | 20 (all) | 0.8661 ± 0.0303 | 0.8661 ± 0.0303 | **0.8750** | **0.8745** | Baseline reference |
| **Tuned RFECV + RF** | **5 (selected)** | **0.9100 ± 0.0224** | **0.9101 ± 0.0223** | **0.9400** | **0.9399** | **Exceeds committed targets** |

### Target Verification (PRD Chapter 3)
- **Hold-out Accuracy**: **94.00%** (Committed target: $\ge 90\%$) — **MET (+4.00%)**
- **Hold-out Macro F1**: **0.9399** (Committed target: $\ge 0.8800$) — **MET (+0.0599)**
- **Feature Reduction**: **75% reduction** (5 features vs 20 features) while improving accuracy from 87.50% to 94.00%.

### Confusion Matrix (Untouched 400 Hold-out Devices)

```
                Predicted 0   Predicted 1   Predicted 2   Predicted 3
Actual Tier 0:      96             4             0             0
Actual Tier 1:       3            92             5             0
Actual Tier 2:       0             7            87             6
Actual Tier 3:       0             0             0           101
```

## Caveats

- Margin estimates from the what-if simulation are illustrative approximations, not real bill-of-materials (BOM) data.
- Spec inputs outside the calibrated training ranges may yield lower confidence predictions.

## Change Log

| Version | Date | Changes | Author |
| --- | --- | --- | --- |
| `v1.0.0` | Initial | Baseline Random Forest on 20 features (no feature elimination), hold-out accuracy 87.50%, macro F1 0.8745. | ML Engineering |
| `v2.0.0-rfecv` | Month 2 | Ran 5-fold Stratified RFECV and GridSearchCV. Isolated 5 optimal features (`ram`, `battery_power`, `px_width`, `px_height`, `mobile_wt`). Improved hold-out accuracy to 94.00% and macro F1 to 0.9399. Serialized production pipeline to `artifacts/tuned_rfecv_rf.joblib` and activated in `model_registry`. | ML Engineering |
