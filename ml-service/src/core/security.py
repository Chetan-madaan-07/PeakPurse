"""
Security utilities for PeakPurse ML Service
"""

from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from .config import settings

logger = structlog.get_logger()

# Optional: Use HTTPBearer for token-based authentication
security = HTTPBearer(auto_error=False)


async def verify_internal_request(request: Request) -> bool:
    """
    Verify that the request is from an internal service.
    
    This function checks for the X-Internal-Secret header to ensure
    the request is coming from an authorized internal service.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        True if authenticated
        
    Raises:
        HTTPException: If authentication fails
    """
    # Method 1: Check header-based authentication
    internal_secret = request.headers.get("X-Internal-Secret")
    if internal_secret == settings.INTERNAL_SECRET:
        logger.debug("Internal request authenticated via header")
        return True
    
    # Method 2: Check Bearer token (optional)
    try:
        credentials: HTTPAuthorizationCredentials = await security(request)
        if credentials and credentials.credentials == settings.INTERNAL_SECRET:
            logger.debug("Internal request authenticated via bearer token")
            return True
    except Exception:
        # Bearer token authentication failed, continue to other methods
        pass
    
    # Method 3: Check query parameter (for development/testing)
    if settings.DEBUG:
        query_secret = request.query_params.get("internal_secret")
        if query_secret == settings.INTERNAL_SECRET:
            logger.debug("Internal request authenticated via query param (development)")
            return True
    
    # Authentication failed
    logger.warning("Unauthorized internal request attempt", 
                  client_ip=request.client.host if request.client else "unknown")
    
    raise HTTPException(
        status_code=403,
        detail="Forbidden: Invalid or missing internal authentication",
        headers={"WWW-Authenticate": "Bearer"},
    )


def verify_file_size(file_size: int) -> bool:
    """
    Verify that file size is within allowed limits
    
    Args:
        file_size: File size in bytes
        
    Returns:
        True if within limits
        
    Raises:
        HTTPException: If file is too large
    """
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
        )
    return True


def validate_pdf_file(filename: str) -> bool:
    """
    Validate that the uploaded file is a PDF
    
    Args:
        filename: Uploaded filename
        
    Returns:
        True if valid PDF
        
    Raises:
        HTTPException: If not a PDF
    """
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    return True
