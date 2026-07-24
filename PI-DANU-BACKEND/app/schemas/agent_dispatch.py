from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AgentDispatchCreate(BaseModel):
    application_id: UUID
    agent_name: str
    agent_phone: Optional[str] = None
    scheduled_date: datetime
    evaluation_notes: Optional[str] = None


class AgentDispatchResponse(BaseModel):
    id: UUID
    application_id: UUID
    agent_name: str
    agent_phone: Optional[str]
    scheduled_date: datetime
    status: str
    evaluation_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
