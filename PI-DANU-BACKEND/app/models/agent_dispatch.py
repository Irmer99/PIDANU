import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AgentDispatch(Base):
    __tablename__ = "agent_dispatches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False
    )
    agent_name = Column(String(255), nullable=False)
    agent_phone = Column(String(20), nullable=True)
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="scheduled")
    evaluation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="dispatches")
