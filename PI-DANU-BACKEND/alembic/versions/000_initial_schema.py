"""initial schema

Revision ID: 000_initial
Revises: None
Create Date: 2025-01-01
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "000_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nin", sa.String(20), unique=True, index=True, nullable=True),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("phone_number", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("parish", sa.String(255), nullable=True),
        sa.Column("village", sa.String(255), nullable=True),
        sa.Column("district", sa.String(255), nullable=True),
        sa.Column("language_preference", sa.String(10), server_default="eng"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("service_type", sa.String(100), server_default="pdm_registration"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("reviewed_by", sa.String(255), nullable=True),
        sa.Column("reviewed_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id"),
            nullable=False,
        ),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("file_key", sa.String(500), nullable=True),
        sa.Column("document_type", sa.String(50), server_default="other"),
        sa.Column("original_filename", sa.String(255), nullable=True),
        sa.Column("uploaded_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "pdr_offices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parish", sa.String(255), nullable=False),
        sa.Column("sub_county", sa.String(255), nullable=True),
        sa.Column("district", sa.String(255), nullable=False),
        sa.Column("region", sa.String(255), nullable=True),
        sa.Column("latitude", sa.Float, nullable=False),
        sa.Column("longitude", sa.Float, nullable=False),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("operating_hours", sa.String(255), server_default="Mon-Fri 8:00AM - 5:00PM"),
    )

    op.create_table(
        "agent_dispatches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id"),
            nullable=False,
        ),
        sa.Column("agent_name", sa.String(255), nullable=False),
        sa.Column("agent_phone", sa.String(20), nullable=True),
        sa.Column("scheduled_date", sa.DateTime, nullable=False),
        sa.Column("status", sa.String(20), server_default="scheduled"),
        sa.Column("evaluation_notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("agent_dispatches")
    op.drop_table("pdr_offices")
    op.drop_table("documents")
    op.drop_table("applications")
    op.drop_table("users")
