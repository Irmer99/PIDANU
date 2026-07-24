import pytest


@pytest.mark.asyncio
async def test_find_nearest_office(client, sample_pdr_offices):
    response = await client.post(
        "/api/pdr-offices/nearest",
        json={"latitude": 0.3400, "longitude": 32.5800},
    )
    assert response.status_code == 200
    data = response.json()
    assert "office" in data
    assert "distance_km" in data
    assert "directions_hint" in data
    assert data["distance_km"] >= 0


@pytest.mark.asyncio
async def test_list_offices(client, sample_pdr_offices):
    response = await client.get("/api/pdr-offices/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_office(client, sample_pdr_offices):
    office = sample_pdr_offices[0]
    response = await client.get(f"/api/pdr-offices/{office.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Kampala Central PDR"
    assert data["district"] == "Kampala"


@pytest.mark.asyncio
async def test_get_office_not_found(client):
    from uuid import uuid4
    response = await client.get(f"/api/pdr-offices/{uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nearest_office_finds_closest(client, sample_pdr_offices):
    response = await client.post(
        "/api/pdr-offices/nearest",
        json={"latitude": -0.6100, "longitude": 30.6500},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["office"]["district"] == "Mbarara"
