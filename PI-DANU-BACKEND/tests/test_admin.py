import pytest
from unittest.mock import AsyncMock, patch

from tests.conftest import MOCK_SUNBIRD_TRANSLATE


@pytest.mark.asyncio
async def test_list_all_applications(client, sample_application):
    response = await client.get("/api/admin/applications")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_application_detail(client, sample_application):
    response = await client.get(
        f"/api/admin/applications/{sample_application.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert "application" in data
    assert "documents" in data
    assert "dispatches" in data


@pytest.mark.asyncio
async def test_approve_application(client, sample_application):
    response = await client.put(
        f"/api/admin/applications/{sample_application.id}/approve",
        json={"reviewed_by": "Admin Test", "notes": "Approved for testing"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "approved" in data["message"].lower()


@pytest.mark.asyncio
async def test_reject_application(client, sample_application):
    response = await client.put(
        f"/api/admin/applications/{sample_application.id}/reject",
        json={"reviewed_by": "Admin Test", "notes": "Incomplete documents"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "rejected" in data["message"].lower()


@pytest.mark.asyncio
async def test_update_status(client, sample_application):
    response = await client.put(
        f"/api/admin/applications/{sample_application.id}/status",
        json={"status": "evaluating", "notes": "Under review"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "evaluating" in data["message"]


@pytest.mark.asyncio
async def test_dispatch_agent(client, sample_application):
    with patch(
        "app.services.sunbird_ai.sunbird_service.translate",
        new_callable=AsyncMock,
        return_value=MOCK_SUNBIRD_TRANSLATE,
    ):
        response = await client.post(
            f"/api/admin/applications/{sample_application.id}/dispatch",
            json={
                "application_id": str(sample_application.id),
                "agent_name": "OKello James",
                "agent_phone": "+256700111222",
                "scheduled_date": "2025-03-15T10:00:00",
                "evaluation_notes": "Initial evaluation",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["agent_name"] == "OKello James"
        assert data["status"] == "scheduled"


@pytest.mark.asyncio
async def test_approve_nonexistent_application(client):
    from uuid import uuid4
    response = await client.put(
        f"/api/admin/applications/{uuid4()}/approve",
        json={"reviewed_by": "Admin"},
    )
    assert response.status_code == 404
