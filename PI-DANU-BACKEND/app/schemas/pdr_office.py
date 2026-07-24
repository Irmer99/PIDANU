from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PDROfficeResponse(BaseModel):
    id: UUID
    name: str
    parish: str
    sub_county: Optional[str]
    district: str
    region: Optional[str]
    latitude: float
    longitude: float
    contact_phone: Optional[str]
    operating_hours: str

    class Config:
        from_attributes = True


class NearestPDROfficeRequest(BaseModel):
    latitude: float
    longitude: float


class NearestPDROfficeResponse(BaseModel):
    office: PDROfficeResponse
    distance_km: float
    directions_hint: str
