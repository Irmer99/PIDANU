from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.application import Application
from app.schemas.citizen import (
    CitizenLoginRequest,
    CitizenRegisterRequest,
    CitizenSubmitRequest,
    CitizenTokenResponse,
)
from app.services.nira_service import nira_service
from app.utils.auth import create_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/citizen", tags=["citizen"])


def _get_citizen_payload(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(auth.replace("Bearer ", ""))
    if not payload or payload.get("role") != "citizen":
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


@router.post("/register", response_model=CitizenTokenResponse)
async def citizen_register(req: CitizenRegisterRequest, db: AsyncSession = Depends(get_db)):
    nira_result = await nira_service.verify_nin(req.nin)
    if not nira_result["found"]:
        raise HTTPException(status_code=404, detail="NIN not found. Please check your number.")

    existing = await db.execute(select(User).where(User.nin == req.nin))
    user = existing.scalars().first()

    if user and user.pin_hash:
        raise HTTPException(status_code=400, detail="Account already exists. Please login.")

    if not user:
        user = User(
            nin=req.nin,
            full_name=nira_result["full_name"],
            parish=nira_result["parish"],
            village=nira_result.get("village"),
            district=nira_result["district"],
            phone_number=nira_result.get("phone"),
            language_preference=req.language_preference,
        )
        db.add(user)

    user.pin_hash = hash_password(req.pin)
    user.language_preference = req.language_preference
    await db.flush()

    token = create_access_token(
        data={"sub": str(user.id), "role": "citizen", "nin": user.nin}
    )

    return CitizenTokenResponse(
        token=token,
        user={
            "id": str(user.id),
            "nin": user.nin,
            "name": user.full_name,
            "parish": user.parish,
            "district": user.district,
        },
    )


@router.post("/login", response_model=CitizenTokenResponse)
async def citizen_login(req: CitizenLoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.nin == req.nin))
    user = result.scalars().first()

    if not user or not user.pin_hash:
        raise HTTPException(status_code=401, detail="Account not found. Please register first.")

    if not verify_password(req.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN.")

    token = create_access_token(
        data={"sub": str(user.id), "role": "citizen", "nin": user.nin}
    )

    return CitizenTokenResponse(
        token=token,
        user={
            "id": str(user.id),
            "nin": user.nin,
            "name": user.full_name,
            "parish": user.parish,
            "district": user.district,
        },
    )


@router.get("/me")
async def get_profile(request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "nin": user.nin,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "parish": user.parish,
        "village": user.village,
        "district": user.district,
        "language_preference": user.language_preference,
        "biometric_enabled": user.biometric_enabled or False,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/my-requests")
async def get_my_requests(request: Request, db: AsyncSession = Depends(get_db)):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")
    query = select(Application).where(Application.user_id == uid)
    result = await db.execute(query)
    apps = result.scalars().all()

    data = []
    for a in apps:
        data.append({
            "id": str(a.id),
            "request_code": f"PI-2026-{str(a.id)[:8]}",
            "request_type": a.service_type,
            "description": a.notes,
            "status": a.status,
            "parish_chief_notes": a.notes,
            "submitted_via": "app",
            "created_at": a.created_at.isoformat(),
            "updated_at": a.updated_at.isoformat(),
            "completed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
        })

    return {"data": data, "total": len(data)}


@router.post("/submit-request")
async def submit_request(
    req: CitizenSubmitRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    payload = _get_citizen_payload(request)
    uid = payload.get("sub")

    application = Application(
        user_id=uid,
        service_type=req.service_type,
        notes=req.description,
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)

    return {
        "id": str(application.id),
        "request_code": f"PI-2026-{str(application.id)[:8]}",
        "status": application.status,
        "message": "Request submitted successfully. Your Parish Chief will review it.",
    }
