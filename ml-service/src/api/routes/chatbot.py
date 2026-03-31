"""
Chatbot API routes using Gemini 1.5 Flash
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from google.api_core import exceptions
import structlog
import asyncio

logger = structlog.get_logger()
router = APIRouter()

# 1. Define the expected request body
class ChatRequest(BaseModel):
    message: str
    # Note: You can add user_id or session_id here later when you want to store chat history

# 2. The main Chat endpoint
@router.post("/chat", summary="Send a message to the Gemini Chatbot")
async def process_chat(request: Request, payload: ChatRequest) -> dict:
    """
    Process a user message through Gemini 1.5 Flash with exponential backoff.
    """
    # Verify the model is loaded (safety check)
    if not hasattr(request.app.state, "gemini_model"):
        logger.error("Gemini model not found in app state.")
        raise HTTPException(status_code=503, detail="Chatbot service is currently offline.")

    model = request.app.state.gemini_model
    
    # "Crash-proof" loop parameters
    wait_time = 2
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            logger.info("Sending message to Gemini", attempt=attempt+1)
            
            # Optional: Give the bot a personality or context
            system_prompt = "You are a helpful and professional financial assistant for the PeakPurse app."
            full_prompt = f"{system_prompt}\n\nUser: {payload.message}\nAssistant:"
            
            # Execute the call
            response = model.generate_content(full_prompt)
            
            return {
                "success": True,
                "reply": response.text
            }
            
        except exceptions.ResourceExhausted:
            # Error 429: Rate Limit Hit
            logger.warning("Gemini Rate Limit Hit. Waiting...", wait_time=wait_time)
            await asyncio.sleep(wait_time)
            wait_time *= 2  # Double the wait time for the next loop
            
        except Exception as e:
            # Catch-all for other API errors (500s, authentication failures, etc.)
            logger.error("Gemini critical error", error=str(e))
            raise HTTPException(status_code=500, detail="Chatbot encountered an unexpected error.")
            
    # If the loop finishes without returning, we hit the limit 3 times
    logger.error("Max retries reached for Gemini API")
    raise HTTPException(status_code=429, detail="AI Service is currently overloaded. Please try again later.")

# 3. Simple health check endpoint for your monitoring
@router.get("/chat/health", summary="Health check for chatbot")
async def chatbot_health(request: Request) -> dict:
    return {
        "status": "healthy",
        "gemini_ready": hasattr(request.app.state, "gemini_model")
    }