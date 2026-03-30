"""
Exception handlers for PeakPurse ML Service
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


async def validation_exception_handler(request: Request, exc: HTTPException):
    """Handle validation exceptions"""
    logger.error(
        "Validation error occurred",
        error=str(exc.detail),
        path=request.url.path,
        method=request.method
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": str(exc.detail),
                "details": []
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        "Unexpected error occurred",
        error=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": []
            }
        }
    )


async def pdf_processing_exception_handler(request: Request, exc: Exception):
    """Handle PDF processing specific exceptions"""
    logger.error(
        "PDF processing error occurred",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "PDF_PROCESSING_ERROR",
                "message": "Failed to process PDF file",
                "details": [str(exc)]
            }
        }
    )


def setup_exception_handlers(app):
    """Setup all exception handlers for the FastAPI app"""
    app.add_exception_handler(HTTPException, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
