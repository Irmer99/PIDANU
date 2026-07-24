from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.application import Application
from app.models.resource_allocation import ResourceAllocation
from app.models.audit_log import AuditLog
from app.schemas.admin import (
    AuditLogListResponse,
    AuditLogResponse,
    CitizenListResponse,
    CitizenResponse,
    DistributeRequest,
    MetricsResponse,
    MonthlyReportResponse,
    RequestActionRequest,
    ResourceAllocationListResponse,
    ResourceAllocationResponse,
    ServiceRequestListResponse,
    ServiceRequestResponse,
)
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/admin", tags=["admin-api"])


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(db: AsyncSession = Depends(get_db)):
    apps_q = select(Application)
    apps_result = await db.execute(apps_q)
    apps = apps_result.scalars().all()

    total_requests = len(apps)
    pending_approvals = sum(1 for a in apps if a.status in ("pending", "under_review"))

    citizens_q = select(User)
    citizens_result = await db.execute(citizens_q)
    citizens = citizens_result.scalars().all()
    active_citizens = len(citizens)

    resources_q = select(ResourceAllocation)
    res_result = await db.execute(resources_q)
    resources = res_result.scalars().all()
    resources_distributed = sum(r.distributed_count for r in resources)

    type_counts = {}
    for a in apps:
        t = a.service_type or "other"
        type_counts[t] = type_counts.get(t, 0) + 1

    requests_by_type = [
        {"type": k.replace("_", " ").title(), "count": v}
        for k, v in type_counts.items()
    ]

    monthly_trend = [
        {"month": "Feb", "requests": 18},
        {"month": "Mar", "requests": 22},
        {"month": "Apr", "requests": 15},
        {"month": "May", "requests": 28},
        {"month": "Jun", "requests": 25},
        {"month": "Jul", "requests": total_requests},
    ]

    return MetricsResponse(
        total_requests=total_requests,
        active_citizens=active_citizens,
        pending_approvals=pending_approvals,
        resources_distributed=resources_distributed,
        requests_by_type=requests_by_type,
        monthly_trend=monthly_trend,
    )


@router.get("/requests", response_model=ServiceRequestListResponse)
async def list_requests(
    status: Optional[str] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Application)
    count_q = select(func.count(Application.id))

    if status and status != "all":
        query = query.where(Application.status == status)
        count_q = count_q.where(Application.status == status)
    if type and type != "all":
        query = query.where(Application.service_type == type)
        count_q = count_q.where(Application.service_type == type)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(query.offset(skip).limit(limit))
    apps = result.scalars().all()

    data = []
    for a in apps:
        user_result = await db.execute(select(User).where(User.id == a.user_id))
        user = user_result.scalars().first()
        data.append(ServiceRequestResponse(
            id=str(a.id),
            request_code=f"PI-2026-{str(a.id)[:8]}",
            citizen_id=str(a.user_id),
            citizen_nin=user.nin if user else None,
            citizen_name=user.full_name if user else None,
            request_type=a.service_type,
            description=a.notes,
            status=a.status,
            priority="medium",
            parish_chief_notes=a.notes,
            submitted_via="ussd",
            created_at=a.created_at,
            updated_at=a.updated_at,
            completed_at=a.reviewed_at,
        ))

    return ServiceRequestListResponse(data=data, total=total)


@router.get("/requests/{request_id}", response_model=ServiceRequestResponse)
async def get_request(request_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    try:
        uid = UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    result = await db.execute(select(Application).where(Application.id == uid))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Request not found")

    user_result = await db.execute(select(User).where(User.id == app.user_id))
    user = user_result.scalars().first()

    return ServiceRequestResponse(
        id=str(app.id),
        request_code=f"PI-2026-{str(app.id)[:8]}",
        citizen_id=str(app.user_id),
        citizen_nin=user.nin if user else None,
        citizen_name=user.full_name if user else None,
        request_type=app.service_type,
        description=app.notes,
        status=app.status,
        priority="medium",
        parish_chief_notes=app.notes,
        submitted_via="ussd",
        created_at=app.created_at,
        updated_at=app.updated_at,
        completed_at=app.reviewed_at,
    )


@router.post("/requests/{request_id}/action", response_model=ServiceRequestResponse)
async def act_on_request(
    request_id: str,
    req: RequestActionRequest,
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID
    try:
        uid = UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request ID")

    result = await db.execute(select(Application).where(Application.id == uid))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.action == "approve":
        app.status = "approved"
    elif req.action == "reject":
        app.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    app.notes = req.notes or app.notes
    app.reviewed_at = datetime.utcnow()
    await db.flush()

    user_result = await db.execute(select(User).where(User.id == app.user_id))
    user = user_result.scalars().first()

    return ServiceRequestResponse(
        id=str(app.id),
        request_code=f"PI-2026-{str(app.id)[:8]}",
        citizen_id=str(app.user_id),
        citizen_nin=user.nin if user else None,
        citizen_name=user.full_name if user else None,
        request_type=app.service_type,
        description=app.notes,
        status=app.status,
        priority="medium",
        parish_chief_notes=app.notes,
        submitted_via="ussd",
        created_at=app.created_at,
        updated_at=app.updated_at,
        completed_at=app.reviewed_at,
    )


@router.get("/citizens", response_model=CitizenListResponse)
async def list_citizens(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    count_q = select(func.count(User.id))

    if search:
        q = f"%{search}%"
        query = query.where(
            (User.nin.ilike(q))
            | (User.phone_number.ilike(q))
            | (User.full_name.ilike(q))
        )
        count_q = count_q.where(
            (User.nin.ilike(q))
            | (User.phone_number.ilike(q))
            | (User.full_name.ilike(q))
        )

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(query.offset(skip).limit(limit))
    users = result.scalars().all()

    data = []
    for u in users:
        data.append(CitizenResponse(
            id=str(u.id),
            nin=u.nin,
            phone_number=u.phone_number,
            full_name=u.full_name,
            parish=u.parish,
            district=u.district,
            language_preference=u.language_preference or "eng",
            verification_status="verified" if u.nin else "pending",
            is_active=True,
            created_at=u.created_at,
        ))

    return CitizenListResponse(data=data, total=total)


@router.get("/citizens/{nin}", response_model=dict)
async def get_citizen_by_nin(nin: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.nin == nin))
    user = result.scalars().first()
    if not user:
        return {"citizen": None, "requests": [], "resources": []}

    citizen = CitizenResponse(
        id=str(user.id),
        nin=user.nin,
        phone_number=user.phone_number,
        full_name=user.full_name,
        parish=user.parish,
        district=user.district,
        language_preference=user.language_preference or "eng",
        verification_status="verified" if user.nin else "pending",
        is_active=True,
        created_at=user.created_at,
    )

    apps_q = select(Application).where(Application.user_id == user.id)
    apps_result = await db.execute(apps_q)
    apps = apps_result.scalars().all()

    requests = []
    for a in apps:
        requests.append(ServiceRequestResponse(
            id=str(a.id),
            request_code=f"PI-2026-{str(a.id)[:8]}",
            citizen_id=str(a.user_id),
            citizen_nin=user.nin,
            citizen_name=user.full_name,
            request_type=a.service_type,
            description=a.notes,
            status=a.status,
            priority="medium",
            parish_chief_notes=a.notes,
            submitted_via="ussd",
            created_at=a.created_at,
            updated_at=a.updated_at,
            completed_at=a.reviewed_at,
        ))

    return {
        "citizen": citizen,
        "requests": requests,
        "resources": [],
    }


@router.get("/resources", response_model=ResourceAllocationListResponse)
async def list_resources(
    parish: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(ResourceAllocation)
    if parish:
        query = query.where(ResourceAllocation.parish == parish)

    result = await db.execute(query)
    resources = result.scalars().all()

    data = []
    for r in resources:
        data.append(ResourceAllocationResponse(
            id=str(r.id),
            resource_type=r.resource_type,
            quantity=r.quantity,
            parish=r.parish,
            allocation_date=r.allocation_date,
            distribution_status=r.distribution_status,
            distributed_count=r.distributed_count,
            beneficiaries=r.beneficiaries or [],
        ))

    return ResourceAllocationListResponse(data=data, total=len(data))


@router.post("/resources/distribute", response_model=ResourceAllocationResponse)
async def distribute_resource(
    req: DistributeRequest,
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID

    result = await db.execute(
        select(ResourceAllocation).where(ResourceAllocation.id == UUID(req.resource_id))
    )
    resource = result.scalars().first()
    if not resource:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.distributed_count += req.quantity
    current_beneficiaries = resource.beneficiaries or []
    current_beneficiaries.extend(req.beneficiary_ids)
    resource.beneficiaries = list(set(current_beneficiaries))

    if resource.distributed_count >= resource.quantity:
        resource.distribution_status = "fully_distributed"
    else:
        resource.distribution_status = "partially_distributed"

    await db.flush()

    return ResourceAllocationResponse(
        id=str(resource.id),
        resource_type=resource.resource_type,
        quantity=resource.quantity,
        parish=resource.parish,
        allocation_date=resource.allocation_date,
        distribution_status=resource.distribution_status,
        distributed_count=resource.distributed_count,
        beneficiaries=resource.beneficiaries or [],
    )


@router.get("/audit", response_model=AuditLogListResponse)
async def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    logs, total = await audit_service.get_logs(db, skip=skip, limit=limit)

    data = []
    for log in logs:
        data.append(AuditLogResponse(
            id=str(log.id),
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            actor_phone=log.actor_phone,
            actor_role=log.actor_role,
            details=log.details or {},
            timestamp=log.timestamp,
        ))

    return AuditLogListResponse(data=data, total=total)


@router.get("/reports/monthly", response_model=MonthlyReportResponse)
async def get_monthly_report(
    month: int = 7,
    year: int = 2026,
    parish: str = "Owino",
    db: AsyncSession = Depends(get_db),
):
    report_data = await audit_service.generate_monthly_report(db, parish, month, year)

    audit_logs = []
    for log in report_data.get("audit_logs", []):
        audit_logs.append(AuditLogResponse(
            id=str(log.id),
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            actor_phone=log.actor_phone,
            actor_role=log.actor_role,
            details=log.details or {},
            timestamp=log.timestamp,
        ))

    return MonthlyReportResponse(
        parish=report_data["parish"],
        month=report_data["month"],
        year=report_data["year"],
        total_requests=report_data["total_requests"],
        resolved_requests=report_data["resolved_requests"],
        pending_requests=report_data["pending_requests"],
        resources_distributed=report_data["resources_distributed"],
        citizens_active=report_data["citizens_active"],
        audit_logs=audit_logs,
    )
