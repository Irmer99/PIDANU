import pytest
from unittest.mock import AsyncMock, patch

from tests.conftest import (
    MOCK_SUNBIRD_DETECT_LANG,
    MOCK_SUNBIRD_STT,
    MOCK_SUNBIRD_TTS,
    MOCK_SUNBIRD_TRANSLATE,
)


@pytest.mark.asyncio
async def test_translate(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.translate",
        new_callable=AsyncMock,
        return_value=MOCK_SUNBIRD_TRANSLATE,
    ):
        response = await client.post(
            "/api/chat/translate",
            json={
                "text": "PDM registration is free",
                "source_language": "eng",
                "target_language": "lug",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "translated_text" in data
        assert data["source_language"] == "eng"
        assert data["target_language"] == "lug"


@pytest.mark.asyncio
async def test_detect_language(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.detect_language",
        new_callable=AsyncMock,
        return_value=MOCK_SUNBIRD_DETECT_LANG,
    ):
        response = await client.post(
            "/api/chat/detect-language",
            json={"text": "Njagala okuyingira mu PDM"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["language_code"] == "lug"
        assert data["language_name"] == "Luganda"


@pytest.mark.asyncio
async def test_tts(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.text_to_speech",
        new_callable=AsyncMock,
        return_value=MOCK_SUNBIRD_TTS,
    ):
        response = await client.post(
            "/api/chat/tts",
            json={"text": "Webale nyo", "language": "lug"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "audio_url" in data
        assert data["duration_seconds"] == 3.5


@pytest.mark.asyncio
async def test_converse_greeting(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.detect_language",
        new_callable=AsyncMock,
        return_value={"language_code": "eng", "language_name": "English", "confidence": 0.99},
    ):
        with patch(
            "app.services.sunbird_ai.sunbird_service.translate",
            new_callable=AsyncMock,
            return_value=MOCK_SUNBIRD_TRANSLATE,
        ):
            with patch(
                "app.services.sunbird_ai.sunbird_service.text_to_speech",
                new_callable=AsyncMock,
                return_value=MOCK_SUNBIRD_TTS,
            ):
                response = await client.post(
                    "/api/chat/converse",
                    json={"message": "Hello, how do I join PDM?"},
                )
                assert response.status_code == 200
                data = response.json()
                assert "reply_text" in data
                assert "intent" in data
                assert data["intent"] == "join_pdm"


@pytest.mark.asyncio
async def test_converse_scam_warning(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.detect_language",
        new_callable=AsyncMock,
        return_value={"language_code": "eng", "language_name": "English", "confidence": 0.99},
    ):
        with patch(
            "app.services.sunbird_ai.sunbird_service.translate",
            new_callable=AsyncMock,
            return_value=MOCK_SUNBIRD_TRANSLATE,
        ):
            with patch(
                "app.services.sunbird_ai.sunbird_service.text_to_speech",
                new_callable=AsyncMock,
                return_value=MOCK_SUNBIRD_TTS,
            ):
                response = await client.post(
                    "/api/chat/converse",
                    json={"message": "Someone is asking me to pay a fee for PDM"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["intent"] == "scam_warning"
                assert "FREE" in data["reply_text"]


@pytest.mark.asyncio
async def test_converse_status_check(client):
    with patch(
        "app.services.sunbird_ai.sunbird_service.detect_language",
        new_callable=AsyncMock,
        return_value={"language_code": "eng", "language_name": "English", "confidence": 0.99},
    ):
        response = await client.post(
            "/api/chat/converse",
            json={"message": "How do I check my application status?"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] == "check_status"
