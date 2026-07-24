from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.admin import PinLoginRequest, PinLoginResponse
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

PIN_USERS = {
    "1234": {"name": "Parish Chief Owino", "parish": "Owino", "role": "parish_chief"},
    "5678": {"name": "Parish Chief Laroo", "parish": "Laroo", "role": "parish_chief"},
    "0000": {"name": "Admin User", "parish": "All", "role": "admin"},
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


@router.post("/pin", response_model=PinLoginResponse)
async def pin_login(req: PinLoginRequest):
    user = PIN_USERS.get(req.pin)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid PIN")

    access_token = create_access_token(
        data={"sub": user["name"], "role": user["role"], "parish": user["parish"]}
    )
    return PinLoginResponse(
        token=access_token,
        user={"name": user["name"], "parish": user["parish"]},
    )
