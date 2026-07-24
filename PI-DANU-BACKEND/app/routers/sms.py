from fastapi import APIRouter, Form, Request

from app.services.sms_service import sms_service
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/sms", tags=["sms"])


@router.post("/inbound")
async def sms_inbound(
    from_number: str = Form(...),
    to: str = Form(...),
    text: str = Form(...),
    date: str = Form(None),
):
    if rate_limiter.check_sms(from_number):
        return {"status": "rate_limited"}

    response_text = sms_service.handle(from_number, text)

    return {"status": "ok", "response": response_text}
