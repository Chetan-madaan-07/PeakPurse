"""
Chatbot API routes using Gemini 1.5 Flash (google.genai SDK)
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from google.genai import types
import structlog
import asyncio

logger = structlog.get_logger()
router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("/chat", summary="Send a message to PeakBot")
async def process_chat(request: Request, payload: ChatRequest) -> dict:
    """
    Process a user message through Gemini 1.5 Flash with exponential backoff.
    """
    if not hasattr(request.app.state, "gemini_client"):
        logger.error("Gemini client not found in app state.")
        raise HTTPException(status_code=503, detail="Chatbot service is currently offline.")

    client = request.app.state.gemini_client
    model_name = request.app.state.gemini_model

    wait_time = 2
    max_retries = 3

    for attempt in range(max_retries):
        try:
            logger.info("Sending message to Gemini", attempt=attempt + 1)

            response = client.models.generate_content(
                model=model_name,
                contents=payload.message,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are PeakBot, a helpful and professional financial assistant "
                        "for Indian users on the PeakPurse app. Always respond concisely."
                    ),
                    temperature=0.7,
                    max_output_tokens=1024,
                ),
            )

            return {"success": True, "reply": response.text}

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                logger.warning("Gemini rate limit hit. Waiting...", wait_time=wait_time)
                await asyncio.sleep(wait_time)
                wait_time *= 2
            else:
                logger.error("Gemini critical error", error=err_str)
                raise HTTPException(status_code=500, detail="Chatbot encountered an unexpected error.")

    logger.error("Max retries reached for Gemini API")
    raise HTTPException(status_code=429, detail="AI Service is overloaded. Please try again later.")


@router.get("/chat/health", summary="Health check for chatbot")
async def chatbot_health(request: Request) -> dict:
    return {
        "status": "healthy",
        "gemini_ready": hasattr(request.app.state, "gemini_client"),
    }
