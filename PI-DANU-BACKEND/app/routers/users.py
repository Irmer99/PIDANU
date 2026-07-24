from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.chat import TranslateRequest
from app.schemas.user import (
    NINVerifyRequest,
    NINVerifyResponse,
    UserCreate,
    UserResponse,
)
from app.services.nira_service import nira_service
from app.services.sunbird_ai import sunbird_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/verify-nin", response_model=NINVerifyResponse)
async def verify_nin(req: NINVerifyRequest, db: AsyncSession = Depends(get_db)):
    nira_result = await nira_service.verify_nin(req.nin)

    if nira_result["found"]:
        existing = await db.execute(
            select(User).where(User.nin == req.nin)
        )
        user = existing.scalars().first()

        if not user:
            user = User(
                nin=req.nin,
                full_name=nira_result["full_name"],
                parish=nira_result["parish"],
                village=nira_result["village"],
                district=nira_result["district"],
                phone_number=nira_result.get("phone"),
                language_preference=req.language_preference,
            )
            db.add(user)
            await db.flush()

        message_en = f"We have found your details: {nira_result['full_name']}, from {nira_result['village']} Village, {nira_result['parish']} Parish, {nira_result['district']} District. Is this correct?"

        message_local = message_en
        if req.language_preference != "eng":
            try:
                translation = await sunbird_service.translate(
                    message_en,
                    source_language="eng",
                    target_language=req.language_preference,
                )
                message_local = translation["translated_text"]
            except Exception:
                message_local = message_en

        return NINVerifyResponse(
            found=True,
            nin=req.nin,
            full_name=nira_result["full_name"],
            parish=nira_result["parish"],
            village=nira_result["village"],
            district=nira_result["district"],
            message_en=message_en,
            message_local=message_local,
        )

    return NINVerifyResponse(
        found=False,
        nin=req.nin,
        message_en="NIN not found in our records. Please check your number and try again.",
        message_local="NIN not found in our records. Please check your number and try again.",
    )


@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(**user_data.model_dump())
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()
