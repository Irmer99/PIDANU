import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_login_success(client):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@pdm.go.ug", "password": "change-this-password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_email(client):
    response = await client.post(
        "/api/auth/login",
        json={"email": "wrong@email.com", "password": "change-this-password"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@pdm.go.ug", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_returns_token_format(client):
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@pdm.go.ug", "password": "change-this-password"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["access_token"]) > 20
    assert "." in data["access_token"]
