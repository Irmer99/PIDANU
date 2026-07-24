from fastapi import APIRouter, Request, Response

from app.services.ussd_service import ussd_service
from app.services.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/ussd", tags=["ussd"])


@router.post("/callback")
async def ussd_callback(request: Request):
    form = await request.form()
    session_id = form.get("sessionId", "")
    service_code = form.get("serviceCode", "")
    phone_number = form.get("phoneNumber", "")
    text = form.get("text", "")

    if rate_limiter.check_ussd(phone_number):
        return Response(
            content="END Too many requests. Please try again later.",
            media_type="text/plain",
            status_code=429,
        )

    response_text = ussd_service.handle(session_id, phone_number, text)

    return Response(content=response_text, media_type="text/plain")
