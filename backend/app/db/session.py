"""Database session management (PRD Ch. 7.1 / 9).

Supports PostgreSQL (default per PRD) with automatic local SQLite fallback
for development and test environments when a PostgreSQL daemon is not reachable.
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


DEFAULT_SQLITE_PATH = (
    Path(__file__).resolve().parents[3] / "artifacts" / "mobile_price.db"
)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    pg_url = "postgresql+psycopg2://postgres:postgres@localhost:5432/mobile_price"
    try:
        test_engine = create_engine(pg_url, pool_pre_ping=True)
        with test_engine.connect():
            DATABASE_URL = pg_url
    except Exception:
        DEFAULT_SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
        DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Ensure database schema tables are created."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
