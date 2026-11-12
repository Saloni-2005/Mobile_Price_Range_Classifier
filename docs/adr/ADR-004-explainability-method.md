# ADR-004: Use TreeSHAP (`shap.TreeExplainer`) for Local Prediction Explainability

- **Status:** Accepted
- **Date:** 2026-10-28 (Updated 2026-11-12)

---

## Context

Product managers and pricing analysts cannot rely on an opaque class label (`Tier 2`) when deciding whether to upgrade a device's RAM or battery capacity. Business Requirement `BR-02` (`FR-02`) mandates that every prediction be accompanied by a local feature attribution showing how each hardware specification pushed the model's probability toward or away from the predicted price tier relative to the prior base expectation (`E[f(X)] ≈ 0.25`).

Furthermore, `PRD Chapter 9.1` and `Chapter 12.1` require two strict guarantees:
1. **Latency SLA:** `GET /explain/{prediction_id}` must respond in `< 400 ms` (`p95`).
2. **Mathematical Additivity (`TC-SHAP-01`):** The sum of the base value and the per-feature attributions for the predicted class must equal the model's predicted class probability within `1e-4`:
   $$\text{base\_value} + \sum_{i=1}^{k} \phi_i = P(\text{class} = c \mid x) \pm 10^{-4}$$

---

## Decision

We adopt **TreeSHAP** (`shap.TreeExplainer` from the `shap` library) computed directly over the underlying `RandomForestClassifier` inside the fitted `RFECV` pipeline ([backend/app/services/shap_service.py](../../backend/app/services/shap_service.py)).

The `TreeExplainer` instance is initialized once at application startup inside `ModelService` and reused across requests. Once `GET /explain/{prediction_id}` computes the decomposition for a prediction, the resulting JSON payload is cached in `predictions.shap_values` in the database so subsequent fetches return immediately.

---

## Alternatives Considered

1. **LIME (`LimeTabularExplainer`):**
   - *Pros:* Model-agnostic local surrogate model.
   - *Cons:* Perturbs inputs via random Gaussian sampling (typically 5,000 samples per request), making it slow (`> 500 ms` per call), non-deterministic across repeated calls on the same device, and unable to guarantee exact game-theoretic additivity (`base_value + sum(weights) != predicted_probability`).
2. **Global Permutation Importance Only:**
   - *Pros:* Precomputed once offline (`artifacts/feature_importance.json`); zero runtime cost.
   - *Cons:* Only explains which features matter *on average across the entire dataset* (`FR-04`), providing zero insight into why a *specific* device (`prediction_id`) was classified into Tier 2 vs. Tier 3.

---

## Consequences

- **Positive:**
  - **Exact Additivity Verified in Runtime & CI:** Every response from `GET /explain/{prediction_id}` computes `additivity_Hold = |base_value + sum(shap_values) - predicted_prob| < 1e-4` (typically `~1.4e-15` in floating-point precision) and surfaces this verification badge directly in the frontend `ShapWaterfall` component (`TC-SHAP-01`).
  - **Fast Deterministic Execution:** Exact polynomial-time tree traversal runs in **~25–45 ms** on the 5-feature tuned Random Forest (and `< 3 ms` on cached lookups), beating the 400 ms SLA by an order of magnitude.
- **Negative / Trade-offs:**
  - `shap.TreeExplainer` is specific to tree-based models (Random Forest, XGBoost, LightGBM). If a future model version replaces the Random Forest with a neural network or kernel SVM, `TreeExplainer` would need to be swapped for `KernelExplainer` or `DeepExplainer`.
  - Different versions of `shap` (`0.42+` vs `0.45+`) return multiclass `shap_values` either as a `list` of `K` arrays `(n_samples, n_features)` or a single 3D `ndarray` `(n_samples, n_features, K)`. We handle both shapes explicitly in `_extract_class_shap()` in [backend/app/services/shap_service.py](../../backend/app/services/shap_service.py).

