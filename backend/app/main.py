"""
FastAPI application entrypoint (PRD Chapter 7.1).

Registers routers and loads the model artifact at startup when available.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import health
from app.services.inference import clear_model_cache, is_model_loadable, load_model


@asynccontextmanager
async def lifespan(_app: FastAPI):
    clear_model_cache()
    if is_model_loadable():
        load_model()
    yield
    clear_model_cache()


app = FastAPI(
    title="Mobile Price-Range Classifier API",
    version="0.1.0",
    description="Assisted Pricing Optimization Engine — Mobile Price-Range Classifier",
    lifespan=lifespan,
)

app.include_router(health.router)
