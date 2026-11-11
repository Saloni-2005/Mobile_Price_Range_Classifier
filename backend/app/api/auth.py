"""
POST /auth/login — Scoped authentication endpoint for the pricing-analyst persona (PRD Ch. 10.4).

Verifies credentials against the seeded user in the `users` table and issues a short-lived JWT.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.jwt_handler import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    seed_analyst_user,
    verify_password,
)
from app.db.models import User
from app.db.session import SessionLocal, init_db

router = APIRouter(tags=["auth"])


def get_db():
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class LoginRequest(BaseModel):
    """Credentials payload for analyst login."""

    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    """Issued JWT token response."""

    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    expires_in: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60


@router.post("/auth/login", response_model=TokenResponse, status_code=200)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """
    Authenticate the seeded pricing-analyst user and issue a short-lived JWT.
    """
    seed_analyst_user(db)

    user = db.query(User).filter(User.username == body.username).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.username, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        role=user.role,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
