# Architecture Decision Records (ADRs)

This directory contains the 5 Architecture Decision Records (ADRs) for the **Mobile Price-Range Classifier — Assisted Pricing Optimization Engine**, following the format specified in PRD Chapter 16 (`Status` | `Context` | `Decision` | `Alternatives Considered` | `Consequences`).

| ID | Decision Title | Alternatives Considered | Status |
| :--- | :--- | :--- | :--- |
| [ADR-001](./ADR-001-feature-selection-method.md) | Use Recursive Feature Elimination with Cross-Validation (`RFECV` wrapped around a Random Forest) as the feature-selection method | Mutual information (`SelectKBest`); L1 regularization (Lasso / Logistic Regression); no feature selection (all 20 features) | Accepted |
| [ADR-002](./ADR-002-backend-framework.md) | Use FastAPI + Pydantic v2 as the backend framework | Flask + Marshmallow; Django REST Framework | Accepted |
| [ADR-003](./ADR-003-relational-data-store.md) | Use PostgreSQL + PostGIS as the primary relational store (with automatic SQLite fallback for offline local dev/CI) | SQLite only; MongoDB; no database (flat files only) | Accepted |
| [ADR-004](./ADR-004-explainability-method.md) | Use TreeSHAP (`shap.TreeExplainer`) for local prediction explainability | LIME; global permutation importance only | Accepted |
| [ADR-005](./ADR-005-deployment-topology.md) | Split deployment topology: Render (Dockerized FastAPI backend + managed PostgreSQL) + Vercel (React/Vite static frontend) | Single Render/Railway service hosting both frontend and backend | Accepted |

