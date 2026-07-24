import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.application import Application
from app.models.user import User
from app.models.resource_allocation import ResourceAllocation
from app.models.monthly_snapshot import MonthlySnapshot

logger = logging.getLogger(__name__)


class AuditService:
    async def log(
        self,
        db: AsyncSession,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        actor_phone: Optional[str] = None,
        actor_role: str = "citizen",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_phone=actor_phone,
            actor_role=actor_role,
            details=details or {},
            ip_address=ip_address,
        )
        db.add(entry)
        await db.flush()
        return entry

    async def get_logs(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple:
        count_q = select(func.count(AuditLog.id))
        total_result = await db.execute(count_q)
        total = total_result.scalar() or 0

        query = select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        return logs, total

    async def generate_monthly_report(
        self,
        db: AsyncSession,
        parish: str,
        month: int,
        year: int,
    ) -> Dict[str, Any]:
        applications_q = select(Application)
        apps_result = await db.execute(applications_q)
        apps = apps_result.scalars().all()

        total = len(apps)
        resolved = sum(1 for a in apps if a.status in ("approved", "rejected", "completed"))
        pending = sum(1 for a in apps if a.status in ("pending", "under_review", "evaluating"))

        resources_q = select(ResourceAllocation).where(ResourceAllocation.parish == parish)
        res_result = await db.execute(resources_q)
        resources = res_result.scalars().all()
        total_distributed = sum(r.distributed_count for r in resources)

        citizens_q = select(User).where(User.parish.ilike(f"%{parish}%"))
        citizens_result = await db.execute(citizens_q)
        citizens = citizens_result.scalars().all()
        active_citizens = len(citizens)

        audit_logs_q = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50)
        audit_result = await db.execute(audit_logs_q)
        audit_logs = audit_result.scalars().all()

        return {
            "parish": parish,
            "month": month,
            "year": year,
            "total_requests": total,
            "resolved_requests": resolved,
            "pending_requests": pending,
            "resources_distributed": total_distributed,
            "citizens_active": active_citizens,
            "audit_logs": audit_logs,
        }


audit_service = AuditService()
