from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    application_id: UUID
    file_url: str
    document_type: str
    original_filename: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True
