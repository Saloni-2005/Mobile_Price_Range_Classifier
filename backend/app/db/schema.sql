-- PostgreSQL schema for Mobile Price-Range Classifier (PRD Chapter 9 / ADR-003)
-- Enable PostGIS for the reserved regions table (not queried in v1).

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(64) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(32) NOT NULL DEFAULT 'analyst',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_registry (
    id              SERIAL PRIMARY KEY,
    version_tag     VARCHAR(64) NOT NULL UNIQUE,
    trained_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cv_accuracy     DOUBLE PRECISION,
    cv_macro_f1     DOUBLE PRECISION,
    artifact_path   TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS predictions (
    id                  SERIAL PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_json          JSONB NOT NULL,
    predicted_tier      INTEGER NOT NULL,
    probabilities_json  JSONB NOT NULL,
    model_version_id    INTEGER NOT NULL REFERENCES model_registry (id)
);

CREATE TABLE IF NOT EXISTS whatif_simulations (
    id                  SERIAL PRIMARY KEY,
    prediction_id       INTEGER NOT NULL REFERENCES predictions (id),
    adjusted_spec_json  JSONB NOT NULL,
    resulting_tier      INTEGER NOT NULL,
    margin_estimate     DOUBLE PRECISION,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reserved for regional price-benchmarking roadmap; stays empty this month.
CREATE TABLE IF NOT EXISTS regions (
    id              SERIAL PRIMARY KEY,
    region_name     VARCHAR(128) NOT NULL,
    geom            geometry,
    avg_price_tier  DOUBLE PRECISION
);
