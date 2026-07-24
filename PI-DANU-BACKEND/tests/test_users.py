import pytest
from unittest.mock import AsyncMock, patch

from tests.conftest import MOCK_SUNBIRD_TRANSLATE


@pytest.mark.asyncio
async def test_verify_nin_found(client):
    with patch(
        "app.services.nira_service.nira_service.verify_nin",
        new_callable=AsyncMock,
        return_value={
            "found": True,
            "nin": "CM850123456ABCD",
            "full_name": "NAMUKASA SARAH",
            "parish": "KISOWERA",
            "village": "KIBIRI",
            "district": "MUKONO",
            "phone": "+256781234567",
        },
    ):
        with patch(
            "app.services.sunbird_ai.sunbird_service.translate",
            new_callable=AsyncMock,
            return_value=MOCK_SUNBIRD_TRANSLATE,
        ):
            response = await client.post(
                "/api/users/verify-nin",
                json={"nin": "CM850123456ABCD", "language_preference": "lug"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["found"] is True
            assert data["full_name"] == "NAMUKASA SARAH"
            assert data["parish"] == "KISOWERA"
            assert "message_en" in data
            assert "message_local" in data


@pytest.mark.asyncio
async def test_verify_nin_not_found(client):
    with patch(
        "app.services.nira_service.nira_service.verify_nin",
        new_callable=AsyncMock,
        return_value={
            "found": False,
            "nin": "INVALID123",
            "full_name": None,
            "parish": None,
            "village": None,
            "district": None,
            "phone": None,
        },
    ):
        response = await client.post(
            "/api/users/verify-nin",
            json={"nin": "INVALID123", "language_preference": "eng"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is False
        assert data["full_name"] is None


@pytest.mark.asyncio
async def test_create_user(client):
    response = await client.post(
        "/api/users/",
        json={
            "nin": "CM999999999TEST",
            "full_name": "TEST USER",
            "phone_number": "+256700000000",
            "parish": "TEST_PARISH",
            "village": "TEST_VILLAGE",
            "district": "TEST_DISTRICT",
            "language_preference": "eng",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "TEST USER"
    assert data["nin"] == "CM999999999TEST"
    assert data["district"] == "TEST_DISTRICT"


@pytest.mark.asyncio
async def test_get_user(client, sample_user):
    response = await client.get(f"/api/users/{sample_user.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "NAMUKASA SARAH"
    assert data["nin"] == "CM850123456ABCD"


@pytest.mark.asyncio
async def test_get_user_not_found(client):
    from uuid import uuid4
    response = await client.get(f"/api/users/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_users(client, sample_user):
    response = await client.get("/api/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(u["nin"] == "CM850123456ABCD" for u in data)
