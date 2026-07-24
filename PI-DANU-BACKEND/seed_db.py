import asyncio
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base
from app.models import AgentDispatch, Application, Document, PDROffice, User

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

PDR_OFFICES = [
    {
        "name": "Kampala Central PDR Office",
        "parish": "Kawempe",
        "sub_county": "Kawempe",
        "district": "Kampala",
        "region": "Central",
        "latitude": 0.3476,
        "longitude": 32.5825,
        "contact_phone": "+256781000001",
    },
    {
        "name": "Mukono PDR Office",
        "parish": "Kisowera",
        "sub_county": "Ntenjeru",
        "district": "Mukono",
        "region": "Central",
        "latitude": 0.3531,
        "longitude": 32.7558,
        "contact_phone": "+256781000002",
    },
    {
        "name": "Mbarara PDR Office",
        "parish": "Kakyeka",
        "sub_county": "Mbarara",
        "district": "Mbarara",
        "region": "Western",
        "latitude": -0.6072,
        "longitude": 30.6547,
        "contact_phone": "+256781000003",
    },
    {
        "name": "Lira PDR Office",
        "parish": "Ojwina",
        "sub_county": "Lira",
        "district": "Lira",
        "region": "Northern",
        "latitude": 2.2499,
        "longitude": 32.8999,
        "contact_phone": "+256781000004",
    },
    {
        "name": "Gulu PDR Office",
        "parish": "Layibi",
        "sub_county": "Gulu",
        "district": "Gulu",
        "region": "Northern",
        "latitude": 2.7747,
        "longitude": 32.2990,
        "contact_phone": "+256781000005",
    },
    {
        "name": "Jinja PDR Office",
        "parish": "Njinikubi",
        "sub_county": "Jinja",
        "district": "Jinja",
        "region": "Eastern",
        "latitude": 0.4244,
        "longitude": 33.2041,
        "contact_phone": "+256781000006",
    },
    {
        "name": "Mbale PDR Office",
        "parish": "Nasenyi",
        "sub_county": "Mbale",
        "district": "Mbale",
        "region": "Eastern",
        "latitude": 1.0841,
        "longitude": 34.1754,
        "contact_phone": "+256781000007",
    },
    {
        "name": "Soroti PDR Office",
        "parish": "Ogooma",
        "sub_county": "Soroti",
        "district": "Soroti",
        "region": "Eastern",
        "latitude": 1.7283,
        "longitude": 33.6101,
        "contact_phone": "+256781000008",
    },
    {
        "name": "Masaka PDR Office",
        "parish": "Kimaanya",
        "sub_county": "Kimaanya-Kyabakuza",
        "district": "Masaka",
        "region": "Central",
        "latitude": -0.3378,
        "longitude": 31.7350,
        "contact_phone": "+256781000009",
    },
    {
        "name": "Fort Portal PDR Office",
        "parish": "Kisenyi",
        "sub_county": "Fort Portal",
        "district": "Kabarole",
        "region": "Western",
        "latitude": 0.6711,
        "longitude": 30.2747,
        "contact_phone": "+256781000010",
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for office_data in PDR_OFFICES:
            office = PDROffice(**office_data)
            session.add(office)

        sample_user = User(
            nin="CM850123456ABCD",
            full_name="NAMUKASA SARAH",
            phone_number="+256781234567",
            parish="KISOWERA",
            village="KIBIRI",
            district="MUKONO",
            language_preference="lug",
        )
        session.add(sample_user)

        await session.commit()

        print("Database seeded successfully!")
        print(f"  - {len(PDR_OFFICES)} PDR offices created")
        print(f"  - 1 sample user created (NIN: CM850123456ABCD)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
