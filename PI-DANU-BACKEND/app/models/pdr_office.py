import uuid

from sqlalchemy import Column, Float, String
from app.types import GUID as UUID

from app.database import Base


class PDROffice(Base):
    __tablename__ = "pdr_offices"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    parish = Column(String(255), nullable=False)
    sub_county = Column(String(255), nullable=True)
    district = Column(String(255), nullable=False)
    region = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    operating_hours = Column(String(255), default="Mon-Fri 8:00AM - 5:00PM")
