import os
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.application import Application
from app.models.document import Document
from app.models.user import User
from app.services.nira_service import nira_service
from app.utils.auth import (
    create_access_token,
    decode_access_token,
    verify_password,
)

router = APIRouter(prefix="/api/citizen", tags=["citizen"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_citizen_payload(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(auth.replace("Bearer ", ""))
    if not payload or payload.get("role") != "citizen":
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


class CitizenLoginRequest(BaseModel):
    nin: str
    pin: str


class ChatMessage(BaseModel):
    message: str
    language: str = "eng"


@router.post("/login")
async def citizen_login(req: CitizenLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.nin == req.nin))
    user = result.scalars().first()
    if not user or not user.pin_hash:
        raise HTTPException(status_code=401, detail="Account not found. Register via USSD first.")
    if not verify_password(req.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN.")
    token = create_access_token(
        data={"sub": str(user.id), "role": "citizen", "nin": user.nin}
    )
    return {
        "token": token,
        "user": {"id": str(user.id), "nin": user.nin, "name": user.full_name, "parish": user.parish, "district": user.district},
    }


@router.get("/me")
async def get_profile(request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    apps = await db.execute(select(Application).where(Application.user_id == uid))
    applications = apps.scalars().all()

    return {
        "id": str(user.id),
        "nin": user.nin,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "parish": user.parish,
        "village": user.village,
        "district": user.district,
        "language_preference": user.language_preference,
        "created_at": user.created_at.isoformat(),
        "application_count": len(applications),
    }


@router.get("/my-applications")
async def get_my_applications(request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    query = select(Application).where(Application.user_id == uid).order_by(Application.created_at.desc())
    result = await db.execute(query)
    apps = result.scalars().all()

    data = []
    for a in apps:
        doc_result = await db.execute(select(Document).where(Document.application_id == a.id))
        docs = doc_result.scalars().all()
        data.append({
            "id": str(a.id),
            "request_code": f"PI-2026-{str(a.id)[:8]}",
            "service_type": a.service_type,
            "status": a.status,
            "notes": a.notes or "",
            "documents": [
                {"id": str(d.id), "type": d.document_type, "filename": d.original_filename, "url": d.file_url, "uploaded_at": d.uploaded_at.isoformat()}
                for d in docs
            ],
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat(),
        })
    return {"data": data, "total": len(data)}


@router.post("/start-application")
async def start_application(request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")

    existing = await db.execute(
        select(Application).where(Application.user_id == uid, Application.status.in_(["in_progress", "pending"]))
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="You already have an active application.")

    application = Application(user_id=uid, service_type="pdm_registration", status="in_progress", notes="Application started")
    db.add(application)
    await db.flush()
    await db.refresh(application)
    return {"id": str(application.id), "request_code": f"PI-2026-{str(application.id)[:8]}", "status": application.status}


@router.post("/applications/{app_id}/upload")
async def upload_document(app_id: str, request: Request, db: AsyncSession = Depends(get_db), file: UploadFile = File(...), document_type: str = "other"):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == uid))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, and PDF allowed")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    doc = Document(application_id=application.id, file_url=f"/uploads/{filename}", file_key=filename, document_type=document_type, original_filename=file.filename)
    db.add(doc)
    await db.flush()
    return {"id": str(doc.id), "type": doc.document_type, "filename": doc.original_filename, "message": "Uploaded successfully."}


@router.post("/applications/{app_id}/submit")
async def submit_application(app_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == uid))
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    doc_result = await db.execute(select(Document).where(Document.application_id == application.id))
    docs = doc_result.scalars().all()
    if len(docs) < 2:
        raise HTTPException(status_code=400, detail="Upload at least National ID and passport photo first.")

    application.status = "pending"
    application.notes = f"Submitted with {len(docs)} documents"
    await db.flush()
    return {"id": str(application.id), "request_code": f"PI-2026-{str(application.id)[:8]}", "status": "pending", "message": "Submitted successfully."}


@router.post("/chat")
async def citizen_chat(msg: ChatMessage, request: Request, db: AsyncSession = Depends(get_db)):
    from app.services.gemini_ai import gemini_service

    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    lang = msg.language or user.language_preference or "eng"

    app_result = await db.execute(select(Application).where(Application.user_id == uid, Application.status.in_(["in_progress", "pending"])))
    active_app = app_result.scalars().first()

    doc_types = set()
    if active_app:
        doc_result = await db.execute(select(Document).where(Document.application_id == active_app.id))
        docs = doc_result.scalars().all()
        doc_types = {d.document_type for d in docs}

    user_context = {
        "full_name": user.full_name, "nin": user.nin, "parish": user.parish,
        "district": user.district, "phone_number": user.phone_number,
        "application_id": str(active_app.id) if active_app else None,
        "documents_uploaded": list(doc_types),
    }

    gemini_result = await gemini_service.chat(user_id=uid, message=msg.message, user_context=user_context, language=lang)
    reply = gemini_result["reply"]
    form_data = gemini_result.get("form_data")

    if form_data and active_app:
        notes_parts = [f"{k}: {v}" for k, v in form_data.items()]
        active_app.notes = (active_app.notes or "") + "\n" + "\n".join(notes_parts)
        await db.flush()

    missing = [dt for dt in ["national_id", "passport_photo", "land_title", "bank_details", "group_cert"] if dt not in doc_types]

    return {
        "reply": reply,
        "intent": "gemini_chat",
        "form_data": form_data,
        "form_progress": {
            "application_id": str(active_app.id) if active_app else None,
            "status": active_app.status if active_app else None,
            "documents_uploaded": len(doc_types),
            "documents_missing": missing,
            "form_data": form_data,
            "completion_pct": int((len(doc_types) / 5) * 100) if active_app else 0,
        },
    }
