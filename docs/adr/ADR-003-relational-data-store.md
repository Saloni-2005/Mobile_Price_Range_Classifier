# ADR-003: Use PostgreSQL + PostGIS as the Relational Data Store (with Automatic SQLite Fallback for Local Dev/CI)

- **Status:** Accepted
- **Date:** 2026-10-22 (Updated 2026-11-12 with SQLite fallback details)

---

## Context

The system requires persistent storage for 6 core entities (`PRD Chapter 7`):
1. `users` — Analyst accounts with `bcrypt` password hashes and role-based access control (`analyst`, `viewer`).
2. `model_registry` — Versioned ML model metadata (`v1.0.0-baseline`, `v1.1.0-tuned-rfecv`), hyperparameters (`JSONB`), metrics (`JSONB`), and active deployment flag (`is_active`).
3. `devices` — Submitted 20-feature hardware specification payloads.
4. `predictions` — Model inference audit log (`predicted_tier`, `probabilities`, `shap_values`, `latency_ms`) linked to `devices`, `model_registry`, and `regions`.
5. `whatif_simulations` — Audit log of interactive What-If overrides (`feature_deltas`, `new_tier`, `new_probabilities`, `estimated_margin_delta_pct`).
6. `regions` — Market currency and PostGIS `GEOMETRY(Polygon, 4326)` column reserved for the post-Viva-3 regional pricing roadmap.

At the same time, contributors, graders, and CI runners (`pytest`) need to run the backend and test suite immediately on a fresh clone without requiring a local PostgreSQL + PostGIS daemon to be running.

---

## Decision

We adopt **PostgreSQL 15+ with the PostGIS extension** as our canonical production relational schema ([backend/app/db/schema.sql](../../backend/app/db/schema.sql)) accessed via **SQLAlchemy 2.0 ORM** ([backend/app/db/models.py](../../backend/app/db/models.py)).

In [backend/app/db/session.py](../../backend/app/db/session.py), we implement a connection probe (`_build_engine()`) that connects to `DATABASE_URL` (`postgresql://...`) with a 2-second timeout and automatically falls back to a local SQLite database (`sqlite:///.../artifacts/mobile_price.db`) when PostgreSQL is unreachable or when running in CI/test mode. Cross-dialect JSON columns (`JSONB` on PostgreSQL, `JSON` on SQLite) ensure identical ORM behavior across both engines.

---

## Alternatives Considered

1. **SQLite Only (Production + Local):**
   - *Pros:* Zero external database server required.
   - *Cons:* Ephemeral disk on cloud PaaS containers (Render free tier wipes container filesystem on redeploy); lacks native `JSONB` indexing, concurrent write scalability, and `PostGIS` spatial geometry types.
2. **MongoDB (Document Store):**
   - *Pros:* Flexible schema for storing nested JSON probabilities and SHAP arrays.
   - *Cons:* Sacrifices relational foreign-key integrity across `devices -> predictions -> whatif_simulations` and `model_registry`, and does not align with the relational ERD and SQL schema required in `PRD Chapter 7`.
3. **No Database (Flat Files / In-Memory Only):**
   - *Pros:* Simplest deployment.
   - *Cons:* Cannot persist prediction IDs for subsequent `GET /explain/{prediction_id}` lookups, cannot cache computed TreeSHAP values, and provides no audit trail for `POST /whatif` simulations or user authentication.

---

## Consequences

- **Positive:**
  - **Full Relational Auditability:** Every `POST /predict` call writes a `Device` and `Prediction` record, allowing `GET /explain/{prediction_id}` to retrieve exact device specs and cache computed TreeSHAP values in `predictions.shap_values` so repeat lookups cost 0 ms of SHAP recomputation.
  - **Zero-Friction Local Setup & CI:** Because `session.py` automatically falls back to SQLite and `init_db_and_seed()` seeds the default `analyst@priceopt.ai` user and `model_registry` rows at startup, `pytest` and local `uvicorn` work out-of-the-box on any machine.
- **Negative / Trade-offs:**
  - Maintaining dialect compatibility between PostgreSQL (`schema.sql` with `JSONB` and `PostGIS`) and SQLite (ORM `JSON` fallback) requires keeping spatial columns (`regions.geom`) isolated to the DDL migration script until regional pricing queries are activated.

