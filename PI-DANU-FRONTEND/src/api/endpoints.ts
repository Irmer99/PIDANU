import api from "./client";
import {
  mockCitizens,
  mockRequests,
  mockResources,
  mockAuditLogs,
  mockMetrics,
  mockMonthlyReport,
} from "./mockData";
import type {
  Citizen,
  ServiceRequest,
  ResourceAllocation,
  AuditLog,
  Metrics,
  MonthlyReport,
  User,
  CitizenUser,
  CitizenProfile,
  CitizenRequest,
} from "../types";

const USE_MOCK = true;

export async function login(pin: string): Promise<{ token: string; user: User }> {
  if (USE_MOCK) {
    if (pin === "1234")
      return {
        token: "mock-jwt-token",
        user: { name: "Parish Chief Owino", parish: "Owino" },
      };
    throw new Error("Invalid PIN");
  }
  const { data } = await api.post("/api/auth/pin", { pin });
  return data;
}

export async function getMetrics(): Promise<Metrics> {
  if (USE_MOCK) return mockMetrics;
  const { data } = await api.get("/api/admin/metrics");
  return data;
}

export async function getRequests(params?: {
  status?: string;
  type?: string;
  page?: number;
}): Promise<{ data: ServiceRequest[]; total: number }> {
  if (USE_MOCK) {
    let filtered = [...mockRequests];
    if (params?.status && params.status !== "all")
      filtered = filtered.filter((r) => r.status === params.status);
    if (params?.type && params.type !== "all")
      filtered = filtered.filter((r) => r.request_type === params.type);
    return { data: filtered, total: filtered.length };
  }
  const { data } = await api.get("/api/admin/requests", { params });
  return data;
}

export async function getRequest(
  id: string
): Promise<ServiceRequest> {
  if (USE_MOCK) return mockRequests.find((r) => r.id === id)!;
  const { data } = await api.get(`/api/admin/requests/${id}`);
  return data;
}

export async function actOnRequest(
  id: string,
  action: "approve" | "reject",
  notes: string
): Promise<ServiceRequest> {
  if (USE_MOCK) {
    const req = mockRequests.find((r) => r.id === id)!;
    req.status = action === "approve" ? "approved" : "rejected";
    req.parish_chief_notes = notes;
    req.updated_at = new Date().toISOString();
    return req;
  }
  const { data } = await api.post(`/api/admin/requests/${id}/action`, {
    action,
    notes,
  });
  return data;
}

export async function getCitizens(
  search?: string
): Promise<{ data: Citizen[]; total: number }> {
  if (USE_MOCK) {
    let filtered = [...mockCitizens];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nin.includes(q) ||
          c.phone_number.includes(q) ||
          c.full_name.toLowerCase().includes(q)
      );
    }
    return { data: filtered, total: filtered.length };
  }
  const { data } = await api.get("/api/admin/citizens", {
    params: { search },
  });
  return data;
}

export async function getCitizen(
  nin: string
): Promise<{ citizen: Citizen; requests: ServiceRequest[]; resources: ResourceAllocation[] }> {
  if (USE_MOCK) {
    const citizen = mockCitizens.find((c) => c.nin === nin)!;
    const requests = mockRequests.filter((r) => r.citizen_nin === nin);
    return { citizen, requests, resources: [] };
  }
  const { data } = await api.get(`/api/admin/citizens/${nin}`);
  return data;
}

export async function getResources(): Promise<ResourceAllocation[]> {
  if (USE_MOCK) return mockResources;
  const { data } = await api.get("/api/admin/resources");
  return data.data;
}

export async function distributeResource(
  resourceId: string,
  quantity: number,
  beneficiaryIds: number[]
): Promise<ResourceAllocation> {
  if (USE_MOCK) {
    const res = mockResources.find((r) => r.id === resourceId)!;
    res.distributed_count += quantity;
    res.beneficiaries.push(...beneficiaryIds);
    res.distribution_status =
      res.distributed_count >= res.quantity
        ? "fully_distributed"
        : "partially_distributed";
    return res;
  }
  const { data } = await api.post("/api/admin/resources/distribute", {
    resource_id: resourceId,
    quantity,
    beneficiary_ids: beneficiaryIds,
  });
  return data;
}

export async function getAuditLogs(
  page?: number
): Promise<{ data: AuditLog[]; total: number }> {
  if (USE_MOCK)
    return { data: mockAuditLogs, total: mockAuditLogs.length };
  const { data } = await api.get("/api/admin/audit", { params: { page } });
  return data;
}

export async function getMonthlyReport(
  month: number,
  year: number
): Promise<MonthlyReport> {
  if (USE_MOCK) return mockMonthlyReport;
  const { data } = await api.get("/api/admin/reports/monthly", {
    params: { month, year },
  });
  return data;
}

export async function simulateUssd(params: {
  sessionId: string;
  phoneNumber: string;
  text: string;
  serviceCode?: string;
}): Promise<string> {
  const formData = new URLSearchParams();
  formData.append("sessionId", params.sessionId);
  formData.append("phoneNumber", params.phoneNumber);
  formData.append("text", params.text);
  formData.append("serviceCode", params.serviceCode || "*384*01#");
  const { data } = await api.post("/api/ussd/callback", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return typeof data === "string" ? data : data.detail || JSON.stringify(data);
}

export async function converse(params: {
  message: string;
  language_preference?: string;
  audio_data?: string;
  user_id?: string;
  phone_number?: string;
}): Promise<import("../types").ConverseResult> {
  const { data } = await api.post("/api/chat/converse", params);
  return data;
}

export async function translateText(params: {
  text: string;
  source_language: string;
  target_language: string;
}): Promise<{ translated_text: string; source_language: string; target_language: string }> {
  const { data } = await api.post("/api/chat/translate", params);
  return data;
}

export async function detectLanguage(
  text: string
): Promise<{ language_code: string; language_name: string; confidence: number }> {
  const { data } = await api.post("/api/chat/detect-language", { text });
  return data;
}

export async function generateSpeech(
  text: string,
  language: string
): Promise<{ audio_url: string; duration_seconds: number | null }> {
  const { data } = await api.post("/api/chat/tts", { text, language });
  return data;
}

// ──────────────── Citizen Auth & Profile ────────────────

const MOCK_CITIZEN: CitizenUser = {
  id: "cit-001",
  nin: "CM800123456ABCD",
  name: "Nakato Sarah",
  parish: "Owino",
  district: "Kampala",
};

const MOCK_CITIZEN_PROFILE: CitizenProfile = {
  id: "cit-001",
  nin: "CM800123456ABCD",
  full_name: "Nakato Sarah",
  phone_number: "+256701234567",
  parish: "Owino",
  village: "Nakivubo",
  district: "Kampala",
  language_preference: "en",
  biometric_enabled: false,
  created_at: "2025-11-15T09:00:00Z",
};

const MOCK_CITIZEN_REQUESTS: CitizenRequest[] = [
  {
    id: "req-001",
    request_code: "REQ-001",
    request_type: "birth_cert",
    description: "Need birth certificate for school enrollment",
    status: "approved",
    parish_chief_notes: "Documents verified. Certificate ready for pickup.",
    submitted_via: "ussd",
    created_at: "2026-01-10T14:30:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    completed_at: null,
  },
  {
    id: "req-002",
    request_code: "REQ-002",
    request_type: "agri_inputs",
    description: "Requesting maize seeds for this season",
    status: "submitted",
    parish_chief_notes: null,
    submitted_via: "mobile",
    created_at: "2026-07-20T08:15:00Z",
    updated_at: "2026-07-20T08:15:00Z",
    completed_at: null,
  },
];

export async function citizenRegister(params: {
  nin: string;
  pin: string;
  full_name: string;
  phone_number?: string;
  parish: string;
  district: string;
  language_preference?: string;
}): Promise<{ token: string; citizen: CitizenUser }> {
  if (USE_MOCK) {
    return {
      token: "mock-citizen-token",
      citizen: { ...MOCK_CITIZEN, nin: params.nin, name: params.full_name },
    };
  }
  const { data } = await api.post("/api/citizen/register", params);
  return data;
}

export async function citizenLogin(
  nin: string,
  pin: string
): Promise<{ token: string; citizen: CitizenUser }> {
  if (USE_MOCK) {
    if (nin && pin)
      return { token: "mock-citizen-token", citizen: MOCK_CITIZEN };
    throw new Error("Invalid NIN or PIN");
  }
  const { data } = await api.post("/api/citizen/login", { nin, pin });
  return data;
}

export async function getCitizenProfile(): Promise<CitizenProfile> {
  if (USE_MOCK) return MOCK_CITIZEN_PROFILE;
  const { data } = await api.get("/api/citizen/me");
  return data;
}

export async function getCitizenMyRequests(): Promise<CitizenRequest[]> {
  if (USE_MOCK) return MOCK_CITIZEN_REQUESTS;
  const { data } = await api.get("/api/citizen/my-requests");
  return data;
}

export async function citizenSubmitRequest(params: {
  request_type: string;
  description: string;
}): Promise<CitizenRequest> {
  if (USE_MOCK) {
    const newReq: CitizenRequest = {
      id: "req-" + Math.random().toString(36).slice(2, 8),
      request_code: "REQ-" + Math.floor(Math.random() * 900 + 100),
      request_type: params.request_type,
      description: params.description,
      status: "submitted",
      parish_chief_notes: null,
      submitted_via: "mobile",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };
    return newReq;
  }
  const { data } = await api.post("/api/citizen/submit-request", params);
  return data;
}
