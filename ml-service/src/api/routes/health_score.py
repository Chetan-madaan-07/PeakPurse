"""
Health Score API routes (placeholder for Step 2)
"""

from fastapi import APIRouter, HTTPException
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.post("/health-score", summary="Calculate financial health score")
async def calculate_health_score(request_data: dict) -> dict:
    """
    Placeholder endpoint for health score calculation.
    Will be implemented in later steps.
    """
    return {
        "status": "placeholder",
        "message": "Health score calculation not yet implemented",
        "score": 75.0
    }
