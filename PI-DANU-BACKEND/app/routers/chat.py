from fastapi import APIRouter, HTTPException

from app.schemas.chat import (
    ConverseRequest,
    ConverseResponse,
    LanguageIDRequest,
    LanguageIDResponse,
    STTRequest,
    STTResponse,
    TranslateRequest,
    TranslateResponse,
    TTSRequest,
    TTSResponse,
)
from app.services.chat_service import chat_service
from app.services.sunbird_ai import sunbird_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest):
    try:
        result = await sunbird_service.translate(
            text=req.text,
            source_language=req.source_language,
            target_language=req.target_language,
        )
        return TranslateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/detect-language", response_model=LanguageIDResponse)
async def detect_language(req: LanguageIDRequest):
    try:
        result = await sunbird_service.detect_language(text=req.text)
        return LanguageIDResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Language detection failed: {str(e)}"
        )


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(req: STTRequest):
    raise HTTPException(
        status_code=400,
        detail="Use /api/chat/stt-upload with multipart file upload for STT",
    )


@router.post("/stt-upload")
async def speech_to_text_upload(
    audio: bytes,
    language: str = "lug",
):
    try:
        result = await sunbird_service.speech_to_text(
            audio_bytes=audio,
            filename="user_audio.wav",
            language=language,
        )
        return STTResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    try:
        result = await sunbird_service.text_to_speech(
            text=req.text, language=req.language
        )
        return TTSResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/converse", response_model=ConverseResponse)
async def converse(req: ConverseRequest):
    try:
        result = await chat_service.converse(
            message=req.message,
            user_id=req.user_id,
            language_preference=req.language_preference,
            audio_data=req.audio_data,
        )
        return ConverseResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
