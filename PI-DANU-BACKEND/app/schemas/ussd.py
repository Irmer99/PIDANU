from typing import Optional

from pydantic import BaseModel


class USSDRequest(BaseModel):
    sessionId: str
    serviceCode: str
    phoneNumber: str
    text: Optional[str] = ""


class SMSInboundRequest(BaseModel):
    from_number: str = ""
    to: str = ""
    text: str = ""
    date: Optional[str] = None
