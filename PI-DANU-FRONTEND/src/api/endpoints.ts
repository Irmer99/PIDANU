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
  return data.data;
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
  id: number
): Promise<ServiceRequest> {
  if (USE_MOCK) return mockRequests.find((r) => r.id === id)!;
  const { data } = await api.get(`/api/admin/requests/${id}`);
  return data.data;
}

export async function actOnRequest(
  id: number,
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
  return data.data;
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
  return data.data;
}

export async function getResources(): Promise<ResourceAllocation[]> {
  if (USE_MOCK) return mockResources;
  const { data } = await api.get("/api/admin/resources");
  return data.data;
}

export async function distributeResource(
  resourceId: number,
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
  return data.data;
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
  return data.data;
}
