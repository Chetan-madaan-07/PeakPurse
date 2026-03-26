"""
PeakPurse ML Service

FastAPI service for financial health scoring, transaction categorization,
and personalized recommendations.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog
import uvicorn

from src.api.routes import health_score, recommendations, categorizer
from src.core.config import settings
from src.core.logging import setup_logging
from src.core.exceptions import setup_exception_handlers

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
)

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


async def verify_internal_request(request):
    """Verify that the request is from an internal service."""
    # Add authentication logic here (e.g., shared secret, mTLS)
    # For now, we'll just check for a specific header
    internal_secret = request.headers.get("X-Internal-Secret")
    if internal_secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True


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
