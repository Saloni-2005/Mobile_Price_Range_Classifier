# ADR-005: Split Deployment Topology — Render (Dockerized FastAPI + PostgreSQL) and Vercel (React/Vite Frontend)

- **Status:** Accepted
- **Date:** 2026-11-05 (Updated 2026-11-12)

---

## Context

For the final Month 3 deployment (`PRD Chapter 6.2 & Chapter 21`), the system must be publicly accessible over HTTPS with:
1. A static SPA frontend (React 19 + Vite 7) serving the Classifier Studio, Feature Importance view, TreeSHAP Explorer, and What-If Margin Sandbox.
2. A containerized Python ML backend serving FastAPI, scikit-learn (`1.5.2`), and `shap` (`0.46.0`) alongside the committed `.joblib` model artifacts (`artifacts/tuned_rfecv_rf.joblib`).
3. A managed PostgreSQL instance storing users, predictions, cached SHAP payloads, and What-If simulations.
4. A GitHub Actions CI pipeline (`.github/workflows/ci.yml`) that runs `pytest` and enforces the model-validation accuracy/F1 gate on every push and pull request.

---

## Decision

We adopt a **split deployment topology**:
- **Frontend on Vercel:** Builds and serves the `frontend/` Vite React application via Vercel's global CDN, configured with `VITE_API_BASE_URL` pointing to the Render backend URL.
- **Backend + Database on Render:** Deploys the root `Dockerfile` (`python:3.11-slim` running `uvicorn app.main:app --host 0.0.0.0 --port 8000`) as a Render Web Service connected to a Render Managed PostgreSQL instance via `DATABASE_URL` and `JWT_SECRET_KEY`.
- **CI/CD on GitHub Actions:** Executes automated unit/contract tests (`pytest`) and the model performance regression gate (`TC-CI-01`: hold-out accuracy `>= 91.0%` and macro F1 `>= 0.910`) on every push and PR.

---

## Alternatives Considered

1. **Single Monolithic Render/Railway Container Hosting Both Frontend and Backend:**
   - *Pros:* Single deployment target; no CORS configuration required between frontend and backend origins.
   - *Cons:* Forces the Python container to build Node.js assets during Docker image construction (slower builds, larger image footprint) and serves static JS/CSS bundles from a single regional Python worker instead of an edge CDN.

---

## Consequences

- **Positive:**
  - **Independent Scaling & Fast Frontend Previews:** Frontend UI updates deploy in `< 30 seconds` on Vercel's edge network without rebuilding the heavier Python/scikit-learn/SHAP Docker image.
  - **Reproducible ML Runtime:** Containerizing the backend in a dedicated `Dockerfile` pins Python `3.11`, `scikit-learn==1.5.2`, and `shap==0.46.0`, eliminating pickle/joblib serialization drift between local training and cloud inference.
  - **Health & Version Observability:** `GET /health` exposes the active `model_version` (`v1.1.0-tuned-rfecv`) and database connectivity state for uptime monitoring (`TC-API-06`).
- **Negative / Trade-offs:**
  - Requires explicit CORS middleware (`CORSMiddleware` in [backend/app/main.py](../../backend/app/main.py) configured via `CORS_ORIGINS`) so the Vercel domain can call the Render API.
  - Free-tier Render web services spin down after 15 minutes of inactivity, resulting in a ~30-second cold-start on the first request after idle periods (documented in `PRD Chapter 9.2`).

