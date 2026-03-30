"""
PeakPurse ML Service

FastAPI service for financial health scoring, transaction categorization,
and personalized recommendations.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import structlog
import uvicorn
import os

from src.api.routes import health_score, recommendations, categorizer
from src.core.config import settings
from src.core.logging import setup_logging
from src.core.exceptions import setup_exception_handlers
from src.core.security import verify_internal_request

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title="PeakPurse ML Service",
    description="Machine Learning service for PeakPurse financial platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={"deepLinking": False}
)

# Add static files for serving missing assets
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Setup exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(
    health_score.router,
    prefix="/internal/ml",
    tags=["health-score"],
    dependencies=[Depends(verify_internal_request)],
)

app.include_router(
    recommendations.router,
    prefix="/internal/ml",
    tags=["recommendations"],
    dependencies=[Depends(verify_internal_request)],
)

app.include_router(
    categorizer.router,
    prefix="/internal/ml",
    tags=["categorizer"],
    dependencies=[Depends(verify_internal_request)],
)




@app.on_event("startup")
async def startup_event():
    """Initialize the ML service."""
    logger.info("Starting PeakPurse ML Service", version="1.0.0")
    
    # Load ML models
    try:
        # Initialize models here
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error("Failed to load ML models", error=str(e))
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources."""
    logger.info("Shutting down PeakPurse ML Service")


@app.get("/")
async def root():
    """Root endpoint with welcome message and API info."""
    return {
        "message": "Welcome to PeakPurse ML Service",
        "service": "peakpurse-ml-service",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_prefix": "/internal/ml",
        "endpoints": {
            "categorize": "/internal/ml/categorize",
            "categorize_batch": "/internal/ml/categorize/batch",
            "categorizer_health": "/internal/ml/categorizer/health",
            "health_score": "/internal/ml/health-score",
            "recommendations": "/internal/ml/recommendations"
        },
        "authentication": {
            "method": "X-Internal-Secret header",
            "example": "X-Internal-Secret: dev-secret-change-in-production"
        }
    }


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    """Chrome DevTools manifest file."""
    return {
        "protocol-version": "1.1",
        "allowed-origins": [
            "chrome-devtools://*",
            "devtools://*"
        ]
    }


@app.get("/swagger-ui.css.map")
async def swagger_css_map():
    """Swagger UI CSS source map."""
    return {
        "version": 3,
        "file": "swagger-ui.css",
        "sourceRoot": "",
        "sources": ["swagger-ui.css"],
        "names": [],
        "mappings": ""
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "peakpurse-ml-service",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
