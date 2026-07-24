import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application
from app.models.agent_dispatch import AgentDispatch
from app.schemas.agent_dispatch import (
    AgentDispatchCreate,
    AgentDispatchResponse,
)
from app.services.sunbird_ai import sunbird_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ApproveRequest(BaseModel):
    reviewed_by: str
    notes: str | None = None


class StatusUpdateRequest(BaseModel):
    status: str
    notes: str | None = None


@router.get("/applications")
async def list_all_applications(
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    query = select(Application)
    count_query = select(func.count(Application.id))

    if status:
        query = query.where(Application.status == status)
        count_query = count_query.where(Application.status == status)

    result = await db.execute(query.offset(skip).limit(limit))
    apps = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return {"applications": apps, "total": total}


@router.get("/applications/{application_id}")
async def get_application_detail(
    application_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    from app.models.document import Document

    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    docs_result = await db.execute(
        select(Document).where(Document.application_id == application_id)
    )
    documents = docs_result.scalars().all()

    dispatches_result = await db.execute(
        select(AgentDispatch).where(
            AgentDispatch.application_id == application_id
        )
    )
    dispatches = dispatches_result.scalars().all()

    return {
        "application": app,
        "documents": documents,
        "dispatches": dispatches,
    }


@router.put("/applications/{application_id}/approve")
async def approve_application(
    application_id: uuid.UUID,
    req: ApproveRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = "approved"
    app.reviewed_by = req.reviewed_by
    app.reviewed_at = datetime.utcnow()
    app.notes = req.notes or app.notes
    await db.flush()

    return {"message": "Application approved", "application_id": str(application_id)}


@router.put("/applications/{application_id}/reject")
async def reject_application(
    application_id: uuid.UUID,
    req: ApproveRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = "rejected"
    app.reviewed_by = req.reviewed_by
    app.reviewed_at = datetime.utcnow()
    app.notes = req.notes or app.notes
    await db.flush()

    return {"message": "Application rejected", "application_id": str(application_id)}


@router.put("/applications/{application_id}/status")
async def update_status(
    application_id: uuid.UUID,
    req: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = req.status
    if req.notes:
        app.notes = req.notes
    await db.flush()

    return {"message": f"Status updated to {req.status}", "application_id": str(application_id)}


@router.post("/applications/{application_id}/dispatch", response_model=AgentDispatchResponse)
async def dispatch_agent(
    application_id: uuid.UUID,
    req: AgentDispatchCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = "evaluating"
    await db.flush()

    dispatch = AgentDispatch(
        application_id=application_id,
        agent_name=req.agent_name,
        agent_phone=req.agent_phone,
        scheduled_date=req.scheduled_date,
        evaluation_notes=req.evaluation_notes,
    )
    db.add(dispatch)
    await db.flush()
    await db.refresh(dispatch)

    try:
        user_result = await db.execute(
            select(Application.user_id).where(Application.id == application_id)
        )
        user_id = user_result.scalar()
        if user_id:
            from app.models.user import User

            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalars().first()
            if user and user.phone_number:
                notification_en = (
                    f"Your documents have been approved. "
                    f"Agent {req.agent_name} will visit your village on "
                    f"{req.scheduled_date.strftime('%d %B %Y')} to evaluate your project. "
                    f"Please prepare the necessary items."
                )
                try:
                    lang = user.language_preference or "eng"
                    if lang != "eng":
                        translation = await sunbird_service.translate(
                            notification_en,
                            source_language="eng",
                            target_language=lang,
                        )
                        notification_local = translation["translated_text"]
                    else:
                        notification_local = notification_en
                except Exception:
                    notification_local = notification_en
    except Exception:
        pass

    return dispatch
