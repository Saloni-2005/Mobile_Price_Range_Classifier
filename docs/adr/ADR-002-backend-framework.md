# ADR-002: Use FastAPI + Pydantic v2 as the Backend Framework

- **Status:** Accepted
- **Date:** 2026-10-18 (Updated 2026-11-12)

---

## Context

The Mobile Price-Range Classifier backend must expose REST endpoints for single-device inference (`POST /predict`), local TreeSHAP decomposition (`GET /explain/{prediction_id}`), interactive hardware sensitivity and margin simulation (`POST /whatif`), global feature attribution (`GET /feature-importance`), JWT authentication (`POST /auth/login`), and health/version checks (`GET /health`).

Every incoming payload carries 20 numeric and binary hardware specifications with strict domain bounds (e.g., `battery_power` in `[500, 2000]`, `ram` in `[256, 4096]`, `m_dep` in `[0.1, 1.0]`, plus a cross-field physical invariant requiring `sc_w <= sc_h`). Invalid or malformed hardware specs must be rejected before reaching scikit-learn or SHAP with structured `422 Unprocessable Entity` field-level diagnostics.

---

## Decision

We select **FastAPI** paired with **Pydantic v2** (`pydantic.BaseModel`, `Field` constraints, and `@model_validator`) as the web framework and validation layer ([backend/app/main.py](../../backend/app/main.py), [backend/app/schemas/prediction.py](../../backend/app/schemas/prediction.py)).

---

## Alternatives Considered

1. **Flask + Marshmallow:**
   - *Pros:* Minimalist microframework; familiar synchronous request lifecycle.
   - *Cons:* Requires manual wiring for request validation, OpenAPI schema generation, and dependency injection (`Depends(get_db)`, `Depends(require_analyst_jwt)`). Marshmallow validation is significantly slower and more verbose than Rust-backed Pydantic v2.
2. **Django REST Framework (DRF):**
   - *Pros:* Batteries-included ORM, admin panel, and authentication.
   - *Cons:* Heavyweight monolithic footprint for an ML microservice; tightly couples the API layer to Django's synchronous ORM rather than SQLAlchemy 2.0 + GeoAlchemy2; slower request serialization overhead.

---

## Consequences

- **Positive:**
  - **Declarative Domain Enforcement:** `DeviceSpecs` in [backend/app/schemas/prediction.py](../../backend/app/schemas/prediction.py) enforces all 20 hardware bounds and the `sc_w <= sc_h` cross-field constraint at the API boundary, automatically returning RFC-compliant `422` responses verified by `TC-API-02`.
  - **Clean Dependency Injection:** FastAPI's `Depends()` cleanly injects SQLAlchemy database sessions (`get_db`) and scoped JWT verification (`require_analyst_jwt` on `POST /whatif` and `GET /explain/{id}`) and makes overriding dependencies in `pytest` (`TestClient`) effortless.
  - **Auto-Generated OpenAPI Contract:** Interactive Swagger UI (`/docs`) and OpenAPI 3.1 schemas are generated automatically from Python type annotations.
  - **High Throughput & Low Overhead:** Achieves `p95 < 15 ms` on `POST /predict` and `POST /whatif`, well within the 200 ms non-functional SLA (`PRD Chapter 9.1`).
- **Negative / Trade-offs:**
  - CPU-bound scikit-learn and TreeSHAP calls must be defined with standard `def` route handlers (rather than `async def`) so FastAPI executes them in an external threadpool without blocking the main asyncio event loop.

