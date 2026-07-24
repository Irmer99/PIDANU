from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    nin: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    parish: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    language_preference: str = "eng"


class UserResponse(BaseModel):
    id: UUID
    nin: Optional[str]
    full_name: Optional[str]
    phone_number: Optional[str]
    email: Optional[str]
    parish: Optional[str]
    village: Optional[str]
    district: Optional[str]
    language_preference: str
    created_at: datetime

    class Config:
        from_attributes = True


class NINVerifyRequest(BaseModel):
    nin: str
    language_preference: str = "eng"


class NINVerifyResponse(BaseModel):
    found: bool
    nin: str
    full_name: Optional[str] = None
    parish: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    message_en: str
    message_local: str
