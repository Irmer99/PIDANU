import pytest
from unittest.mock import AsyncMock, patch

from app.services.routing_service import haversine_distance


def test_haversine_distance_same_point():
    distance = haversine_distance(0.0, 0.0, 0.0, 0.0)
    assert distance == 0.0


def test_haversine_distance_known_points():
    Kampala = (0.3476, 32.5825)
    Mbarara = (-0.6072, 30.6547)
    distance = haversine_distance(Kampala[0], Kampala[1], Mbarara[0], Mbarara[1])
    assert 200 < distance < 300


def test_haversine_distance_symmetric():
    d1 = haversine_distance(0.3476, 32.5825, -0.6072, 30.6547)
    d2 = haversine_distance(-0.6072, 30.6547, 0.3476, 32.5825)
    assert abs(d1 - d2) < 0.001


@pytest.mark.asyncio
async def test_routing_service_find_nearest(db_session, sample_pdr_offices):
    from app.services.routing_service import routing_service

    results = await routing_service.find_nearest_office(
        db=db_session, latitude=0.3400, longitude=32.5800, limit=1
    )
    assert len(results) == 1
    assert results[0]["office"].name == "Kampala Central PDR"
    assert results[0]["distance_km"] < 20


@pytest.mark.asyncio
async def test_routing_service_find_nearest_limit(db_session, sample_pdr_offices):
    from app.services.routing_service import routing_service

    results = await routing_service.find_nearest_office(
        db=db_session, latitude=0.3400, longitude=32.5800, limit=3
    )
    assert len(results) == 3
    assert results[0]["distance_km"] <= results[1]["distance_km"]


@pytest.mark.asyncio
async def test_nira_verify_found():
    from app.services.nira_service import nira_service

    result = await nira_service.verify_nin("CM850123456ABCD")
    assert result["found"] is True
    assert result["full_name"] == "NAMUKASA SARAH"
    assert result["parish"] == "KISOWERA"


@pytest.mark.asyncio
async def test_nira_verify_not_found():
    from app.services.nira_service import nira_service

    result = await nira_service.verify_nin("INVALID_NIN")
    assert result["found"] is False
    assert result["full_name"] is None


@pytest.mark.asyncio
async def test_chat_service_intent_detection():
    from app.services.chat_service import chat_service

    assert chat_service.detect_intent("How do I register for PDM?") == "join_pdm"
    assert chat_service.detect_intent("Someone asked me to pay money") == "scam_warning"
    assert chat_service.detect_intent("Check my application status") == "check_status"
    assert chat_service.detect_intent("Upload my documents") == "upload_docs"
    assert chat_service.detect_intent("Where is the nearest office?") == "nearest_office"
    assert chat_service.detect_intent("Hello there") == "greeting"
    assert chat_service.detect_intent("What is the weather?") == "general"
