from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

ADMIN_USERS = {
    settings.ADMIN_EMAIL: {
        "email": settings.ADMIN_EMAIL,
        "hashed_password": hash_password(settings.ADMIN_PASSWORD),
        "role": "admin",
    }
}


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    admin = ADMIN_USERS.get(req.email)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": req.email, "role": admin["role"]}
    )
    return TokenResponse(access_token=access_token)
