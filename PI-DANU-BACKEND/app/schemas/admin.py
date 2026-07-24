from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class MetricsResponse(BaseModel):
    total_requests: int = 0
    active_citizens: int = 0
    pending_approvals: int = 0
    resources_distributed: int = 0
    requests_by_type: List[Dict[str, Any]] = []
    monthly_trend: List[Dict[str, Any]] = []


class CitizenResponse(BaseModel):
    id: str
    nin: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    parish: Optional[str] = None
    district: Optional[str] = None
    language_preference: str = "eng"
    verification_status: str = "pending"
    is_active: bool = True
    created_at: datetime
    last_check_in: Optional[datetime] = None


class CitizenListResponse(BaseModel):
    data: List[CitizenResponse]
    total: int


class ServiceRequestResponse(BaseModel):
    id: str
    request_code: str
    citizen_id: str
    citizen_nin: Optional[str] = None
    citizen_name: Optional[str] = None
    request_type: str
    description: Optional[str] = None
    status: str
    priority: str = "medium"
    parish_chief_notes: Optional[str] = None
    submitted_via: str = "ussd"
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class ServiceRequestListResponse(BaseModel):
    data: List[ServiceRequestResponse]
    total: int


class RequestActionRequest(BaseModel):
    action: str
    notes: Optional[str] = None


class ResourceAllocationResponse(BaseModel):
    id: str
    resource_type: str
    quantity: int
    parish: str
    allocation_date: datetime
    distribution_status: str
    distributed_count: int = 0
    beneficiaries: List[int] = []


class ResourceAllocationListResponse(BaseModel):
    data: List[ResourceAllocationResponse]
    total: int = 0


class DistributeRequest(BaseModel):
    resource_id: str
    quantity: int
    beneficiary_ids: List[int] = []


class AuditLogResponse(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    actor_phone: Optional[str] = None
    actor_role: str = "citizen"
    details: Dict[str, Any] = {}
    timestamp: datetime


class AuditLogListResponse(BaseModel):
    data: List[AuditLogResponse]
    total: int


class MonthlyReportResponse(BaseModel):
    parish: str
    month: int
    year: int
    total_requests: int = 0
    resolved_requests: int = 0
    pending_requests: int = 0
    resources_distributed: int = 0
    citizens_active: int = 0
    audit_logs: List[AuditLogResponse] = []


class PinLoginRequest(BaseModel):
    pin: str


class PinLoginResponse(BaseModel):
    token: str
    user: Dict[str, str]
