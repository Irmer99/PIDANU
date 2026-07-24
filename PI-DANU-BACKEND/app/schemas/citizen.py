from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class CitizenRegisterRequest(BaseModel):
    nin: str
    pin: str
    language_preference: str = "eng"


class CitizenLoginRequest(BaseModel):
    nin: str
    pin: str


class CitizenTokenResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class CitizenProfileResponse(BaseModel):
    id: str
    nin: str
    full_name: str
    phone_number: Optional[str] = None
    parish: str
    village: Optional[str] = None
    district: str
    language_preference: str
    biometric_enabled: bool
    created_at: datetime


class CitizenRequestResponse(BaseModel):
    id: str
    request_code: str
    request_type: str
    description: Optional[str] = None
    status: str
    parish_chief_notes: Optional[str] = None
    submitted_via: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class CitizenRequestListResponse(BaseModel):
    data: List[CitizenRequestResponse]
    total: int


class CitizenSubmitRequest(BaseModel):
    service_type: str
    description: str


class CitizenNotificationResponse(BaseModel):
    id: str
    type: str
    message: str
    read: bool
    created_at: datetime
