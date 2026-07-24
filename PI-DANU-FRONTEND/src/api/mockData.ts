import type { Citizen, ServiceRequest, ResourceAllocation, AuditLog, Metrics, MonthlyReport } from "../types";

const parishes = ["Owino", "Laroo", "Bwama", "Kanyumu"];
const districts = ["Gulu", "Lira", "Mbale", "Soroti"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generateNIN(): string {
  return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("");
}

function generatePhone(): string {
  const prefix = pick(["700", "701", "702", "703", "704", "705", "706", "707", "708", "709"]);
  const suffix = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("");
  return `+256${prefix}${suffix}`;
}

const firstNames = ["Okello", "Apio", "Ochieng", "Nambi", "Kizza", "Namutebi", "Otieno", "Nambogo", "Wasswa", "Nakato", "Tumusiime", "Auma", "Byaruhanga", "Kabanda", "Lukwago", "Mugisha", "Nansubuga", "Ssemakula", "Waiswa", "Namukasa"];
const lastNames = ["John", "Sarah", "Peter", "Grace", "David", "Mary", "James", "Joyce", "Robert", "Agnes", "Charles", "Florence", "Joseph", "Catherine", "Stephen", "Esther", "Samuel", "Patricia", "Daniel", "Harriet"];

export const mockCitizens: Citizen[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  nin: generateNIN(),
  phone_number: generatePhone(),
  full_name: `${pick(firstNames)} ${pick(lastNames)}`,
  parish: pick(parishes),
  district: pick(districts),
  language_preference: pick(["eng", "lug", "nyn", "ach", "teo", "swa"]),
  verification_status: pick(["verified", "verified", "verified", "pending", "flagged"]),
  is_active: Math.random() > 0.1,
  created_at: randomDate(new Date("2025-01-01"), new Date("2026-06-01")),
  last_check_in: Math.random() > 0.3 ? randomDate(new Date("2026-05-01"), new Date("2026-07-20")) : null,
}));

const requestTypes: ServiceRequest["request_type"][] = ["birth_cert", "land_permit", "agri_inputs", "infra_report"];
const statuses: ServiceRequest["status"][] = ["submitted", "under_review", "approved", "rejected", "completed"];
const priorities: ServiceRequest["priority"][] = ["low", "medium", "high", "urgent"];
const via: ServiceRequest["submitted_via"][] = ["ussd", "sms", "admin", "voice"];

const descriptions: Record<ServiceRequest["request_type"], string[]> = {
  birth_cert: ["Need birth certificate for my child", "Birth certificate correction needed", "Late registration of birth"],
  land_permit: ["Land ownership verification", "Transfer of land title", "Boundary dispute resolution"],
  agri_inputs: ["Maize seeds for this season", "Fertilizer application request", "Need tools for new farming group", "Irrigation supplies for wet season"],
  infra_report: ["Road damaged near trading center", "Water point broken for 2 weeks", "School roof leaking", "Bridge over river needs repair", "Health center needs supplies"],
};

export const mockRequests: ServiceRequest[] = Array.from({ length: 30 }, (_, i) => {
  const type = pick(requestTypes);
  const citizen = pick(mockCitizens);
  const createdAt = randomDate(new Date("2026-05-01"), new Date("2026-07-20"));
  return {
    id: i + 1,
    request_code: `PI-2026-${String(i + 1).padStart(4, "0")}`,
    citizen_id: citizen.id,
    citizen_nin: citizen.nin,
    citizen_name: citizen.full_name,
    request_type: type,
    description: pick(descriptions[type]),
    status: pick(statuses),
    priority: pick(priorities),
    parish_chief_notes: "",
    submitted_via: pick(via),
    created_at: createdAt,
    updated_at: randomDate(new Date(createdAt), new Date("2026-07-23")),
    completed_at: null,
  };
});

export const mockResources: ResourceAllocation[] = [
  { id: 1, resource_type: "Maize Seeds (kg)", quantity: 500, parish: "Owino", allocation_date: "2026-07-01", distribution_status: "partially_distributed", distributed_count: 320, beneficiaries: [1, 5, 12, 23, 45, 8, 14, 22] },
  { id: 2, resource_type: "Fertilizer (bags)", quantity: 200, parish: "Laroo", allocation_date: "2026-07-01", distribution_status: "allocated", distributed_count: 0, beneficiaries: [] },
  { id: 3, resource_type: "Hoes", quantity: 150, parish: "Bwama", allocation_date: "2026-06-15", distribution_status: "fully_distributed", distributed_count: 150, beneficiaries: [3, 7, 11, 19, 25, 31, 38, 42] },
  { id: 4, resource_type: "Bean Seeds (kg)", quantity: 300, parish: "Kanyumu", allocation_date: "2026-07-10", distribution_status: "partially_distributed", distributed_count: 120, beneficiaries: [2, 9, 16, 28] },
  { id: 5, resource_type: "Spray Pumps", quantity: 50, parish: "Owino", allocation_date: "2026-06-20", distribution_status: "partially_distributed", distributed_count: 30, beneficiaries: [4, 13, 21, 33, 41] },
  { id: 6, resource_type: "Rice Seeds (kg)", quantity: 400, parish: "Laroo", allocation_date: "2026-07-05", distribution_status: "allocated", distributed_count: 0, beneficiaries: [] },
  { id: 7, resource_type: "Drip Irrigation Kits", quantity: 25, parish: "Bwama", allocation_date: "2026-06-25", distribution_status: "partially_distributed", distributed_count: 18, beneficiaries: [6, 15, 27, 35] },
  { id: 8, resource_type: "Hand Trowels", quantity: 200, parish: "Kanyumu", allocation_date: "2026-07-15", distribution_status: "allocated", distributed_count: 0, beneficiaries: [] },
  { id: 9, resource_type: "NPK Fertilizer (kg)", quantity: 350, parish: "Owino", allocation_date: "2026-07-01", distribution_status: "partially_distributed", distributed_count: 210, beneficiaries: [10, 18, 24, 36, 44, 48] },
  { id: 10, resource_type: "Cassava Cuttings", quantity: 600, parish: "Laroo", allocation_date: "2026-07-12", distribution_status: "allocated", distributed_count: 0, beneficiaries: [] },
];

const actions = ["request_submitted", "request_approved", "request_rejected", "request_completed", "resource_distributed", "citizen_verified", "status_check"];

export const mockAuditLogs: AuditLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  action: pick(actions),
  entity_type: pick(["service_request", "resource_allocation", "citizen"]),
  entity_id: Math.floor(Math.random() * 30) + 1,
  actor_phone: generatePhone(),
  actor_role: pick(["citizen", "parish_chief", "system"]),
  details: { notes: pick(["Auto-generated", "Verified by local council", "Urgent priority", "Pending review", ""]) },
  timestamp: randomDate(new Date("2026-06-01"), new Date("2026-07-23")),
}));

export const mockMetrics: Metrics = {
  total_requests: 30,
  active_citizens: 45,
  pending_approvals: 8,
  resources_distributed: 868,
  requests_by_type: [
    { type: "Agricultural Inputs", count: 12 },
    { type: "Birth Certificate", count: 8 },
    { type: "Land Permit", count: 6 },
    { type: "Infrastructure Report", count: 4 },
  ],
  monthly_trend: [
    { month: "Feb", requests: 18 },
    { month: "Mar", requests: 22 },
    { month: "Apr", requests: 15 },
    { month: "May", requests: 28 },
    { month: "Jun", requests: 25 },
    { month: "Jul", requests: 30 },
  ],
};

export const mockMonthlyReport: MonthlyReport = {
  parish: "Owino",
  month: 7,
  year: 2026,
  total_requests: 30,
  resolved_requests: 18,
  pending_requests: 12,
  resources_distributed: 868,
  citizens_active: 45,
  audit_logs: mockAuditLogs.slice(0, 10),
};
