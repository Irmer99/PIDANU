import pytest
from uuid import uuid4


@pytest.mark.asyncio
async def test_create_application(client, sample_user):
    response = await client.post(
        "/api/applications/",
        json={
            "user_id": str(sample_user.id),
            "service_type": "pdm_registration",
            "notes": "Test application",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert data["service_type"] == "pdm_registration"
    assert data["document_count"] == 0


@pytest.mark.asyncio
async def test_get_application(client, sample_application):
    response = await client.get(f"/api/applications/{sample_application.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_application.id)
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_application_not_found(client):
    response = await client.get(f"/api/applications/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_applications(client, sample_application):
    response = await client.get("/api/applications/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["applications"]) >= 1


@pytest.mark.asyncio
async def test_list_applications_by_status(client, sample_application):
    response = await client.get("/api/applications/?status=pending")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_upload_document(client, sample_application):
    file_content = b"fake pdf content"
    response = await client.post(
        f"/api/applications/{sample_application.id}/documents",
        files={"file": ("test_id.pdf", file_content, "application/pdf")},
        params={"document_type": "id_card"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["document_type"] == "id_card"
    assert data["original_filename"] == "test_id.pdf"


@pytest.mark.asyncio
async def test_list_documents(client, sample_application):
    response = await client.get(
        f"/api/applications/{sample_application.id}/documents"
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_upload_document_to_nonexistent_app(client):
    file_content = b"fake content"
    response = await client.post(
        f"/api/applications/{uuid4()}/documents",
        files={"file": ("test.pdf", file_content, "application/pdf")},
    )
    assert response.status_code == 404
