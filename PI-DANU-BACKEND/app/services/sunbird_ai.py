import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SUNBIRD_HEADERS = {
    "Authorization": f"Bearer {settings.SUNBIRD_API_KEY}",
    "Content-Type": "application/json",
}

LANGUAGE_NAMES = {
    "ach": "Acholi",
    "teo": "Ateso",
    "eng": "English",
    "lug": "Luganda",
    "lgg": "Lugbara",
    "nyn": "Runyankole",
    "luo": "Luo",
    "swa": "Swahili",
    "kin": "Kinyarwanda",
    "xog": "Lusoga",
    "myx": "Lumasaba",
}

TTS_SPEAKER_IDS = {
    "ach": 241,
    "teo": 242,
    "nyn": 243,
    "lgg": 245,
    "swa": 246,
    "lug": 248,
}

LEGACY_TTS_SPEAKER_IDS = {
    "ach": 241,
    "teo": 242,
    "nyn": 243,
    "lgg": 245,
    "swa": 246,
    "lug": 248,
}


class SunbirdAIService:
    def __init__(self):
        self.base_url = settings.SUNBIRD_BASE_URL
        self.api_key = settings.SUNBIRD_API_KEY

    def _get_headers(self, content_type: str = "application/json") -> dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    async def translate(
        self,
        text: str,
        source_language: str = "eng",
        target_language: str = "lug",
    ) -> dict:
        url = f"{self.base_url}/tasks/translate"
        payload = {
            "text": text,
            "source_language": source_language,
            "target_language": target_language,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url, json=payload, headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            output = data.get("output") or {}
            return {
                "translated_text": output.get("translated_text") or data.get("translation", ""),
                "source_language": source_language,
                "target_language": target_language,
            }

    async def detect_language(self, text: str) -> dict:
        url = f"{self.base_url}/tasks/language_id"
        payload = {"text": text}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url, json=payload, headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            lang_code = data.get("language", "eng")
            return {
                "language_code": lang_code,
                "language_name": LANGUAGE_NAMES.get(lang_code, lang_code),
                "confidence": data.get("confidence", 0.0),
            }

    async def speech_to_text(
        self, audio_bytes: bytes, filename: str, language: str = "lug"
    ) -> dict:
        url = f"{self.base_url}/tasks/stt"
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                files={"audio": (filename, audio_bytes, "audio/wav")},
                data={"language": language, "adapter": language},
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            data = response.json()
            return {
                "transcription": data.get("audio_transcription", ""),
                "language": language,
                "was_trimmed": data.get("was_audio_trimmed", False),
            }

    async def text_to_speech(
        self, text: str, language: str = "lug"
    ) -> dict:
        url = f"{self.base_url}/tasks/tts"
        speaker_id = LEGACY_TTS_SPEAKER_IDS.get(language, 248)
        payload = {
            "text": text,
            "speaker_id": speaker_id,
            "temperature": 0.7,
            "max_new_audio_tokens": 2000,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url, json=payload, headers=self._get_headers()
            )
            data = response.json()
            output = data.get("output", {})
            if output.get("Error") or response.status_code != 200:
                logger.warning(f"TTS /tasks/tts failed: {output.get('Error', 'unknown')}, trying /tasks/modal/tts")
                modal_url = f"{self.base_url}/tasks/modal/tts"
                modal_payload = {"text": text, "language": language}
                resp2 = await client.post(
                    modal_url, json=modal_payload, headers=self._get_headers()
                )
                data = resp2.json()
                if resp2.status_code != 200 or data.get("error"):
                    logger.error(f"TTS modal also failed: {data}")
                    return {"audio_url": "", "duration_seconds": None}
                audio_url = data.get("audio_url") or data.get("output", {}).get("audio_url", "")
                return {"audio_url": audio_url, "duration_seconds": data.get("duration_seconds")}
            return {
                "audio_url": output.get("audio_url", ""),
                "duration_seconds": output.get("duration_seconds", None),
            }


sunbird_service = SunbirdAIService()
