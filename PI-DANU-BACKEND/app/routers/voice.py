from fastapi import APIRouter, HTTPException

from app.schemas.chat import ConverseRequest, ConverseResponse
from app.services.chat_service import chat_service
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/advice", response_model=ConverseResponse)
async def voice_advice(req: ConverseRequest):
    if req.phone_number and rate_limiter.check_voice(req.phone_number):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    try:
        result = await chat_service.converse(
            message=req.message,
            user_id=req.user_id,
            language_preference=req.language_preference,
            audio_data=req.audio_data,
        )
        return ConverseResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice advice failed: {str(e)}")
