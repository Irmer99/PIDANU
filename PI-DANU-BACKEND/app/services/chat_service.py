import logging
import re
from typing import Optional

from app.services.sunbird_ai import sunbird_service

logger = logging.getLogger(__name__)

SCAM_WARNING_EN = (
    "WARNING: PDM registration is COMPLETELY FREE. "
    "Do NOT pay anyone for forms or registration. "
    "If anyone asks for money, they are a scammer. "
    "Report them to your Local Council or call 0800-XXX-XXX."
)

DOCUMENT_CHECKLIST_EN = (
    "To join PDM, you will need the following documents:\n"
    "1. National Identity Card (NIN)\n"
    "2. Passport-size photograph\n"
    "3. Land title or proof of land ownership (if applicable)\n"
    "4. Group registration certificate (if applying as a group)\n"
    "5. Bank account details (savings group account is fine)\n\n"
    "Please visit your nearest PDR office with these documents."
)

GREETING_EN = (
    "Welcome to PDM AI Bridge! I am here to help you access the Parish "
    "Development Model services in your own language. "
    "You can ask me about PDM registration, required documents, "
    "check your application status, or report a problem."
)

INTENT_RESPONSES = {
    "join_pdm": DOCUMENT_CHECKLIST_EN,
    "scam_warning": SCAM_WARNING_EN,
    "greeting": GREETING_EN,
    "check_status": "Please provide your NIN or Application ID so I can check your status.",
    "upload_docs": "I will help you upload your documents. Please tell me which document you want to upload.",
    "nearest_office": "Please share your location or tell me your parish so I can find the nearest PDR office.",
}


class ChatService:
    def __init__(self):
        self.sunbird = sunbird_service

    def detect_intent(self, message: str) -> str:
        lower = message.lower().strip()

        scam_keywords = [
            "scam", "fraud", "bribe", "money", "pay", "fee",
            "fake", "cheat", "middleman", "broker", "swindle",
        ]
        if any(kw in lower for kw in scam_keywords):
            return "scam_warning"

        join_keywords = [
            "register", "join", "pdm", "sign up", "enroll",
            "how to", "what do i need", "requirements", "documents needed",
            "get started", "begin", "apply",
        ]
        if any(kw in lower for kw in join_keywords):
            return "join_pdm"

        status_keywords = [
            "status", "track", "check", "application", "progress",
            "where is", "what happened", "approved", "rejected",
        ]
        if any(kw in lower for kw in status_keywords):
            return "check_status"

        upload_keywords = [
            "upload", "photo", "picture", "document", "scan",
            "submit", "send file",
        ]
        if any(kw in lower for kw in upload_keywords):
            return "upload_docs"

        office_keywords = [
            "office", "where", "nearest", "location", "direction",
            "pdr", "town", "travel",
        ]
        if any(kw in lower for kw in office_keywords):
            return "nearest_office"

        greet_keywords = [
            "hello", "hi", "hey", "good morning", "good afternoon",
            "ola", "mba", "oyagala", "webale",
        ]
        if any(kw in lower for kw in greet_keywords):
            return "greeting"

        return "general"

    async def converse(
        self,
        message: str,
        user_id: Optional[str] = None,
        language_preference: Optional[str] = None,
        audio_data: Optional[str] = None,
    ) -> dict:
        transcription = message
        detected_lang = language_preference or "eng"

        if audio_data:
            import base64

            audio_bytes = base64.b64decode(audio_data)
            stt_result = await self.sunbird.speech_to_text(
                audio_bytes, "user_audio.wav", language=detected_lang
            )
            transcription = stt_result["transcription"]
            detected_lang = stt_result["language"]

        if detected_lang == "eng":
            lang_result = await self.sunbird.detect_language(transcription)
            detected_lang = lang_result["language_code"]

        english_text = transcription
        if detected_lang != "eng":
            try:
                translation = await self.sunbird.translate(
                    transcription,
                    source_language=detected_lang,
                    target_language="eng",
                )
                english_text = translation["translated_text"]
            except Exception as e:
                logger.warning(f"Translation to English failed: {e}")

        intent = self.detect_intent(english_text)
        response_en = INTENT_RESPONSES.get(intent, INTENT_RESPONSES["greeting"])

        if user_id:
            response_en = f"Thank you for your message. {response_en}"

        response_local = response_en
        if detected_lang != "eng":
            try:
                back_translation = await self.sunbird.translate(
                    response_en,
                    source_language="eng",
                    target_language=detected_lang,
                )
                response_local = back_translation["translated_text"]
            except Exception as e:
                logger.warning(f"Back-translation failed: {e}")
                response_local = response_en

        audio_url = None
        try:
            tts_result = await self.sunbird.text_to_speech(
                response_local, language=detected_lang
            )
            audio_url = tts_result.get("audio_url")
        except Exception as e:
            logger.warning(f"TTS failed: {e}")

        return {
            "reply_text": response_en,
            "reply_local": response_local,
            "detected_language": detected_lang,
            "intent": intent,
            "audio_url": audio_url,
            "user_id": user_id,
        }


chat_service = ChatService()
