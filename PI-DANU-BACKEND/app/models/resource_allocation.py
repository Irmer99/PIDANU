import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy import JSON
from app.types import GUID

from app.database import Base


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    resource_type = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    parish = Column(String(255), nullable=False)
    allocation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    distribution_status = Column(
        String(30),
        default="allocated",
        nullable=False,
    )
    distributed_count = Column(Integer, default=0)
    beneficiaries = Column(JSON, default=list)
    audit_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
