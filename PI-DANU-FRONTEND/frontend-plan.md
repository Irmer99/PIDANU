# PI-DANU Frontend — Collaborator Guide
## React Admin Dashboard (UI-First Development)

### Your Role
Build the React admin dashboard **UI-first with mock data**. The backend developer will provide real API endpoints. You build against `mockData.ts` now, swap to real API calls when ready.

---

### Project Setup

```bash
# From PIDANU/ root
cd PI-DANU-FRONTEND

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts
npm install

# Core dependencies
npm install react-router-dom axios tailwindcss @tailwindcss/vite
npm install recharts zustand react-hot-toast lucide-react

# Dev dependencies
npm install -D @types/node
```

### Tailwind Theme (Ugandan-inspired)

| Token | Color | Use |
|-------|-------|-----|
| `--color-primary` | `#1B4332` | Forest green — sidebar, headers |
| `--color-secondary` | `#FFD700` | Gold — accent, buttons, highlights |
| `--color-accent` | `#D32F2F` | Red — alerts, urgent, reject |
| `--color-bg` | `#F5F5F5` | Page background |
| `--color-card` | `#FFFFFF` | Card surfaces |
| `--color-text` | `#212121` | Primary text |
| `--color-muted` | `#757575` | Secondary text |

Status badge colors:
- submitted → blue `#1976D2`
- under_review → orange `#F57C00`
- approved → green `#388E3C`
- rejected → red `#D32F2F`
- completed → gray `#616161`

---

### File Structure

```
src/
├── App.tsx                     # Router + providers
├── main.tsx                    # Entry point
├── index.css                   # Tailwind imports
├── vite-env.d.ts
│
├── api/
│   ├── client.ts               # Axios instance (base URL, interceptors)
│   ├── endpoints.ts            # API functions (mock or real)
│   └── mockData.ts             # All mock data
│
├── types/
│   └── index.ts                # TypeScript interfaces (Citizen, Request, etc.)
│
├── store/
│   └── appStore.ts             # Zustand global state
│
├── hooks/
│   ├── useRequests.ts          # Service request data + actions
│   ├── useCitizens.ts          # Citizen registry data
│   ├── useMetrics.ts           # Dashboard metrics
│   └── usePinAuth.ts           # PIN login logic
│
├── pages/
│   ├── LoginPage.tsx            # PIN entry screen
│   ├── DashboardPage.tsx        # Main dashboard
│   ├── RequestsPage.tsx         # Service requests management
│   ├── CitizensPage.tsx         # Citizen registry
│   ├── ResourcesPage.tsx        # Resource distribution
│   ├── ReportsPage.tsx          # Monthly reports & audit
│   └── SettingsPage.tsx         # Placeholder
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx        # Sidebar + Header + <Outlet/>
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Header.tsx           # Top bar with user info
│   │
│   ├── dashboard/
│   │   ├── MetricsCards.tsx      # 4 stat cards
│   │   ├── RecentRequests.tsx    # Latest 10 requests table
│   │   └── ParishOverview.tsx    # Pie chart by request type
│   │
│   ├── requests/
│   │   ├── RequestList.tsx       # Filterable request table
│   │   ├── RequestCard.tsx       # Detail slide-out panel
│   │   └── RequestActions.tsx    # Approve/Reject buttons
│   │
│   ├── citizens/
│   │   ├── CitizenSearch.tsx     # Search bar (NIN/phone)
│   │   ├── CitizenList.tsx       # Results table
│   │   └── CitizenProfile.tsx    # Full profile view
│   │
│   ├── resources/
│   │   ├── ResourceList.tsx      # Allocation table
│   │   └── DistributionForm.tsx  # Log distribution modal
│   │
│   ├── reports/
│   │   ├── MonthlyReport.tsx     # Charts + summary
│   │   └── AuditLog.tsx          # Audit trail table
│   │
│   └── shared/
│       ├── StatusBadge.tsx       # Colored status pill
│       ├── LoadingSpinner.tsx    # Loading indicator
│       ├── EmptyState.tsx        # No data message
│       ├── SearchInput.tsx       # Reusable search field
│       ├── Modal.tsx             # Reusable modal dialog
│       └── ConfirmDialog.tsx     # Yes/No confirmation
```

---

### TypeScript Types

```typescript
// types/index.ts
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
```

---

### Mock Data

All mock data lives in `api/mockData.ts`. This file exports:
- `mockCitizens` — 50 citizens across 3 parishes
- `mockRequests` — 30 service requests (various types, statuses)
- `mockResources` — 10 resource allocations
- `mockAuditLogs` — 20 audit entries
- `mockMetrics` — Dashboard metrics aggregate
- `mockMonthlyReport` — One month's report data

The mock data follows the exact shapes of the TypeScript types above. When the backend is ready, replace `api/mockData.ts` imports with `api/endpoints.ts` calls.

---

### API Client Layer

```typescript
// api/client.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pidanu_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pidanu_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

```typescript
// api/endpoints.ts
import api from "./client";
import {
  mockCitizens, mockRequests, mockResources,
  mockAuditLogs, mockMetrics, mockMonthlyReport
} from "./mockData";
import type { Citizen, ServiceRequest, ResourceAllocation, AuditLog, Metrics, MonthlyReport, User } from "../types";

const USE_MOCK = true; // Toggle to false when backend is ready

export async function login(pin: string): Promise<{ token: string; user: User }> {
  if (USE_MOCK) {
    if (pin === "1234") return { token: "mock-jwt-token", user: { name: "Parish Chief Owino", parish: "Owino" } };
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

export async function getRequests(params?: { status?: string; type?: string; page?: number }): Promise<{ data: ServiceRequest[]; total: number }> {
  if (USE_MOCK) {
    let filtered = [...mockRequests];
    if (params?.status && params.status !== "all") filtered = filtered.filter(r => r.status === params.status);
    if (params?.type && params.type !== "all") filtered = filtered.filter(r => r.request_type === params.type);
    return { data: filtered, total: filtered.length };
  }
  const { data } = await api.get("/api/admin/requests", { params });
  return data;
}

export async function getRequest(id: number): Promise<ServiceRequest> {
  if (USE_MOCK) return mockRequests.find(r => r.id === id)!;
  const { data } = await api.get(`/api/admin/requests/${id}`);
  return data.data;
}

export async function actOnRequest(id: number, action: "approve" | "reject", notes: string): Promise<ServiceRequest> {
  if (USE_MOCK) {
    const req = mockRequests.find(r => r.id === id)!;
    req.status = action === "approve" ? "approved" : "rejected";
    req.parish_chief_notes = notes;
    req.updated_at = new Date().toISOString();
    return req;
  }
  const { data } = await api.post(`/api/admin/requests/${id}/action`, { action, notes });
  return data.data;
}

export async function getCitizens(search?: string): Promise<{ data: Citizen[]; total: number }> {
  if (USE_MOCK) {
    let filtered = [...mockCitizens];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => c.nin.includes(q) || c.phone_number.includes(q) || c.full_name.toLowerCase().includes(q));
    }
    return { data: filtered, total: filtered.length };
  }
  const { data } = await api.get("/api/admin/citizens", { params: { search } });
  return data;
}

export async function getCitizen(nin: string): Promise<{ citizen: Citizen; requests: ServiceRequest[]; resources: ResourceAllocation[] }> {
  if (USE_MOCK) {
    const citizen = mockCitizens.find(c => c.nin === nin)!;
    const requests = mockRequests.filter(r => r.citizen_nin === nin);
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

export async function distributeResource(resourceId: number, quantity: number, beneficiaryIds: number[]): Promise<ResourceAllocation> {
  if (USE_MOCK) {
    const res = mockResources.find(r => r.id === resourceId)!;
    res.distributed_count += quantity;
    res.beneficiaries.push(...beneficiaryIds);
    if (res.distributed_count >= res.quantity) res.distribution_status = "fully_distributed";
    else res.distribution_status = "partially_distributed";
    return res;
  }
  const { data } = await api.post("/api/admin/resources/distribute", { resource_id: resourceId, quantity, beneficiary_ids: beneficiaryIds });
  return data.data;
}

export async function getAuditLogs(page?: number): Promise<{ data: AuditLog[]; total: number }> {
  if (USE_MOCK) return { data: mockAuditLogs, total: mockAuditLogs.length };
  const { data } = await api.get("/api/admin/audit", { params: { page } });
  return data;
}

export async function getMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
  if (USE_MOCK) return mockMonthlyReport;
  const { data } = await api.get("/api/admin/reports/monthly", { params: { month, year } });
  return data.data;
}
```

---

### State Management (Zustand)

```typescript
// store/appStore.ts
import { create } from "zustand";
import type { User } from "../types";

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Selected items
  selectedRequestId: number | null;
  setSelectedRequestId: (id: number | null) => void;
  selectedCitizenNin: string | null;
  setSelectedCitizenNin: (nin: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: !!localStorage.getItem("pidanu_token"),
  user: JSON.parse(localStorage.getItem("pidanu_user") || "null"),
  login: async (pin: string) => {
    try {
      const { login: apiLogin } = await import("../api/endpoints");
      const result = await apiLogin(pin);
      localStorage.setItem("pidanu_token", result.token);
      localStorage.setItem("pidanu_user", JSON.stringify(result.user));
      set({ isAuthenticated: true, user: result.user });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem("pidanu_token");
    localStorage.removeItem("pidanu_user");
    set({ isAuthenticated: false, user: null });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  selectedRequestId: null,
  setSelectedRequestId: (id) => set({ selectedRequestId: id }),
  selectedCitizenNin: null,
  setSelectedCitizenNin: (nin) => set({ selectedCitizenNin: nin }),
}));
```

---

### Page Specifications

#### LoginPage (`/login`)
- Centered card with PI-DANU title
- 4-digit PIN pad (buttons 0-9, clear, submit)
- Hardcoded demo PIN: `1234`
- On success → navigate to `/dashboard`
- On failure → toast error
- No sidebar/header on this page

#### DashboardPage (`/dashboard`)
- **MetricsCards**: 4 cards in a row
  - Total Requests (number + "X this week")
  - Active Citizens (number + parish name)
  - Pending Approvals (number, red highlight if > 5)
  - Resources Distributed (number + "this month")
- **RecentRequests**: Table of last 10 requests (code, citizen, type, status, date)
- **ParishOverview**: Pie chart of request types (Recharts)

#### RequestsPage (`/requests`)
- **Filter bar**: Status dropdown + Type dropdown + "All" option
- **RequestList**: Full table with columns
  - Code, Citizen (NIN + Name), Type (badge), Status (badge), Date, Actions
- Click row → **RequestCard** slides in from right
  - Full request details
  - Chief notes textarea
  - **RequestActions**: Approve (green) / Reject (red) buttons
  - Toast on action

#### CitizensPage (`/citizens`)
- **CitizenSearch**: Search input (placeholder: "Search by NIN, phone, or name")
- **CitizenList**: Results table
  - NIN, Name, Phone, Parish, Status (verified/pending/flagged), Created
- Click row → **CitizenProfile** (full page or modal)
  - Personal info section
  - Service request history table
  - Resource distribution history
  - Last check-in date

#### ResourcesPage (`/resources`)
- **ResourceList**: Table
  - Type, Quantity, Parish, Status, Date, Distributed/Total progress bar
- "Log Distribution" button → **DistributionForm** modal
  - Select resource (dropdown)
  - Enter quantity (number input)
  - Select beneficiaries (multi-select citizens)
  - Confirm button
- Distribution history log below

#### ReportsPage (`/reports`)
- Month/Year selector (dropdowns)
- **MonthlyReport**:
  - Summary cards (Total, Resolved, Pending, Active Citizens)
  - Bar chart: Requests by type (Recharts)
  - Line chart: Monthly trend (last 6 months)
- **AuditLog**: Table of all actions
  - Action, Actor (phone + role), Entity, Timestamp
- Export CSV button (placeholder)

#### SettingsPage (`/settings`)
- Placeholder page for future settings
- "Coming soon" message

---

### Component Specs

#### AppLayout
- Wraps all pages except Login
- Contains Sidebar (left, collapsible) + Header (top) + Content area (`<Outlet/>`)
- On mobile: sidebar is overlay, toggled by hamburger icon in header

#### Sidebar
- PI-DANU logo/title at top
- Nav items with lucide-react icons:
  - Dashboard (LayoutDashboard)
  - Requests (ClipboardList)
  - Citizens (Users)
  - Resources (Package)
  - Reports (BarChart3)
  - Settings (Settings)
- Active item highlighted with primary color
- Collapse/expand toggle

#### Header
- Hamburger menu (mobile only)
- Page title (current route name)
- User avatar/name + parish badge
- Logout button

#### StatusBadge
- Props: `status: string`, `size?: "sm" | "md"`
- Renders colored pill with status text
- Color maps to status (see design system above)

#### Modal
- Props: `isOpen`, `onClose`, `title`, `children`
- Centered overlay with backdrop
- Close on backdrop click or X button
- Smooth fade-in animation

#### ConfirmDialog
- Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`
- Yes/No buttons (green/red)
- Used for approve/reject confirmations

---

### Routing

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/appStore";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RequestsPage from "./pages/RequestsPage";
import CitizensPage from "./pages/CitizensPage";
import ResourcesPage from "./pages/ResourcesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/citizens" element={<CitizensPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Task Checklist

#### Phase 1 — Foundation
- [ ] Vite + React + TS project init
- [ ] Tailwind CSS with Ugandan theme
- [ ] `types/index.ts` — all TypeScript interfaces
- [ ] `api/mockData.ts` — 50 citizens, 30 requests, resources, metrics, audit logs
- [ ] `api/client.ts` — Axios instance
- [ ] `api/endpoints.ts` — mock-first API functions
- [ ] `store/appStore.ts` — Zustand store
- [ ] `App.tsx` — Router with protected routes
- [ ] `components/layout/AppLayout.tsx`
- [ ] `components/layout/Sidebar.tsx`
- [ ] `components/layout/Header.tsx`
- [ ] `pages/LoginPage.tsx` — PIN pad

#### Phase 2 — Dashboard & Requests
- [ ] `components/shared/StatusBadge.tsx`
- [ ] `components/shared/LoadingSpinner.tsx`
- [ ] `components/shared/EmptyState.tsx`
- [ ] `components/shared/Modal.tsx`
- [ ] `components/shared/ConfirmDialog.tsx`
- [ ] `components/shared/SearchInput.tsx`
- [ ] `hooks/useMetrics.ts`
- [ ] `hooks/useRequests.ts`
- [ ] `components/dashboard/MetricsCards.tsx`
- [ ] `components/dashboard/RecentRequests.tsx`
- [ ] `components/dashboard/ParishOverview.tsx`
- [ ] `pages/DashboardPage.tsx`
- [ ] `components/requests/RequestList.tsx`
- [ ] `components/requests/RequestCard.tsx`
- [ ] `components/requests/RequestActions.tsx`
- [ ] `pages/RequestsPage.tsx`

#### Phase 3 — Citizens & Resources
- [ ] `hooks/useCitizens.ts`
- [ ] `components/citizens/CitizenSearch.tsx`
- [ ] `components/citizens/CitizenList.tsx`
- [ ] `components/citizens/CitizenProfile.tsx`
- [ ] `pages/CitizensPage.tsx`
- [ ] `components/resources/ResourceList.tsx`
- [ ] `components/resources/DistributionForm.tsx`
- [ ] `pages/ResourcesPage.tsx`

#### Phase 4 — Reports & Polish
- [ ] `components/reports/MonthlyReport.tsx`
- [ ] `components/reports/AuditLog.tsx`
- [ ] `pages/ReportsPage.tsx`
- [ ] `pages/SettingsPage.tsx`
- [ ] Toast notifications (react-hot-toast)
- [ ] Mobile responsive (sidebar overlay, card stacking)
- [ ] Error boundary
- [ ] Loading skeletons

#### Phase 5 — API Swap
- [ ] Set `USE_MOCK = false` in `api/endpoints.ts`
- [ ] Configure `VITE_API_BASE_URL` to backend
- [ ] Test all flows with real API
- [ ] Handle error states from backend

---

### Getting Help

- **Backend API not ready?** → `USE_MOCK = true` in `api/endpoints.ts`
- **Need a component pattern?** → Check `components/shared/` first
- **API contract unclear?** → See `implementationplan.md` Section 5
- **Stuck?** → Ask in team channel
