from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    admin,
    admin_api,
    applications,
    auth,
    chat,
    citizen,
    pdr_offices,
    sms,
    sync,
    users,
    ussd,
    voice,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "PI-DANU - Decentralised Governance & Citizen Inclusion in Public Service Delivery. "
        "Empowering Ugandan citizens to access the Parish Development Model via USSD, SMS, "
        "and Voice in their local language. "
        "Powered by Sunbird AI for translation, speech-to-text, and text-to-speech."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(users.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(pdr_offices.router)
app.include_router(ussd.router)
app.include_router(sms.router)
app.include_router(admin_api.router)
app.include_router(voice.router)
app.include_router(sync.router)
app.include_router(citizen.router)


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
