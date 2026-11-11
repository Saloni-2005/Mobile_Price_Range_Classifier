# Model Card — Mobile Price-Range Classifier

Per PRD Chapter 13 & Chapter 15. Evaluated on the cleaned canonical Kaggle Mobile Price Classification dataset.  
For the full error severity breakdown, confidence calibration, and out-of-distribution TreeSHAP audit, see [`docs/error_analysis.md`](./error_analysis.md).

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
| Train | 80% stratified (1,600 rows, 400 per tier), `random_state=42` |
| Evaluation | 20% held-out stratified (400 rows, 100 per tier), touched once for final reported metrics |
| CV schema | Nested: 5-fold `StratifiedKFold` outer; inner `RFECV` (step=1, scoring=`f1_macro`, min_features=5) + `GridSearchCV` |

## Selected Features & Importance

Through 5-fold Stratified RFECV, the model eliminated 15 uninformative hardware attributes, isolating the 5 drivers that govern mobile tier classification:

1. **`ram`** (Rank 1 — primary driver, `0.6951` MDI importance)
2. **`battery_power`** (Rank 1 — high tier discriminator, `0.0958` MDI importance)
3. **`px_width`** (Rank 1 — display quality driver, `0.0757` MDI importance)
4. **`px_height`** (Rank 1 — display resolution driver, `0.0756` MDI importance)
5. **`mobile_wt`** (Rank 1 — hardware build factor, `0.0578` MDI importance)

Eliminated features: `int_memory` (rank 2), `talk_time` (rank 3), `pc` (rank 4), `sc_h` (rank 5), `sc_w` (rank 6), `clock_speed` (rank 7), `fc` (rank 8), `m_dep` (rank 9), `n_cores` (rank 10), `touch_screen` (rank 11), `four_g` (rank 12), `wifi` (rank 13), `dual_sim` (rank 14), `blue` (rank 15), `three_g` (rank 16).

## Quantitative Analysis & Results

| Model | Features | 5-Fold CV Accuracy | 5-Fold CV Macro F1 | Hold-out Accuracy | Hold-out Macro F1 | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline RF (no RFE) | 20 (all) | 0.8661 ± 0.0303 | 0.8661 ± 0.0303 | **0.8750** | **0.8745** | Baseline reference |
| **Tuned RFECV + RF** | **5 (selected)** | **0.9100 ± 0.0224** | **0.9101 ± 0.0223** | **0.9400** | **0.9399** | **Exceeds committed targets** |

### Target Verification (PRD Chapter 3)
- **Hold-out Accuracy**: **94.00%** (`376 / 400`, committed target: $\ge 90\%$) — **MET (+4.00%)**
- **Hold-out Macro F1**: **0.9399** (committed target: $\ge 0.8800$) — **MET (+0.0599)**
- **Feature Reduction**: **75% reduction** (5 features vs 20 features) while improving hold-out accuracy from 87.50% to 94.00%.

### Per-Class Performance on Held-Out Test Set (`N = 400`)

| Class / Tier | Precision | Recall | F1-Score | Support |
| --- | :---: | :---: | :---: | :---: |
| **Tier 0 (`Low`)** | 0.9519 | 0.9900 | **0.9706** | 100 |
| **Tier 1 (`Mid`)** | 0.9468 | 0.8900 | **0.9175** | 100 |
| **Tier 2 (`Mid-High`)** | 0.8942 | 0.9300 | **0.9118** | 100 |
| **Tier 3 (`High`)** | 0.9694 | 0.9500 | **0.9596** | 100 |
| **Macro / Weighted Avg** | **0.9406** | **0.9400** | **0.9399** | **400** |

### Confusion Matrix (Untouched 400 Hold-out Devices)

```
                Predicted 0   Predicted 1   Predicted 2   Predicted 3
Actual Tier 0:      99             1             0             0
Actual Tier 1:       5            89             6             0
Actual Tier 2:       0             4            93             3
Actual Tier 3:       0             0             5            95
```

### Boundary vs. Severe Misclassification Breakdown (PRD Chapter 15.1)

- **Total Misclassifications:** `24 / 400` (**6.00%** error rate).
- **Adjacent-Tier (Boundary) Errors (`|ŷ - y| = 1`):** **`24 / 24` (100.0% of all errors; 6.00% of test set)** — `1` (`T0→T1`), `5` (`T1→T0`), `6` (`T1→T2`), `4` (`T2→T1`), `3` (`T2→T3`), and `5` (`T3→T2`).
- **Severe Misclassifications (`|ŷ - y| >= 2`):** **`0 / 24` (0.0% of all errors; 0.00% of test set)**. The tuned model never misclassifies a device by 2 or 3 price tiers.
- **Confidence Calibration:** Mean top-class probability is **0.8365** (median **0.8750**) on correct predictions vs. **0.6071** (median **0.6050**) on the 24 boundary errors.

## Known Failure Modes & Caveats (PRD Chapter 15.2 / 15.3)

Evaluated against [`data/test_fixtures/out_of_distribution.csv`](../data/test_fixtures/out_of_distribution.csv) (full TreeSHAP breakdown in [`docs/error_analysis.md`](./error_analysis.md)):

1. **Contradictory Spec Dominance (`max_ram_min_everything_else`):** A device with `ram=3998 MB` but minimum battery (`500 mAh`), resolution (`500×0 px`), and weight (`80 g`) is classified as **`Tier 3 (High)`** (`[0.03, 0.07, 0.37, 0.53]`). Because `ram` holds `69.5%` of tree importance (`+0.5419` SHAP contribution), extreme RAM overrides minimum secondary specs, though max confidence drops to **53%**.
2. **Inverse Contradiction Tie-Breaking (`min_ram_max_everything_else`):** Pairing `ram=256 MB` with maximum battery (`2000 mAh`), resolution (`1998×1960 px`), and weight (`200 g`) yields a low-confidence split tie **`[0.40, 0.40, 0.19, 0.01]`** (`max_confidence = 40%`), resolving to **`Tier 0 (Low)`** via `argmax` tie-breaking. Predictions with `max(probabilities) < 0.55` should be flagged for analyst review.
3. **Zero-Resolution Drag (`high_battery_zero_resolution`):** Passing raw `px_height=0` and `px_width=500` on an otherwise Mid-High device (`ram=2127 MB`, `battery_power=2000 mAh`) pulls the prediction down into **`Tier 1 (Mid)`** (`[0.06, 0.59, 0.29, 0.06]`).
4. **Extrapolation Plateau in Decision Trees:** Random Forest trees cannot extrapolate linearly beyond observed training bounds (`ram: 256–3998 MB`, `battery_power: 500–2000 mAh`, `px_width: 500–1998 px`, `px_height: 0–1960 px`, `mobile_wt: 80–200 g`). Out-of-range What-If slider inputs are automatically flagged in both the API response (`is_extrapolated=True`) and the React UI.
5. **Illustrative Margin Caveat:** Margin estimates in the What-If simulator combine tier price midpoints (`$125 / $225 / $400 / $650`) with a synthetic linear cost proxy and do not represent real vendor bill-of-materials (BOM) quotes.

## Change Log

| Version | Date | Changes | Author |
| --- | --- | --- | --- |
| `v1.0.0` | Month 1 | Baseline Random Forest on 20 features (no feature elimination), hold-out accuracy 87.50%, macro F1 0.8745. | ML Engineering |
| `v2.0.0-rfecv` | Month 2 | Ran 5-fold Stratified RFECV and GridSearchCV. Isolated 5 optimal features (`ram`, `battery_power`, `px_width`, `px_height`, `mobile_wt`). Improved hold-out accuracy to 94.00% and macro F1 to 0.9399. Serialized production pipeline to `artifacts/tuned_rfecv_rf.joblib` and activated in `model_registry`. | ML Engineering |
| `v2.0.0-rfecv` (Audit) | Month 3 | Completed full PRD Chapter 15 Error Analysis (`docs/error_analysis.md`): verified 100% of test errors (`24/24`) are 1-tier boundary transitions (`0` severe 2+-tier errors) and documented OOD failure modes on `out_of_distribution.csv`. | ML Engineering |
