import asyncio
import uuid
import random
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base
from app.models import (
    AgentDispatch,
    Application,
    AuditLog,
    Document,
    MonthlySnapshot,
    PDROffice,
    ResourceAllocation,
    User,
)
from app.utils.auth import hash_password

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

PDR_OFFICES = [
    {"name": "Kampala Central PDR Office", "parish": "Kawempe", "sub_county": "Kawempe", "district": "Kampala", "region": "Central", "latitude": 0.3476, "longitude": 32.5825, "contact_phone": "+256781000001"},
    {"name": "Mukono PDR Office", "parish": "Kisowera", "sub_county": "Ntenjeru", "district": "Mukono", "region": "Central", "latitude": 0.3531, "longitude": 32.7558, "contact_phone": "+256781000002"},
    {"name": "Mbarara PDR Office", "parish": "Kakyeka", "sub_county": "Mbarara", "district": "Mbarara", "region": "Western", "latitude": -0.6072, "longitude": 30.6547, "contact_phone": "+256781000003"},
    {"name": "Lira PDR Office", "parish": "Ojwina", "sub_county": "Lira", "district": "Lira", "region": "Northern", "latitude": 2.2499, "longitude": 32.8999, "contact_phone": "+256781000004"},
    {"name": "Gulu PDR Office", "parish": "Layibi", "sub_county": "Gulu", "district": "Gulu", "region": "Northern", "latitude": 2.7747, "longitude": 32.2990, "contact_phone": "+256781000005"},
    {"name": "Jinja PDR Office", "parish": "Njinikubi", "sub_county": "Jinja", "district": "Jinja", "region": "Eastern", "latitude": 0.4244, "longitude": 33.2041, "contact_phone": "+256781000006"},
    {"name": "Mbale PDR Office", "parish": "Nasenyi", "sub_county": "Mbale", "district": "Mbale", "region": "Eastern", "latitude": 1.0841, "longitude": 34.1754, "contact_phone": "+256781000007"},
    {"name": "Soroti PDR Office", "parish": "Ogooma", "sub_county": "Soroti", "district": "Soroti", "region": "Eastern", "latitude": 1.7283, "longitude": 33.6101, "contact_phone": "+256781000008"},
    {"name": "Masaka PDR Office", "parish": "Kimaanya", "sub_county": "Kimaanya-Kyabakuza", "district": "Masaka", "region": "Central", "latitude": -0.3378, "longitude": 31.7350, "contact_phone": "+256781000009"},
    {"name": "Fort Portal PDR Office", "parish": "Kisenyi", "sub_county": "Fort Portal", "district": "Kabarole", "region": "Western", "latitude": 0.6711, "longitude": 30.2747, "contact_phone": "+256781000010"},
]

SAMPLE_USERS = [
    {"nin": "CM850123456ABCD", "full_name": "NAMUKASA SARAH", "phone_number": "+256781234567", "parish": "KISOWERA", "village": "KIBIRI", "district": "MUKONO", "language_preference": "lug"},
    {"nin": "CM900234567EFGH", "full_name": "OKELLO JAMES", "phone_number": "+256702345678", "parish": "KAWEMPE", "village": "KASUUBO", "district": "KAMPALA", "language_preference": "eng"},
    {"nin": "CF880345678IJKL", "full_name": "AUMA GRACE", "phone_number": "+256773456789", "parish": "OJWINA", "village": "ADEK", "district": "LIRA", "language_preference": "ach"},
    {"nin": "CM950456789MNOP", "full_name": "TUMUSIIME DAVID", "phone_number": "+256784567890", "parish": "KAKYEKA", "village": "NYAKYERA", "district": "MBARARA", "language_preference": "nyn"},
    {"nin": "CM920567890QRST", "full_name": "NAMBOOZE FAITH", "phone_number": "+256705678901", "parish": "LAYIBI", "village": "LABUR", "district": "GULU", "language_preference": "ach"},
    {"nin": "CM870678901UVWX", "full_name": "OCHIENG PETER", "phone_number": "+256716789012", "parish": "NJINIKUBI", "village": "BUDI", "district": "JINJA", "language_preference": "eng"},
    {"nin": "CM930789012YZAB", "full_name": "NANSUBUGA ESTHER", "phone_number": "+256727890123", "parish": "NASENYI", "village": "NASIRI", "district": "MBALE", "language_preference": "teo"},
    {"nin": "CM910890123CDEF", "full_name": "KATENDE SAMUEL", "phone_number": "+256738901234", "parish": "OGOOMA", "village": "OGOL", "district": "SOROTI", "language_preference": "eng"},
    {"nin": "CM890901234GHIJ", "full_name": "NAMUTEBI CATHERINE", "phone_number": "+256749012345", "parish": "KIMAANYA", "village": "KIMA", "district": "MASAKA", "language_preference": "lug"},
    {"nin": "CM860012345KLMN", "full_name": "BYARUHANGA JOSEPH", "phone_number": "+256750123456", "parish": "KISENYI", "village": "KIS", "district": "KABAROLE", "language_preference": "nyn"},
]

SAMPLE_APPLICATIONS = [
    {"service_type": "pdm_registration", "status": "approved", "notes": "Initial PDM registration"},
    {"service_type": "pdm_registration", "status": "pending", "notes": "New registration application"},
    {"service_type": "agri_inputs", "status": "under_review", "notes": "Need maize seeds for this season"},
    {"service_type": "birth_cert", "status": "approved", "notes": "Birth certificate for child"},
    {"service_type": "land_permit", "status": "rejected", "notes": "Incomplete documentation"},
    {"service_type": "infra_report", "status": "pending", "notes": "Road damaged near trading center"},
    {"service_type": "agri_inputs", "status": "approved", "notes": "Fertilizer application"},
    {"service_type": "pdm_registration", "status": "completed", "notes": "Registration complete"},
    {"service_type": "infra_report", "status": "under_review", "notes": "Water point broken"},
    {"service_type": "birth_cert", "status": "pending", "notes": "Late registration of birth"},
]

RESOURCE_ALLOCATIONS = [
    {"resource_type": "Maize Seeds (kg)", "quantity": 500, "parish": "KISOWERA", "distribution_status": "partially_distributed", "distributed_count": 320, "beneficiaries": [1, 2, 3]},
    {"resource_type": "Fertilizer (bags)", "quantity": 200, "parish": "KAWEMPE", "distribution_status": "allocated", "distributed_count": 0, "beneficiaries": []},
    {"resource_type": "Hoes", "quantity": 150, "parish": "OJWINA", "distribution_status": "fully_distributed", "distributed_count": 150, "beneficiaries": [3, 4, 5]},
    {"resource_type": "Bean Seeds (kg)", "quantity": 300, "parish": "KAKYEKA", "distribution_status": "partially_distributed", "distributed_count": 120, "beneficiaries": [4, 5]},
    {"resource_type": "Spray Pumps", "quantity": 50, "parish": "LAYIBI", "distribution_status": "partially_distributed", "distributed_count": 30, "beneficiaries": [5, 6]},
    {"resource_type": "Rice Seeds (kg)", "quantity": 400, "parish": "NJINIKUBI", "distribution_status": "allocated", "distributed_count": 0, "beneficiaries": []},
    {"resource_type": "Drip Irrigation Kits", "quantity": 25, "parish": "NASENYI", "distribution_status": "partially_distributed", "distributed_count": 18, "beneficiaries": [7, 8]},
    {"resource_type": "Hand Trowels", "quantity": 200, "parish": "OGOOMA", "distribution_status": "allocated", "distributed_count": 0, "beneficiaries": []},
    {"resource_type": "NPK Fertilizer (kg)", "quantity": 350, "parish": "KIMAANYA", "distribution_status": "partially_distributed", "distributed_count": 210, "beneficiaries": [8, 9, 10]},
    {"resource_type": "Cassava Cuttings", "quantity": 600, "parish": "KISENYI", "distribution_status": "allocated", "distributed_count": 0, "beneficiaries": []},
]

AUDIT_ACTIONS = [
    ("request_submitted", "service_request"),
    ("request_approved", "service_request"),
    ("request_rejected", "service_request"),
    ("request_completed", "service_request"),
    ("resource_distributed", "resource_allocation"),
    ("citizen_verified", "citizen"),
    ("status_check", "citizen"),
    ("ussd_session", "system"),
    ("sms_received", "system"),
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for office_data in PDR_OFFICES:
            office = PDROffice(**office_data)
            session.add(office)

        created_users = []
        for user_data in SAMPLE_USERS:
            user = User(**user_data)
            session.add(user)
            created_users.append(user)

        await session.flush()

        for i, app_data in enumerate(SAMPLE_APPLICATIONS):
            user = created_users[i % len(created_users)]
            application = Application(
                user_id=user.id,
                **app_data,
            )
            session.add(application)

        for res_data in RESOURCE_ALLOCATIONS:
            allocation = ResourceAllocation(
                allocation_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                **res_data,
            )
            session.add(allocation)

        for i in range(30):
            action, entity_type = random.choice(AUDIT_ACTIONS)
            actor_roles = ["citizen", "parish_chief", "system"]
            log = AuditLog(
                action=action,
                entity_type=entity_type,
                entity_id=str(random.randint(1, 20)),
                actor_phone=f"+2567{random.randint(0, 9)}{random.randint(1000000, 9999999)}",
                actor_role=random.choice(actor_roles),
                details={"notes": random.choice(["Auto-generated", "Verified by local council", "Urgent priority", ""])},
                timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23)),
            )
            session.add(log)

        await session.commit()

        print("Database seeded successfully!")
        print(f"  - {len(PDR_OFFICES)} PDR offices created")
        print(f"  - {len(SAMPLE_USERS)} citizens created")
        print(f"  - {len(SAMPLE_APPLICATIONS)} service requests created")
        print(f"  - {len(RESOURCE_ALLOCATIONS)} resource allocations created")
        print(f"  - 30 audit log entries created")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
