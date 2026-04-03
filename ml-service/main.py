"""
PeakPurse ML Service

FastAPI service for financial health scoring, transaction categorization,
and personalized recommendations.
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import structlog
import uvicorn
import os
import google.genai as genai

# Added chatbot to your imports
from src.api.routes import health_score, recommendations, categorizer, chatbot
from src.core.config import settings
from src.core.logging import setup_logging
from src.core.exceptions import setup_exception_handlers
from src.core.security import verify_internal_request
from datetime import datetime

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

@app.get("/ping", tags=["Health"])
async def keep_alive_ping():
    """Endpoint for UptimeRobot and Internal Triggers to keep the server awake."""
    return {
        "status": "ok",
        "service": "PeakPurse ML Service",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "I am awake!"
    }

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

# NEW: Include Chatbot router
app.include_router(
    chatbot.router,
    prefix="/internal/ml",
    tags=["chatbot"],
    dependencies=[Depends(verify_internal_request)],
)


@app.on_event("startup")
async def startup_event():
    """Initialize the ML service."""
    logger.info("Starting PeakPurse ML Service", version="1.0.0")
    
    # Load ML models
    try:
        # Initialize models here (Your LayoutLM and others remain untouched)
        logger.info("ML models loaded successfully")
        
        # NEW: Initialize Gemini for the Chatbot
        api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, 'GEMINI_API_KEY', None)
        if api_key:
            client = genai.Client(api_key=api_key)
            app.state.gemini_client = client
            app.state.gemini_model = "gemini-1.5-flash"
            logger.info("Gemini 1.5 Flash initialized successfully for Chatbot")
        else:
            logger.warning("GEMINI_API_KEY not found! Chatbot will not function until key is provided.")
            
    except Exception as e:
        logger.error("Failed to load ML models or initialize Gemini", error=str(e))
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
            "recommendations": "/internal/ml/recommendations",
            "chatbot": "/internal/ml/chat" # NEW
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
async def health_check(request: Request):
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "peakpurse-ml-service",
        "version": "1.0.0",
        "gemini_status": "initialized" if hasattr(request.app.state, "gemini_model") else "offline" # NEW
    }


if __name__ == "__main__":
    # Render provides a PORT environment variable; fallback to 8000 for local dev
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False, # Set to False for production
        log_level="info",
    )