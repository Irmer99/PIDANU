from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    user_id: UUID
    service_type: str = "pdm_registration"
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    status: str
    service_type: str
    notes: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    document_count: int = 0

    class Config:
        from_attributes = True


class ApplicationListResponse(BaseModel):
    applications: List[ApplicationResponse]
    total: int
