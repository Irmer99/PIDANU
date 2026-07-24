"""seed_pdr_offices

Revision ID: 001_seed_pdr
Revises: None
Create Date: 2025-01-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_seed_pdr"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

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
        "contact_email": "kampala.central@pdm.go.ug",
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
        "contact_email": "mukono@pdm.go.ug",
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
        "contact_email": "mbarara@pdm.go.ug",
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
        "contact_email": "lira@pdm.go.ug",
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
        "contact_email": "gulu@pdm.go.ug",
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
        "contact_email": "jinja@pdm.go.ug",
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
        "contact_email": "mbale@pdm.go.ug",
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
        "contact_email": "soroti@pdm.go.ug",
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
        "contact_email": "masaka@pdm.go.ug",
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
        "contact_email": "fortportal@pdm.go.ug",
    },
]


def upgrade() -> None:
    pdr_table = sa.table(
        "pdr_offices",
        sa.column("id", sa.dialects.postgresql.UUID),
        sa.column("name", sa.String),
        sa.column("parish", sa.String),
        sa.column("sub_county", sa.String),
        sa.column("district", sa.String),
        sa.column("region", sa.String),
        sa.column("latitude", sa.Float),
        sa.column("longitude", sa.Float),
        sa.column("contact_phone", sa.String),
        sa.column("contact_email", sa.String),
        sa.column("operating_hours", sa.String),
    )

    import uuid
    for office in PDR_OFFICES:
        op.execute(
            pdr_table.insert().values(
                id=str(uuid.uuid4()),
                operating_hours="Mon-Fri 8:00AM - 5:00PM",
                **office,
            )
        )


def downgrade() -> None:
    op.execute("DELETE FROM pdr_offices")
