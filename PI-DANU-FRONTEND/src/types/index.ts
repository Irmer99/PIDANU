export interface Citizen {
  id: string;
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
  id: string;
  request_code: string;
  citizen_id: string;
  citizen_nin: string;
  citizen_name: string;
  request_type: "birth_cert" | "land_permit" | "agri_inputs" | "infra_report" | string;
  description: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "completed" | string;
  priority: "low" | "medium" | "high" | "urgent";
  parish_chief_notes: string;
  submitted_via: "ussd" | "sms" | "admin" | "voice";
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ResourceAllocation {
  id: string;
  resource_type: string;
  quantity: number;
  parish: string;
  allocation_date: string;
  distribution_status: "allocated" | "partially_distributed" | "fully_distributed" | string;
  distributed_count: number;
  beneficiaries: number[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
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

export interface CitizenUser {
  id: string;
  nin: string;
  name: string;
  parish: string;
  district: string;
}

export interface CitizenProfile {
  id: string;
  nin: string;
  full_name: string;
  phone_number: string | null;
  parish: string;
  village: string | null;
  district: string;
  language_preference: string;
  biometric_enabled: boolean;
  created_at: string;
}

export interface CitizenRequest {
  id: string;
  request_code: string;
  request_type: string;
  description: string | null;
  status: string;
  parish_chief_notes: string | null;
  submitted_via: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface UssdLogEntry {
  timestamp: string;
  request: { text: string; sessionId: string; phoneNumber: string };
  response: string;
}

export interface ConverseResult {
  reply_text: string;
  reply_local: string;
  detected_language: string;
  intent: string;
  audio_url: string | null;
  user_id: string | null;
}

export interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
  input?: string;
  output?: string;
  detail?: string;
}

export interface ConversationEntry {
  id: string;
  user_input: string;
  input_type: "text" | "audio";
  language_preference: string;
  result: ConverseResult | null;
  steps: PipelineStep[];
  timestamp: string;
}
