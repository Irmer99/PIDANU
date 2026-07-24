import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application
from app.models.document import Document
from app.schemas.application import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationResponse,
)
from app.schemas.document import DocumentResponse
from app.services.document_service import document_service

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.post("/", response_model=ApplicationResponse)
async def create_application(
    req: ApplicationCreate, db: AsyncSession = Depends(get_db)
):
    application = Application(
        user_id=req.user_id,
        service_type=req.service_type,
        notes=req.notes,
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)
    return ApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        status=application.status,
        service_type=application.service_type,
        notes=application.notes,
        reviewed_by=application.reviewed_by,
        reviewed_at=application.reviewed_at,
        created_at=application.created_at,
        updated_at=application.updated_at,
        document_count=0,
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    doc_count_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.application_id == application_id
        )
    )
    doc_count = doc_count_result.scalar() or 0

    return ApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        status=app.status,
        service_type=app.service_type,
        notes=app.notes,
        reviewed_by=app.reviewed_by,
        reviewed_at=app.reviewed_at,
        created_at=app.created_at,
        updated_at=app.updated_at,
        document_count=doc_count,
    )


@router.get("/", response_model=ApplicationListResponse)
async def list_applications(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Application)
    count_query = select(func.count(Application.id))

    if status:
        query = query.where(Application.status == status)
        count_query = count_query.where(Application.status == status)

    result = await db.execute(query.offset(skip).limit(limit))
    apps = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    responses = []
    for app in apps:
        doc_count_result = await db.execute(
            select(func.count(Document.id)).where(
                Document.application_id == app.id
            )
        )
        doc_count = doc_count_result.scalar() or 0
        responses.append(
            ApplicationResponse(
                id=app.id,
                user_id=app.user_id,
                status=app.status,
                service_type=app.service_type,
                notes=app.notes,
                reviewed_by=app.reviewed_by,
                reviewed_at=app.reviewed_at,
                created_at=app.created_at,
                updated_at=app.updated_at,
                document_count=doc_count,
            )
        )

    return ApplicationListResponse(applications=responses, total=total)


@router.post(
    "/{application_id}/documents", response_model=DocumentResponse
)
async def upload_document(
    application_id: uuid.UUID,
    file: UploadFile = File(...),
    document_type: str = "other",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    file_bytes = await file.read()
    upload_result = await document_service.upload_document(
        file_bytes=file_bytes,
        filename=file.filename or "document",
        content_type=file.content_type or "application/octet-stream",
        application_id=str(application_id),
        document_type=document_type,
    )

    document = Document(
        application_id=application_id,
        file_url=upload_result["file_url"],
        file_key=upload_result.get("file_key"),
        document_type=document_type,
        original_filename=file.filename,
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


@router.get("/{application_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    application_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.application_id == application_id)
    )
    return result.scalars().all()
