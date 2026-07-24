"""add resource allocations, audit logs, monthly snapshots, admin users

Revision ID: 002_add_resources_audit
Revises: 001_seed_pdr
Create Date: 2026-07-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_add_resources_audit"
down_revision: Union[str, None] = "001_seed_pdr"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resource_allocations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("resource_type", sa.String(100), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("parish", sa.String(255), nullable=False),
        sa.Column("allocation_date", sa.DateTime, nullable=False),
        sa.Column("distribution_status", sa.String(30), server_default="allocated"),
        sa.Column("distributed_count", sa.Integer, server_default="0"),
        sa.Column("beneficiaries", postgresql.JSON, server_default="[]"),
        sa.Column("audit_hash", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("actor_phone", sa.String(20), nullable=True),
        sa.Column("actor_role", sa.String(20), server_default="citizen"),
        sa.Column("details", postgresql.JSON, server_default="{}"),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "monthly_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("parish", sa.String(255), nullable=False),
        sa.Column("month", sa.Integer, nullable=False),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("total_requests", sa.Integer, server_default="0"),
        sa.Column("resolved_requests", sa.Integer, server_default="0"),
        sa.Column("pending_requests", sa.Integer, server_default="0"),
        sa.Column("resources_distributed", sa.Integer, server_default="0"),
        sa.Column("citizens_active", sa.Integer, server_default="0"),
        sa.Column("report_data", postgresql.JSON, server_default="{}"),
        sa.Column("generated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pin_hash", sa.String(128), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("parish", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), server_default="parish_chief"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("admin_users")
    op.drop_table("monthly_snapshots")
    op.drop_table("audit_logs")
    op.drop_table("resource_allocations")
