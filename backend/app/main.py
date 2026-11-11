"""
FastAPI application entrypoint (PRD Chapter 7.1).

Registers routers and loads the model artifact at startup when available.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import auth, explain, health, importance, predict, whatif
from app.auth.jwt_handler import seed_analyst_user
from app.services.inference import clear_model_cache, is_model_loadable, load_model
from app.services.shap_service import clear_explainer_cache


@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed_analyst_user()
    clear_model_cache()
    clear_explainer_cache()
    if is_model_loadable():
        load_model()
    yield
    clear_model_cache()
    clear_explainer_cache()


app = FastAPI(
    title="Mobile Price-Range Classifier API",
    version="0.1.0",
    description="Assisted Pricing Optimization Engine — Mobile Price-Range Classifier",
    lifespan=lifespan,
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(predict.router)
app.include_router(importance.router)
app.include_router(explain.router)
app.include_router(whatif.router)
