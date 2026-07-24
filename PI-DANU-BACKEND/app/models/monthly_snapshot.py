import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy import JSON
from app.types import GUID

from app.database import Base


class MonthlySnapshot(Base):
    __tablename__ = "monthly_snapshots"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    parish = Column(String(255), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_requests = Column(Integer, default=0)
    resolved_requests = Column(Integer, default=0)
    pending_requests = Column(Integer, default=0)
    resources_distributed = Column(Integer, default=0)
    citizens_active = Column(Integer, default=0)
    report_data = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=datetime.utcnow)
