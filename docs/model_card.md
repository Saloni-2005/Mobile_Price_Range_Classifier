# Model Card — Mobile Price-Range Classifier

Per PRD Chapter 13. Metrics below are from the Viva 1 baseline evaluated on the
cleaned real Kaggle Mobile Price Classification dataset.

## Model Details

| Field | Details |
| --- | --- |
| Model | `RandomForestClassifier` baseline on **all 20** specification features (no RFE) |
| Framework | scikit-learn Pipeline (`StandardScaler` → RF) |
| Artifact | `artifacts/baseline_rf.joblib` |
| Versioning | `model_registry` (Chapter 9) — wired in later months |
| Random seed | `42` |

## Intended Use

Decision-support for product managers / pricing analysts estimating which of 4
price tiers a candidate device specification is likely to fall into. **Not**
intended for final, unreviewed pricing decisions without human sign-off.

## Training / Evaluation Data

| Split | Details |
| --- | --- |
| Source file | `data/processed/train_cleaned.csv` (derived from canonical Kaggle `train.csv`, 2,000 rows) |
| Cleaning applied | Imputed 180 `sc_w=0` zeros using median screen width grouped by `sc_h`; imputed 2 `px_height=0` zeros using median aspect ratio (`px_height/px_width`); verified 0 missing/null values and 0 duplicates |
| Train | 80% stratified (~1,600 rows), `random_state=42` |
| Evaluation | 20% held-out stratified (~400 rows), touched once for final metrics |
| CV schema | Nested: 5 outer `StratifiedKFold` folds; inner `GridSearchCV` over RF hyperparams (RFECV inner loop = Viva 2) |

## Results

| Model | Features | Hold-out Accuracy | Hold-out macro F1 | Notes |
| --- | --- | --- | --- | --- |
| Baseline RF (no RFE) | 20 (all) | **0.8750** | **0.8745** | Nested CV macro F1 mean ± std on train: 0.8661 ± 0.0303. Evaluated on cleaned Kaggle `train.csv`. |
| RFE + RF | _TBD_ | _TBD_ | _TBD_ | Scheduled for Viva 2 (Month 2) |

Committed targets (Chapter 3, evaluated on real data at Viva 2): Accuracy ≥ 90%, macro F1 ≥ 0.88.

## Caveats

- Margin estimates from the what-if playground (later) are illustrative approximations, not real BOM data.
- The baseline model uses all 20 features without feature elimination; RFECV feature selection is scheduled for Month 2 (Viva 2).
