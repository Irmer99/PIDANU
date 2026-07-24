# PI-DANU Implementation Plan
## Decentralised Governance & Citizen Inclusion in Public Service Delivery

### Overview
A lightweight hackathon MVP enabling Ugandan citizens to access public services via USSD/SMS/Voice, with a React admin dashboard for Parish Chiefs, backed by a FastAPI + PostgreSQL backend with offline-first capabilities.

---

### Team & Responsibilities

| Role       | Person | Responsibility |
|------------|--------|----------------|
| Frontend   | You    | React admin dashboard, UI components, mock data layer |
| Backend    | Collab | FastAPI API, USSD/SMS handlers, DB, Sunbird AI, deployment |

### Communication Contract
- API contract defined in Section 5 below
- Both teams use OpenAPI/Swagger (`/docs`) for endpoint reference
- Backend provides mock JSON responses for frontend consumption during development
- Frontend builds UI-first against `mockData.ts`; swap to real API when ready
- Shared `#pidanu` channel for blockers and API changes

---

### Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Zustand |
| Backend     | Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic |
| Database    | PostgreSQL 15 |
| USSD/SMS    | Africa's Talking (sandbox) |
| Voice AI    | Sunbird AI (STT, TTS, Translation, Chat) |
| Deployment  | Render.com (backend + DB), Vercel (frontend) |
| Offline     | Ditto SDK (basic integration) |

---

### Build Phases

#### Phase 1: Foundation (Day 1 Morning)
**Backend (Collab):**
- FastAPI project setup with CORS, health check at `GET /health`
- SQLAlchemy models: `Citizen`, `ServiceRequest`, `ResourceAllocation`, `AuditLog`, `MonthlySnapshot`, `AdminUser`
- PostgreSQL database + Alembic migrations
- Mock NIN verification service (`nin_service.py`)
- Seed data script: 50 citizens, 30 requests, resource allocations, audit logs

**Frontend (You):**
- Vite + React + TypeScript scaffolding
- Tailwind CSS with custom theme (Ugandan flag colors)
- Project structure: `pages/`, `components/`, `api/`, `hooks/`, `store/`
- Mock data layer (`api/mockData.ts` matching API response shapes)
- React Router setup with all routes
- Layout shell: `AppLayout`, `Sidebar`, `Header`

#### Phase 2: Core Features (Day 1 Afternoon - Day 2)
**Backend (Collab):**
- USSD webhook handler (`POST /api/ussd/callback`) — state machine for menu navigation
- SMS keyword parser (`POST /api/sms/inbound`) — PDM STATUS, HELP, etc.
- Admin REST API (`/api/admin/*`) — CRUD for requests, citizens, resources
- Rate limiter middleware — per-NIN sliding window
- Notification service — SMS callbacks on status changes

**Frontend (You):**
- Dashboard page — MetricsCards, RecentRequests table, ParishOverview pie chart
- Request Queue page — list with filters, approve/reject actions with notes
- Citizen Registry page — search by NIN/phone, profile view with history
- Resource Distribution page — list allocations, log distributions
- Monthly Reports page — charts, data tables, audit log

#### Phase 3: Integrations (Day 2 Afternoon - Day 3)
**Backend (Collab):**
- Sunbird AI integration — STT → Chat → TTS pipeline for voice advisory
- Voice advisory endpoint (`POST /api/voice/advice`)
- Monthly audit report generator (`GET /api/admin/reports/monthly`)
- Ditto sync endpoints (`GET /api/sync/status`, `POST /api/sync/push`)
- PIN-based admin auth (`POST /api/auth/pin`)

**Frontend (You):**
- API client layer — replace mock calls with real fetch/axios
- PIN login page — 4-digit entry, JWT storage
- Sync status indicator — green/red dot for online/offline
- Toast notifications via react-hot-toast
- Voice demo page — for testing Sunbird integration
- Mobile responsive layout polish

#### Phase 4: Polish & Demo (Day 3-4)
**Both:**
- Error handling, loading states, empty states
- Demo script walkthrough
- README documentation
- Render.com deployment (backend)
- Vercel deployment (frontend)
- Final testing with AT simulator + Sunbird sandbox

---

### Database Schema

```sql
CREATE TABLE citizens (
    id SERIAL PRIMARY KEY,
    nin VARCHAR(13) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    parish VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'eng',
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending','verified','flagged')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_check_in TIMESTAMP
);

CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    request_code VARCHAR(20) UNIQUE NOT NULL,
    citizen_id INTEGER REFERENCES citizens(id),
    request_type VARCHAR(30) NOT NULL
        CHECK (request_type IN ('birth_cert','land_permit','agri_inputs','infra_report')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'submitted'
        CHECK (status IN ('submitted','under_review','approved','rejected','completed')),
    priority VARCHAR(10) DEFAULT 'medium'
        CHECK (priority IN ('low','medium','high','urgent')),
    parish_chief_notes TEXT,
    submitted_via VARCHAR(10) DEFAULT 'ussd'
        CHECK (submitted_via IN ('ussd','sms','admin','voice')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE resource_allocations (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    parish VARCHAR(50) NOT NULL,
    allocation_date DATE NOT NULL,
    distribution_status VARCHAR(20) DEFAULT 'allocated'
        CHECK (distribution_status IN ('allocated','partially_distributed','fully_distributed')),
    distributed_count INTEGER DEFAULT 0,
    beneficiaries JSONB DEFAULT '[]',
    audit_hash VARCHAR(64)
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER,
    actor_phone VARCHAR(20),
    actor_role VARCHAR(20) DEFAULT 'citizen',
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE monthly_snapshots (
    id SERIAL PRIMARY KEY,
    parish VARCHAR(50) NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_requests INTEGER DEFAULT 0,
    resolved_requests INTEGER DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    resources_distributed INTEGER DEFAULT 0,
    citizens_active INTEGER DEFAULT 0,
    report_data JSONB DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    pin_hash VARCHAR(128) NOT NULL,
    name VARCHAR(100) NOT NULL,
    parish VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'parish_chief',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### API Contract

#### Auth
| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/pin` | POST | `{ "pin": "1234" }` | `{ "token": "jwt...", "user": { "name": "...", "parish": "..." } }` |

#### USSD/SMS (Africa's Talking Webhooks)
| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/ussd/callback` | POST | Form: `sessionId, serviceCode, phoneNumber, text` | Plain text: `CON ...` or `END ...` |
| `/api/sms/inbound` | POST | Form: `from, to, text, date` | `{ "status": "ok" }` |

#### Admin REST API
| Endpoint | Method | Query/Body | Response |
|----------|--------|-----------|----------|
| `/api/admin/metrics` | GET | — | `{ "data": { total_requests, active_citizens, pending_approvals, resources_distributed, requests_by_type, monthly_trend } }` |
| `/api/admin/requests` | GET | `?status=&type=&page=&limit=` | `{ "data": Request[], "total": int }` |
| `/api/admin/requests/:id` | GET | — | `{ "data": Request }` |
| `/api/admin/requests/:id/action` | POST | `{ "action": "approve"\|"reject", "notes": "..." }` | `{ "data": Request }` |
| `/api/admin/citizens` | GET | `?search=&page=&limit=` | `{ "data": Citizen[], "total": int }` |
| `/api/admin/citizens/:nin` | GET | — | `{ "data": Citizen, "requests": [], "resources": [] }` |
| `/api/admin/resources` | GET | `?parish=` | `{ "data": Resource[] }` |
| `/api/admin/resources/distribute` | POST | `{ "resource_id": int, "quantity": int, "beneficiary_ids": [] }` | `{ "data": Resource }` |
| `/api/admin/reports/monthly` | GET | `?month=&year=&parish=` | `{ "data": { summary, charts, audit_log } }` |
| `/api/admin/audit` | GET | `?page=&limit=` | `{ "data": AuditLog[], "total": int }` |

#### Voice (Sunbird AI)
| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/voice/advice` | POST | `{ "audio_base64": "...", "language": "lug" }` | `{ "transcription": "...", "advice": "...", "audio_url": "..." }` |
| `/api/voice/tts` | POST | `{ "text": "...", "language": "lug" }` | `{ "audio_url": "..." }` |

#### Sync (Ditto)
| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/sync/status` | GET | — | `{ "online": bool, "pending_sync": int, "last_sync": "..." }` |
| `/api/sync/push` | POST | `{ "changes": [...] }` | `{ "status": "ok", "synced": int }` |

---

### Rate Limiting

```python
RATE_LIMITS = {
    "ussd_session":     {"max": 10,  "window": 3600},   # 10 USSD sessions/hour per phone
    "sms_request":      {"max": 5,   "window": 3600},   # 5 SMS requests/hour per phone
    "service_apply":    {"max": 3,   "window": 86400},  # 3 applications/day per NIN
    "voice_advice":     {"max": 10,  "window": 3600},   # 10 voice queries/hour per phone
    "admin_action":     {"max": 100, "window": 3600},   # 100 admin actions/hour
}
```

---

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/pidanu
AT_API_KEY=your_africastalking_sandbox_key
AT_USERNAME=sandbox
AT_ENVIRONMENT=sandbox
SUNBIRD_API_KEY=your_sunbird_api_key
SUNBIRD_BASE_URL=https://api.sunbird.ai
NIN_MOCK_ENABLED=true
RATE_LIMIT_ENABLED=true
SECRET_KEY=your-secret-key
APP_ENV=development

# Frontend (VITE_ prefixed)
VITE_API_BASE_URL=http://localhost:8000
```

---

### Deployment

1. **Backend** → Render.com
   - Connect GitHub repo
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add PostgreSQL addon

2. **Frontend** → Vercel
   - Connect GitHub repo
   - Framework: Vite
   - Build: `npm run build`
   - Output: `dist/`
   - Set `VITE_API_BASE_URL` to Render backend URL

3. **Africa's Talking** → Sandbox
   - Create USSD channel with callback URL
   - Test via AT simulator

4. **Sunbird AI** → Sandbox API key
   - Test TTS/STT endpoints via curl first

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AT sandbox downtime | Test with mock USSD payloads via curl/Postman |
| Sunbird AI rate limits | Cache TTS responses, mock for demo |
| PostgreSQL issues | SQLite fallback for local dev |
| Ditto complexity | Mock offline state for demo |
| Render cold starts | Keep-alive pings, demo with warm server |
