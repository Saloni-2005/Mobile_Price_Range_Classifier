"""
SQLAlchemy models for the 5 PostgreSQL tables (PRD Chapter 9).

regions.geom is reserved for PostGIS (ADR-003); table stays empty this month.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="analyst")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    version_tag: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    cv_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    cv_macro_f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    artifact_path: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    predictions: Mapped[list[Prediction]] = relationship(back_populates="model_version")

    def __repr__(self) -> str:
        return f"<ModelRegistry id={self.id} version_tag={self.version_tag!r}>"


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    input_json: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False
    )
    predicted_tier: Mapped[int] = mapped_column(Integer, nullable=False)
    probabilities_json: Mapped[list] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False
    )
    model_version_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("model_registry.id"), nullable=False
    )

    model_version: Mapped[ModelRegistry] = relationship(back_populates="predictions")
    whatif_simulations: Mapped[list[WhatIfSimulation]] = relationship(
        back_populates="prediction"
    )

    def __repr__(self) -> str:
        return f"<Prediction id={self.id} predicted_tier={self.predicted_tier}>"


class WhatIfSimulation(Base):
    __tablename__ = "whatif_simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prediction_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("predictions.id"), nullable=False
    )
    adjusted_spec_json: Mapped[dict] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False
    )
    resulting_tier: Mapped[int] = mapped_column(Integer, nullable=False)
    margin_estimate: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    prediction: Mapped[Prediction] = relationship(back_populates="whatif_simulations")

    def __repr__(self) -> str:
        return f"<WhatIfSimulation id={self.id} resulting_tier={self.resulting_tier}>"


class Region(Base):
    """
    PostGIS roadmap table (ADR-003). Not populated or queried in v1.

    `geom` is stored as Text in ORM for environments without geoalchemy2;
    `schema.sql` creates a real PostGIS geometry column.
    """

    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    region_name: Mapped[str] = mapped_column(String(128), nullable=False)
    # Placeholder for PostGIS geometry; see backend/app/db/schema.sql
    geom: Mapped[str | None] = mapped_column(Text, nullable=True)
    avg_price_tier: Mapped[float | None] = mapped_column(Float, nullable=True)

    def __repr__(self) -> str:
        return f"<Region id={self.id} region_name={self.region_name!r}>"
