from typing import Optional

from pydantic import BaseModel


class TranslateRequest(BaseModel):
    text: str
    source_language: str = "eng"
    target_language: str = "lug"


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str


class STTRequest(BaseModel):
    language: str = "lug"


class STTResponse(BaseModel):
    transcription: str
    language: str
    was_trimmed: bool = False


class TTSRequest(BaseModel):
    text: str
    language: str = "lug"


class TTSResponse(BaseModel):
    audio_url: str
    duration_seconds: Optional[float] = None


class LanguageIDRequest(BaseModel):
    text: str


class LanguageIDResponse(BaseModel):
    language_code: str
    language_name: str
    confidence: float


class ChatMessage(BaseModel):
    role: str
    content: str


class ConverseRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    language_preference: Optional[str] = None
    audio_data: Optional[str] = None
    phone_number: Optional[str] = None


class ConverseResponse(BaseModel):
    reply_text: str
    reply_local: str
    detected_language: str
    intent: str
    audio_url: Optional[str] = None
    user_id: Optional[str] = None
