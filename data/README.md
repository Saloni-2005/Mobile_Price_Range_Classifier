# Data

## Dataset Overview & Status

The canonical Kaggle Mobile Price Classification dataset has been acquired and cleaned for the Month 1 (Viva 1) baseline:

- **Raw Canonical Files**: `data/raw/train.csv` (2,000 rows, 20 spec features + `price_range`) and `data/raw/test.csv` (1,000 rows).
- **Cleaned Processed Files**: `data/processed/train_cleaned.csv` and `data/processed/test_cleaned.csv` generated via `scripts/clean_data.py`.
- **Merged Fixtures File**: `data/raw/merged_dataset.csv` combines the real training data with 43 edge-case and out-of-distribution test rows for robustness testing (PRD Chapters 15 and 19).

## Data Cleaning Applied (Month 1)

1. **Zero-Missing Verification**: Confirmed 0 null / NaN values across all 20 features and target.
2. **Deduplication**: Confirmed 0 duplicate rows.
3. **Physical Zero Anomaly Imputation**:
   - `sc_w` (Screen Width in cm): 180 rows had `sc_w = 0`. Imputed using the median screen width grouped by screen height `sc_h` (learned from train set only).
   - `px_height` (Pixel Resolution Height): 2 rows had `px_height = 0`. Imputed using median aspect ratio (`px_height / px_width = 0.5211`).
4. **Data Type Casting**: Enforced clean integer and float data types.

## Folder Structure

```
data/
├── raw/
│   ├── train.csv                  Real canonical Kaggle train set (2,000 rows)
│   ├── test.csv                   Real canonical Kaggle test set (1,000 rows)
│   ├── merged_dataset.csv         Real train set + test fixtures (2,043 rows)
│   ├── train_PLACEHOLDER.csv      Original synthetic fallback
│   └── merged_dataset_PLACEHOLDER.csv
├── processed/
│   ├── train_cleaned.csv          Fully cleaned training set
│   └── test_cleaned.csv           Cleaned test set (train-learned imputation)
└── test_fixtures/
    ├── boundary_valid.csv         40 boundary min/max spec test cases
    ├── out_of_distribution.csv    3 out-of-distribution spec test cases
    └── invalid_payloads.json      422 error test payloads
```
