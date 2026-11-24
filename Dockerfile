FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install system build deps required for psycopg2 / scientific wheels if needed
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for layer caching
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r backend/requirements.txt

# Copy backend source and committed ML artifacts
COPY backend ./backend
COPY artifacts/tuned_rfecv_rf.joblib ./artifacts/tuned_rfecv_rf.joblib
COPY artifacts/baseline_rf.joblib ./artifacts/baseline_rf.joblib
COPY artifacts/tuned_metrics.json ./artifacts/tuned_metrics.json
COPY artifacts/baseline_metrics.json ./artifacts/baseline_metrics.json
COPY artifacts/error_analysis.json ./artifacts/error_analysis.json

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}"]
