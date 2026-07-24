import asyncio
import uuid as _uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import String, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.database import Base, get_db
from app.models import AgentDispatch, Application, Document, PDROffice, User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

for table in Base.metadata.sorted_tables:
    for col in table.columns:
        if isinstance(col.type, PG_UUID):
            col.type = String(36)

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    from app.main import app as fastapi_app
    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def sample_user(db_session):
    user = User(
        nin="CM850123456ABCD",
        full_name="NAMUKASA SARAH",
        phone_number="+256781234567",
        parish="KISOWERA",
        village="KIBIRI",
        district="MUKONO",
        language_preference="lug",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def sample_pdr_offices(db_session):
    offices = [
        PDROffice(
            name="Kampala Central PDR",
            parish="Kawempe",
            district="Kampala",
            region="Central",
            latitude=0.3476,
            longitude=32.5825,
            contact_phone="+256781000001",
        ),
        PDROffice(
            name="Mukono PDR",
            parish="Kisowera",
            district="Mukono",
            region="Central",
            latitude=0.3531,
            longitude=32.7558,
            contact_phone="+256781000002",
        ),
        PDROffice(
            name="Mbarara PDR",
            parish="Kakyeka",
            district="Mbarara",
            region="Western",
            latitude=-0.6072,
            longitude=30.6547,
            contact_phone="+256781000003",
        ),
    ]
    for office in offices:
        db_session.add(office)
    await db_session.commit()
    for office in offices:
        await db_session.refresh(office)
    return offices


@pytest_asyncio.fixture
async def sample_application(db_session, sample_user):
    app_obj = Application(
        user_id=sample_user.id,
        service_type="pdm_registration",
        status="pending",
    )
    db_session.add(app_obj)
    await db_session.commit()
    await db_session.refresh(app_obj)
    return app_obj


MOCK_SUNBIRD_TRANSLATE = {
    "translated_text": "Nkyagadde obubaka bwo.",
    "source_language": "eng",
    "target_language": "lug",
}

MOCK_SUNBIRD_DETECT_LANG = {
    "language_code": "lug",
    "language_name": "Luganda",
    "confidence": 0.95,
}

MOCK_SUNBIRD_TTS = {
    "audio_url": "https://storage.sunbird.ai/test_audio.mp3",
    "duration_seconds": 3.5,
}

MOCK_SUNBIRD_STT = {
    "transcription": "Njagala okuyingira mu PDM",
    "language": "lug",
    "was_trimmed": False,
}
