# Error Analysis & Known Failure Modes — Mobile Price-Range Classifier

**Model Version:** `v2.0.0-rfecv` (`artifacts/tuned_rfecv_rf.joblib`)  
**Evaluation Split:** Untouched 20% stratified hold-out test set (`N = 400`, `100` devices per tier, `random_state = 42`)  
**Reproducible Script & Raw Telemetry:** [`scripts/run_error_analysis.py`](../scripts/run_error_analysis.py) → [`artifacts/error_analysis.json`](../artifacts/error_analysis.json)

---

## 1. Hold-Out Confusion Matrix (4×4)

Evaluated on the 400 held-out test devices from `data/processed/train_cleaned.csv`:

| Actual \ Predicted | Tier 0 (`Low`) | Tier 1 (`Mid`) | Tier 2 (`Mid-High`) | Tier 3 (`High`) | Row Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Actual Tier 0 (`Low`)** | **99** | 1 | 0 | 0 | 100 |
| **Actual Tier 1 (`Mid`)** | 5 | **89** | 6 | 0 | 100 |
| **Actual Tier 2 (`Mid-High`)** | 0 | 4 | **93** | 3 | 100 |
| **Actual Tier 3 (`High`)** | 0 | 0 | 5 | **95** | 100 |
| **Column Total** | 104 | 94 | 104 | 98 | **400** |

- **Overall Hold-out Accuracy:** **94.00%** (`376 / 400` correct) — exceeds committed target ($\ge 90.0\%$) by **+4.00 percentage points**.
- **Overall Hold-out Macro F1:** **0.9399** — exceeds committed target ($\ge 0.8800$) by **+0.0599**.

---

## 2. Per-Class Precision, Recall, and F1-Score

| Price Tier | Precision | Recall | F1-Score | Support | Primary Error Pattern |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Tier 0 (`Low`)** | 0.9519 (95.19%) | 0.9900 (99.00%) | **0.9706** | 100 | 1 device predicted as Tier 1 (`ram=1817 MB`, `battery=590 mAh`) |
| **Tier 1 (`Mid`)** | 0.9468 (94.68%) | 0.8900 (89.00%) | **0.9175** | 100 | Caught between two decision boundaries: 5 slip to Tier 0, 6 slip to Tier 2 |
| **Tier 2 (`Mid-High`)** | 0.8942 (89.42%) | 0.9300 (93.00%) | **0.9118** | 100 | 4 slip down to Tier 1; 3 slip up to Tier 3 |
| **Tier 3 (`High`)** | 0.9694 (96.94%) | 0.9500 (95.00%) | **0.9596** | 100 | 5 devices with sub-3100 MB RAM predicted as Tier 2 |
| **Macro Average** | **0.9406** | **0.9400** | **0.9399** | **400** | — |
| **Weighted Average** | **0.9406** | **0.9400** | **0.9399** | **400** | — |

**Key Observation:** The two extreme tiers (`Tier 0: Low` and `Tier 3: High`) achieve the highest F1 scores (`0.9706` and `0.9596`) because they are bounded on only one side of the ordinal price spectrum. The two interior tiers (`Tier 1: Mid` and `Tier 2: Mid-High`) face transition boundaries on both sides, resulting in slightly lower F1 scores (`0.9175` and `0.9118`).

---

## 3. Boundary vs. Severe Misclassification Breakdown (PRD Chapter 15.1)

Because the target `price_range` is ordinal (`0 < 1 < 2 < 3`), misclassifying a handset into an adjacent tier (`|ŷ - y| = 1`) near a price cutoff is a minor boundary error, whereas misclassifying across two or more tiers (`|ŷ - y| >= 2`, e.g., predicting `Low` for a `High` flagship device) is a severe pricing failure.

| Error Category | Step Distance `|ŷ - y|` | Count | Share of Total Errors (`N=24`) | Share of Hold-Out Set (`N=400`) |
| :--- | :---: | :---: | :---: | :---: |
| **Correct Classifications** | `0` | **376** | — | **94.00%** |
| **Adjacent-Tier (Boundary) Errors** | `1` | **24** | **100.00%** | **6.00%** |
| **Severe 2-Tier Errors** | `2` | **0** | **0.00%** | **0.00%** |
| **Severe 3-Tier Errors** | `3` | **0** | **0.00%** | **0.00%** |
| **Total Severe (`2+` Tier) Errors** | `>= 2` | **0** | **0.00%** | **0.00%** |

### Directional Breakdown of the 24 Adjacent-Tier Boundary Errors

| Transition Direction | Count | Share of Errors | Typical Hardware Profile Driving Boundary Ambiguity |
| :--- | :---: | :---: | :--- |
| `Tier 0 (Low) → Tier 1 (Mid)` | 1 | 4.17% | High RAM (`1817 MB`) paired with minimal battery (`590 mAh`) and display (`509×227 px`) |
| `Tier 1 (Mid) → Tier 0 (Low)` | 5 | 20.83% | Low RAM (`595–1150 MB`) compensated by large battery (`1279–1902 mAh`) |
| `Tier 1 (Mid) → Tier 2 (Mid-High)` | 6 | 25.00% | Elevated RAM (`1973–2753 MB`) offset by small battery (`520–709 mAh`) |
| `Tier 2 (Mid-High) → Tier 1 (Mid)` | 4 | 16.67% | Moderate RAM (`1482–2208 MB`) sitting right on the Tier 1/2 split threshold |
| `Tier 2 (Mid-High) → Tier 3 (High)` | 3 | 12.50% | High RAM (`2612–3278 MB`) and strong battery (`1315–1589 mAh`) near the Tier 2/3 border |
| `Tier 3 (High) → Tier 2 (Mid-High)` | 5 | 20.83% | Upper-mid RAM (`2355–3073 MB`) with either low battery (`720–959 mAh`) or light chassis |

### Confidence Calibration on Boundary Errors

- **Correctly Classified Devices (`N = 376`):** Mean predicted probability = **83.65%** (median **87.50%**).
- **Misclassified Boundary Devices (`N = 24`):** Mean predicted probability drops to **60.71%** (median **60.50%**), and in **21 of the 24 errors**, the true tier holds the second-highest probability (`0.27–0.48`), confirming that errors occur almost exclusively in low-margin split-vote regions between adjacent price tiers.

---

## 4. Known Failure Modes — Out-of-Distribution (`out_of_distribution.csv`) Analysis

We evaluated `artifacts/tuned_rfecv_rf.joblib` and `shap.TreeExplainer` against the three adversarial/out-of-distribution edge cases in [`data/test_fixtures/out_of_distribution.csv`](../data/test_fixtures/out_of_distribution.csv):

| Row | `edge_case_type` | `ram` (MB) | `battery_power` (mAh) | `px_width` × `px_height` | `mobile_wt` (g) | Predicted Tier | Class Probabilities `[P0, P1, P2, P3]` | Max Confidence | Shannon Entropy |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 0 | `max_ram_min_everything_else` | 3998 | 500 | 500 × 0 | 80 | **Tier 3 (`High`)** | `[0.03, 0.07, 0.37, 0.53]` | **53.0%** | 0.9957 |
| 1 | `min_ram_max_everything_else` | 256 | 2000 | 1998 × 1960 | 200 | **Tier 0 (`Low`)** | `[0.40, 0.40, 0.19, 0.01]` | **40.0%** | 1.0946 |
| 2 | `high_battery_zero_resolution` | 2127 | 2000 | 500 × 0 | 140 | **Tier 1 (`Mid`)** | `[0.06, 0.59, 0.29, 0.06]` | **59.0%** | 1.0079 |

### Detailed Failure Mode Findings

1. **Failure Mode 1 — Single-Feature Dominance on Contradictory Hardware (`max_ram_min_everything_else`):**
   - **What happens:** When maximum RAM (`3998 MB`) is paired with the absolute minimum values of every other specification (`500 mAh` battery, `500×0 px` screen, `80 g` weight), the model predicts **`Tier 3 (High)`** (`P(Tier 3) = 0.53`, `P(Tier 2) = 0.37`).
   - **Why (TreeSHAP Decomposition):** Because `ram` accounts for **69.5%** of global impurity reduction in the Random Forest, `ram = 3998 MB` contributes a massive **`+0.5419` SHAP boost** toward Tier 3, which outweighs the combined negative SHAP penalties from `battery_power = 500` (`-0.1574`), `px_height = 0` (`-0.0660`), and `px_width = 500` (`-0.0548`).
   - **Diagnostic Signal:** Although the argmax class is Tier 3, the model's confidence drops from the normal Tier 3 average (`~85%`) down to **53.0%** (`90%` of probability mass split across Tiers 2 and 3).

2. **Failure Mode 2 — Split-Vote Tie Breaking on Inverse Contradictions (`min_ram_max_everything_else`):**
   - **What happens:** Pairing minimum RAM (`256 MB`) with flagship battery (`2000 mAh`), flagship display (`1998×1960 px`), and `200 g` chassis produces an **exact probability tie** between Tier 0 and Tier 1: **`[0.40, 0.40, 0.19, 0.01]`** (`max_confidence = 40.0%`, highest Shannon entropy `1.0946`).
   - **Why (TreeSHAP Decomposition):** `ram = 256 MB` pushes strongly toward Tier 0 (`+0.4983`), while `battery_power = 2000` (`-0.1434`), `px_height = 1960` (`-0.1216`), and `px_width = 1998` (`-0.0829`) pull the trees toward Tiers 1 and 2. Because `scikit-learn` resolves ties via `np.argmax` (lowest class index wins), the classifier outputs **`Tier 0 (Low)`**.
   - **Mitigation:** Analysts should treat any prediction with `max(probabilities) < 0.55` as a conflicted/ambiguous specification requiring human review and TreeSHAP inspection.

3. **Failure Mode 3 — Unimputed Zero-Resolution Drag (`high_battery_zero_resolution`):**
   - **What happens:** A device with mid-high RAM (`2127 MB`) and flagship battery (`2000 mAh`) but physically degenerate display resolution (`px_height = 0`, `px_width = 500`) is pulled down from Tier 2 (`P = 0.29`) into **`Tier 1 (Mid)`** (`P = 0.59`).
   - **Why:** In raw inference requests where `px_height = 0` is passed directly to the API (valid at the schema boundary `ge=0`), the decision trees route the sample down low-resolution branches (`+0.0789` from `px_width=500` and `+0.0680` from `px_height=0` toward Tier 1).

4. **Failure Mode 4 — Tree Step-Function Plateau on Extrapolated What-If Inputs (PRD Chapter 15.3):**
   - **What happens:** Axis-aligned decision trees in a `RandomForestClassifier` partition feature space using fixed split thresholds learned within the observed training bounds (`ram: 256–3998 MB`, `battery_power: 500–2000 mAh`, `px_width: 500–1998 px`, `px_height: 0–1960 px`, `mobile_wt: 80–200 g`). Pushing a What-If slider beyond those bounds (e.g., `ram = 4800 MB` or `battery_power = 2500 mAh`) traverses the exact same terminal leaf node as the training maximum, causing predicted class probabilities to **plateau** while the linear BOM cost proxy continues to increase.
   - **Mitigation Implemented:** Both `POST /whatif` (`is_extrapolated`, `extrapolated_features`) and the React `WhatIfSliders` / `MarginImpactPanel` components actively detect and display a prominent warning whenever any specification is adjusted outside the training domain.

---

## 5. Boundary Fixture Verification (`boundary_valid.csv`)

Evaluating all 40 single-feature min/max boundary rows in [`data/test_fixtures/boundary_valid.csv`](../data/test_fixtures/boundary_valid.csv) confirms:
- **Zero crashes or NaN outputs** across all 40 boundary configurations.
- **Tier distribution:** `1` Tier 0 (`ram_at_min`), `34` Tier 1 (baseline mid-spec with non-RFE or moderate boundary perturbations), `4` Tier 2 (`battery_power_at_max`, `px_height_at_max`, `px_width_at_max`), and `1` Tier 3 (`ram_at_max`).
- **Confidence range:** Min confidence `0.50`, mean confidence `0.6155`, max confidence `0.96` (`ram_at_min = 256 MB`).

