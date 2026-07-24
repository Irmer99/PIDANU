export interface Citizen {
  id: number;
  nin: string;
  phone_number: string;
  full_name: string;
  parish: string;
  district: string;
  language_preference: string;
  verification_status: "pending" | "verified" | "flagged";
  is_active: boolean;
  created_at: string;
  last_check_in: string | null;
}

export interface ServiceRequest {
  id: number;
  request_code: string;
  citizen_id: number;
  citizen_nin: string;
  citizen_name: string;
  request_type: "birth_cert" | "land_permit" | "agri_inputs" | "infra_report";
  description: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  parish_chief_notes: string;
  submitted_via: "ussd" | "sms" | "admin" | "voice";
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ResourceAllocation {
  id: number;
  resource_type: string;
  quantity: number;
  parish: string;
  allocation_date: string;
  distribution_status: "allocated" | "partially_distributed" | "fully_distributed";
  distributed_count: number;
  beneficiaries: number[];
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  actor_phone: string;
  actor_role: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface Metrics {
  total_requests: number;
  active_citizens: number;
  pending_approvals: number;
  resources_distributed: number;
  requests_by_type: { type: string; count: number }[];
  monthly_trend: { month: string; requests: number }[];
}

export interface MonthlyReport {
  parish: string;
  month: number;
  year: number;
  total_requests: number;
  resolved_requests: number;
  pending_requests: number;
  resources_distributed: number;
  citizens_active: number;
  audit_logs: AuditLog[];
}

export interface User {
  name: string;
  parish: string;
}
