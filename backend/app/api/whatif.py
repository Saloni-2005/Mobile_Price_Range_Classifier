"""
POST /whatif — What-if scenario simulation route (PRD Ch. 5, 10.4, 11).

Protected by the scoped analyst JWT dependency (PRD Ch. 10.4).
Full simulation logic is scheduled for Month 3 and currently raises NotImplementedError.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Depends

from app.auth.jwt_handler import require_analyst_jwt

router = APIRouter(tags=["whatif"])


@router.post("/whatif")
def whatif(
    _payload: dict[str, Any] | None = Body(default=None),
    _claims: dict = Depends(require_analyst_jwt),
):
    """
    Placeholder route for Month 3 Assisted Pricing Optimization Engine what-if simulation.
    Protected by JWT auth per PRD Chapter 10.4.
    """
    raise NotImplementedError(
        "What-if scenario simulation (/whatif) is scheduled for Month 3."
    )
