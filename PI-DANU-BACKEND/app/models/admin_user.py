import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pin_hash = Column(String(128), nullable=False)
    name = Column(String(255), nullable=False)
    parish = Column(String(255), nullable=False)
    role = Column(String(20), default="parish_chief")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
