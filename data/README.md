# Data

## ⚠️ Files here are SYNTHETIC placeholders — not the real dataset

`raw/train_PLACEHOLDER.csv` and `raw/merged_dataset_PLACEHOLDER.csv` are
generated stand-ins matching the real dataset's exact schema (2,000 rows, 20
specification features, `price_range` target with 4 balanced classes), since
this environment has no outbound network access to Kaggle/GitHub raw hosts.
Do not use these for your final reported metrics.

`merged_dataset_PLACEHOLDER.csv` additionally includes 43 edge-case rows
(from `test_fixtures/`) tagged via a `source` column:
- `synthetic_train` (2,000 rows) — the working placeholder training set
- `boundary_edge_case` (40 rows) — each feature pinned at its real min/max
- `out_of_distribution` (3 rows) — valid but unlikely feature combinations

Filter to `source == "synthetic_train"` before training/evaluating — the
other rows have `price_range = null` and exist only to test robustness/edge
-case handling (PRD Chapters 15 and 19).

## How to get the real dataset (do this before Viva 1)

**Option A — Kaggle (canonical source):**
1. https://www.kaggle.com/datasets/iabhishekofficial/mobile-price-classification
2. Download `train.csv`, place it at `data/raw/train.csv`.

**Option B — Kaggle CLI:**
```bash
pip install kaggle
kaggle datasets download -d iabhishekofficial/mobile-price-classification -p data/raw --unzip
```

**Option C — verified mirror (no Kaggle account needed):**
https://github.com/erlanggapratamaP/mobileprices (`train.csv`) — confirmed to
match the original (2,001 lines including header).

Once you have the real file, re-run the RFECV feature-selection script against
it (see `docs/cursor_build_prompts.md`, Month 1) rather than trusting any
feature ranking computed on the placeholder data.

## Folder structure

```
data/
├── raw/               train_PLACEHOLDER.csv, merged_dataset_PLACEHOLDER.csv
├── test_fixtures/      boundary_valid.csv, out_of_distribution.csv, invalid_payloads.json
└── processed/          (create as needed) cleaned/scaled train-test splits
```
