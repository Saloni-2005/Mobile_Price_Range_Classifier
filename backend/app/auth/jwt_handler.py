"""
JWT issuance, verification, and seeded analyst authentication (PRD Ch. 10.4).

Implements RFC 7519 HMAC-SHA256 (HS256) JSON Web Tokens and PBKDF2-HMAC-SHA256
password hashing for the single seeded pricing-analyst persona.
"""

from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import os
import secrets
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import SessionLocal, init_db

# Configuration (PRD Chapter 10.4)
SEEDED_USERNAME: str = os.getenv("ANALYST_USERNAME", "analyst")
SEEDED_PASSWORD: str = os.getenv("ANALYST_PASSWORD", "pricing2026")
SEEDED_ROLE: str = "analyst"

JWT_SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY", "mobile-price-classifier-jwt-secret-key-2026"
)
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Password hashing (PBKDF2-HMAC-SHA256)
# ---------------------------------------------------------------------------

def hash_password(password: str, salt: str | None = None) -> str:
    """Hash a plaintext password using PBKDF2-HMAC-SHA256."""
    actual_salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        actual_salt.encode("utf-8"),
        100_000,
    )
    return f"pbkdf2_sha256${actual_salt}${dk.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a plaintext password against a stored PBKDF2 hash."""
    try:
        scheme, salt, _digest = stored_hash.split("$", 2)
        if scheme != "pbkdf2_sha256":
            return False
        candidate = hash_password(plain_password, salt=salt)
        return hmac.compare_digest(candidate, stored_hash)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Seeded Analyst User (PRD Chapter 10.4)
# ---------------------------------------------------------------------------

def seed_analyst_user(db: Session | None = None) -> User:
    """
    Ensure the single shared pricing-analyst user exists in the `users` table.
    Idempotent across restarts and test runs.
    """
    init_db()
    owns_session = db is None
    session = db or SessionLocal()
    try:
        user = (
            session.query(User).filter(User.username == SEEDED_USERNAME).first()
        )
        if user is None:
            user = User(
                username=SEEDED_USERNAME,
                password_hash=hash_password(SEEDED_PASSWORD),
                role=SEEDED_ROLE,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user
    finally:
        if owns_session:
            session.close()


# ---------------------------------------------------------------------------
# Base64URL & HS256 JWT Encoding / Decoding (RFC 7519)
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode((segment + padding).encode("ascii"))


def create_access_token(
    subject: str = SEEDED_USERNAME,
    role: str = SEEDED_ROLE,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed HS256 JWT access token."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    header_b64 = _b64url_encode(
        json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    payload_b64 = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(
        JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an HS256 JWT access token. Raises 401 on failure."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or not isinstance(token, str):
        raise unauthorized

    parts = token.split(".")
    if len(parts) != 3:
        raise unauthorized

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = hmac.new(
        JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()

    try:
        actual_sig = _b64url_decode(signature_b64)
        header = json.loads(_b64url_decode(header_b64).decode("utf-8"))
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
    except Exception as exc:
        raise unauthorized from exc

    if not hmac.compare_digest(actual_sig, expected_sig):
        raise unauthorized

    if header.get("alg") != JWT_ALGORITHM:
        raise unauthorized

    exp = payload.get("exp")
    if exp is None or int(datetime.now(timezone.utc).timestamp()) >= int(exp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not payload.get("sub"):
        raise unauthorized

    return payload


# ---------------------------------------------------------------------------
# FastAPI Security Dependency
# ---------------------------------------------------------------------------

def require_analyst_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """
    FastAPI dependency protecting /predict, /whatif, and /explain (PRD Ch. 10.4).
    Rejects unauthenticated or malformed Bearer tokens with 401 Unauthorized.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Bearer JWT token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)
