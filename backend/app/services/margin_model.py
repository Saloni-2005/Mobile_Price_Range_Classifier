"""
Illustrative cost/margin model (PRD Chapters 5.3, 13, 15.3).

Provides a transparent, deterministic bill-of-materials (BOM) and gross-margin
approximation for what-if hardware specification simulations, plus training-range
extrapolation detection.

IMPORTANT CAVEAT:
All cost and margin figures produced by this module are illustrative approximations
calibrated for demonstrating specification trade-offs — NOT real vendor BOM data.
"""

from __future__ import annotations

from typing import Any

ILLUSTRATIVE_CAVEAT: str = (
    "Illustrative cost/margin model — transparent linear approximation for "
    "demonstrating specification trade-offs only, not real vendor bill-of-materials "
    "(BOM) data."
)

# Typical retail price midpoints (USD) for each of the 4 target price tiers
TIER_PRICE_MIDPOINTS_USD: dict[int, float] = {
    0: 125.0,  # Low tier (< $150)
    1: 225.0,  # Mid tier ($150 - $300)
    2: 400.0,  # Mid-High tier ($300 - $500)
    3: 650.0,  # High / Flagship tier ($500+)
}

# Fixed base chassis / PCB / assembly overhead (USD)
BASE_CHASSIS_COST_USD: float = 45.0

# Linear per-unit component cost coefficients (USD per unit)
# Primarily driven by the 5 RFE-selected features, with small secondary terms
COMPONENT_UNIT_COSTS_USD: dict[str, float] = {
    "ram": 0.012,            # $0.012 per MB (~$12.29 per GB)
    "battery_power": 0.015,  # $0.015 per mAh ($15.00 per 1000 mAh)
    "px_width": 0.008,       # $0.008 per horizontal pixel
    "px_height": 0.008,      # $0.008 per vertical pixel
    "mobile_wt": 0.080,      # $0.080 per gram of structural/thermal material
    "int_memory": 0.200,     # $0.200 per GB internal storage
    "pc": 1.000,             # $1.000 per MP primary camera
    "fc": 0.600,             # $0.600 per MP front camera
    "n_cores": 2.000,        # $2.000 per CPU core
}

# Observed training dataset min/max bounds for the 20 features (PRD Ch. 12 / 15.3)
TRAINING_FEATURE_BOUNDS: dict[str, tuple[float, float]] = {
    "battery_power": (500.0, 2000.0),
    "blue": (0.0, 1.0),
    "clock_speed": (0.5, 3.0),
    "dual_sim": (0.0, 1.0),
    "fc": (0.0, 19.0),
    "four_g": (0.0, 1.0),
    "int_memory": (2.0, 64.0),
    "m_dep": (0.1, 1.0),
    "mobile_wt": (80.0, 200.0),
    "n_cores": (1.0, 8.0),
    "pc": (0.0, 20.0),
    "px_height": (0.0, 1960.0),
    "px_width": (500.0, 1998.0),
    "ram": (256.0, 3998.0),
    "sc_h": (5.0, 19.0),
    "sc_w": (0.0, 18.0),
    "talk_time": (2.0, 20.0),
    "three_g": (0.0, 1.0),
    "touch_screen": (0.0, 1.0),
    "wifi": (0.0, 1.0),
}


def detect_extrapolated_features(specs: dict[str, Any]) -> list[str]:
    """
    Return sorted list of feature names whose values fall outside the observed
    training dataset range (PRD Chapter 15.3).
    """
    extrapolated: list[str] = []
    for feat, (low, high) in TRAINING_FEATURE_BOUNDS.items():
        if feat not in specs or specs[feat] is None:
            continue
        val = float(specs[feat])
        if val < low or val > high:
            extrapolated.append(feat)
    return sorted(extrapolated)


def estimate_bom_cost(specs: dict[str, Any]) -> float:
    """
    Compute the illustrative bill-of-materials (BOM) cost in USD for a device spec.
    """
    cost = BASE_CHASSIS_COST_USD
    for feat, unit_cost in COMPONENT_UNIT_COSTS_USD.items():
        val = specs.get(feat, 0)
        if val is not None:
            cost += float(val) * unit_cost
    return round(cost, 2)


def estimate_margin(specs: dict[str, Any], predicted_tier: int) -> dict[str, float]:
    """
    Compute illustrative price midpoint, BOM cost, and gross margin for a spec & tier.
    """
    midpoint = TIER_PRICE_MIDPOINTS_USD.get(int(predicted_tier), 225.0)
    bom = estimate_bom_cost(specs)
    gross_margin_usd = round(midpoint - bom, 2)
    gross_margin_pct = round((gross_margin_usd / midpoint) * 100.0, 2) if midpoint else 0.0
    return {
        "tier_midpoint_usd": midpoint,
        "bom_cost_usd": bom,
        "gross_margin_usd": gross_margin_usd,
        "gross_margin_pct": gross_margin_pct,
    }


def compute_whatif_margin_delta(
    baseline_specs: dict[str, Any],
    baseline_tier: int,
    adjusted_specs: dict[str, Any],
    resulting_tier: int,
) -> dict[str, Any]:
    """
    Compare baseline vs. adjusted specifications and return illustrative BOM and
    margin deltas alongside extrapolation flags.
    """
    base_est = estimate_margin(baseline_specs, baseline_tier)
    adj_est = estimate_margin(adjusted_specs, resulting_tier)

    margin_delta_usd = round(
        adj_est["gross_margin_usd"] - base_est["gross_margin_usd"], 2
    )
    margin_pct_delta = round(
        adj_est["gross_margin_pct"] - base_est["gross_margin_pct"], 2
    )
    bom_delta_usd = round(adj_est["bom_cost_usd"] - base_est["bom_cost_usd"], 2)
    extrapolated = detect_extrapolated_features(adjusted_specs)

    return {
        "baseline_tier_midpoint_usd": base_est["tier_midpoint_usd"],
        "resulting_tier_midpoint_usd": adj_est["tier_midpoint_usd"],
        "baseline_bom_usd": base_est["bom_cost_usd"],
        "adjusted_bom_usd": adj_est["bom_cost_usd"],
        "bom_cost_delta_usd": bom_delta_usd,
        "baseline_margin_usd": base_est["gross_margin_usd"],
        "resulting_margin_usd": adj_est["gross_margin_usd"],
        "margin_estimate_delta": margin_delta_usd,
        "margin_pct_delta": margin_pct_delta,
        "extrapolated_features": extrapolated,
        "is_extrapolated": len(extrapolated) > 0,
        "is_illustrative": True,
        "caveat": ILLUSTRATIVE_CAVEAT,
    }
