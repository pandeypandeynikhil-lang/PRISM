from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
from app.routes import predict, rag, retention, customers, analytics
from app.ml.train_model import ensure_model_exists

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 PRISM Retention System starting up...")
    await init_db()
    ensure_model_exists()
    logger.info("✅ All systems initialized")
    yield
    logger.info("🛑 PRISM shutting down...")


app = FastAPI(
    title="PRISM - Proactive Retention Intelligence System for Markets",
    description="AI-powered churn prediction and retention strategy engine for banking",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router,    prefix="/api/predict",    tags=["Prediction"])
app.include_router(rag.router,        prefix="/api/rag",         tags=["RAG"])
app.include_router(retention.router,  prefix="/api/retention",   tags=["Retention"])
app.include_router(customers.router,  prefix="/api/customers",   tags=["Customers"])
app.include_router(analytics.router,  prefix="/api/analytics",   tags=["Analytics"])


@app.get("/")
async def root():
    return {
        "system": "PRISM",
        "status": "operational",
        "version": "2.0.0",
        "tagline": "Predict. Retain. Grow.",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "prism-backend"}
