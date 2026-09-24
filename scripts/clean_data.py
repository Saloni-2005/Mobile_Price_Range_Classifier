"""
Data cleaning and preprocessing script for Mobile Price-Range Classifier.

Performs:
1. Verification of missing values and duplicates.
2. Domain-aware imputation of physical zero values (sc_w, px_height).
3. Learned statistics from train set applied to test set (preventing data leakage).
4. Generation of data/processed/train_cleaned.csv and data/processed/test_cleaned.csv.
5. Generation of data/raw/merged_dataset.csv with real Kaggle data + test fixtures.
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
FIXTURES_DIR = DATA_DIR / "test_fixtures"

FEATURE_COLUMNS = [
    "battery_power",
    "blue",
    "clock_speed",
    "dual_sim",
    "fc",
    "four_g",
    "int_memory",
    "m_dep",
    "mobile_wt",
    "n_cores",
    "pc",
    "px_height",
    "px_width",
    "ram",
    "sc_h",
    "sc_w",
    "talk_time",
    "three_g",
    "touch_screen",
    "wifi",
]
TARGET_COLUMN = "price_range"


def clean_datasets():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    train_path = RAW_DIR / "train.csv"
    test_path = RAW_DIR / "test.csv"

    if not train_path.exists():
        raise FileNotFoundError(f"Raw train dataset not found at {train_path}")

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path) if test_path.exists() else None

    print("=" * 60)
    print("DATA CLEANING & VERIFICATION REPORT")
    print("=" * 60)

    # 1. Verification of Missing Values & Duplicates
    train_nulls = train_df.isnull().sum().sum()
    train_dups = train_df.duplicated().sum()
    print(f"[Check] Raw Train Shape: {train_df.shape}")
    print(f"[Check] Missing Values in Train: {train_nulls}")
    print(f"[Check] Duplicate Rows in Train: {train_dups}")

    # 2. Analyze zero-value physical anomalies in Train
    sc_w_zeros_train = int((train_df["sc_w"] == 0).sum())
    px_h_zeros_train = int((train_df["px_height"] == 0).sum())
    print(f"[Anomaly] Rows with sc_w == 0 (screen width): {sc_w_zeros_train}")
    print(f"[Anomaly] Rows with px_height == 0 (pixel height): {px_h_zeros_train}")

    # 3. Learn imputation statistics from Train set only (avoid leakage)
    valid_sc_w = train_df[train_df["sc_w"] > 0]
    sc_w_median_by_sch = valid_sc_w.groupby("sc_h")["sc_w"].median().to_dict()
    global_sc_w_median = valid_sc_w["sc_w"].median()

    valid_px_h = train_df[train_df["px_height"] > 0]
    aspect_ratios = valid_px_h["px_height"] / valid_px_h["px_width"]
    median_aspect_ratio = aspect_ratios.median()

    print("\n[Imputation Rules Learned from Training Set]")
    print(f" - Global median sc_w: {global_sc_w_median} cm")
    print(f" - Median sc_w per sc_h group: {sc_w_median_by_sch}")
    print(f" - Median aspect ratio (px_height / px_width): {median_aspect_ratio:.4f}")

    def apply_cleaning(df: pd.DataFrame, is_train: bool = True) -> pd.DataFrame:
        cleaned = df.copy()

        # Impute sc_w == 0
        def impute_sc_w(row):
            if row["sc_w"] == 0:
                return sc_w_median_by_sch.get(row["sc_h"], global_sc_w_median)
            return row["sc_w"]

        cleaned["sc_w"] = cleaned.apply(impute_sc_w, axis=1)

        # Impute px_height == 0
        def impute_px_h(row):
            if row["px_height"] == 0:
                return round(row["px_width"] * median_aspect_ratio)
            return row["px_height"]

        cleaned["px_height"] = cleaned.apply(impute_px_h, axis=1)

        # Ensure correct data types
        int_cols = [
            "battery_power",
            "blue",
            "dual_sim",
            "fc",
            "four_g",
            "int_memory",
            "mobile_wt",
            "n_cores",
            "pc",
            "px_height",
            "px_width",
            "ram",
            "sc_h",
            "sc_w",
            "talk_time",
            "three_g",
            "touch_screen",
            "wifi",
        ]
        if is_train and TARGET_COLUMN in cleaned.columns:
            int_cols.append(TARGET_COLUMN)

        for col in int_cols:
            if col in cleaned.columns:
                cleaned[col] = cleaned[col].astype(int)

        float_cols = ["clock_speed", "m_dep"]
        for col in float_cols:
            if col in cleaned.columns:
                cleaned[col] = cleaned[col].astype(float)

        return cleaned

    train_cleaned = apply_cleaning(train_df, is_train=True)
    out_train_path = PROCESSED_DIR / "train_cleaned.csv"
    train_cleaned.to_csv(out_train_path, index=False)
    print(f"\n[Saved] Cleaned train saved to {out_train_path} ({len(train_cleaned)} rows)")

    if test_df is not None:
        test_cleaned = apply_cleaning(test_df, is_train=False)
        out_test_path = PROCESSED_DIR / "test_cleaned.csv"
        test_cleaned.to_csv(out_test_path, index=False)
        print(f"[Saved] Cleaned test saved to {out_test_path} ({len(test_cleaned)} rows)")

    # 4. Generate data/raw/merged_dataset.csv (with real Kaggle train + test fixtures)
    merged_rows = train_cleaned.copy()
    merged_rows["source"] = "kaggle_train"
    merged_rows["edge_case_type"] = np.nan

    boundary_path = FIXTURES_DIR / "boundary_valid.csv"
    ood_path = FIXTURES_DIR / "out_of_distribution.csv"

    fixtures = []
    if boundary_path.exists():
        bf = pd.read_csv(boundary_path)
        fixtures.append(bf)
    if ood_path.exists():
        of = pd.read_csv(ood_path)
        fixtures.append(of)

    if fixtures:
        fixtures_df = pd.concat(fixtures, ignore_index=True)
        merged_all = pd.concat([merged_rows, fixtures_df], ignore_index=True)
    else:
        merged_all = merged_rows

    merged_out_path = RAW_DIR / "merged_dataset.csv"
    merged_all.to_csv(merged_out_path, index=False)
    print(f"[Saved] Merged dataset saved to {merged_out_path} ({len(merged_all)} rows total)")

    # 5. Summary verification of cleaned train
    print("\n[Post-Cleaning Verification on train_cleaned.csv]")
    print(f" - Min sc_w: {train_cleaned['sc_w'].min()} (zeros remaining: {(train_cleaned['sc_w'] == 0).sum()})")
    print(f" - Min px_height: {train_cleaned['px_height'].min()} (zeros remaining: {(train_cleaned['px_height'] == 0).sum()})")
    print(f" - Missing values: {train_cleaned.isnull().sum().sum()}")
    print(f" - Duplicates: {train_cleaned.duplicated().sum()}")
    print("=" * 60)


if __name__ == "__main__":
    clean_datasets()
