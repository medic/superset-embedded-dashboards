# PRD: CHA Dashboard Access Portal

## 1. Executive Summary

**Problem Statement**: ~10,000 Community Health Assistants (CHAs) need access to Superset dashboards, but provisioning individual Superset accounts is operationally infeasible and misaligned with existing CHT-based authentication flows.

**Proposed Solution**: A lightweight Next.js application that authenticates CHAs against CouchDB (via CHT's `_session` API — the same model used by [cht-user-management](https://github.com/medic/cht-user-management)), then renders embedded Superset dashboards filtered by the CHA's assigned Community Health Unit (`facility_id`). No Superset user accounts required.

**Success Criteria**:

| KPI | Target |
|-----|--------|
| CHAs able to access dashboards without Superset accounts | 100% |
| Login-to-dashboard render time | < 5 seconds |
| Data isolation accuracy (no cross-CHU data leakage) | 100% |
| Adoption rate (CHAs accessing dashboards weekly) | > 60% within 1 month |
| Uptime | 99.5% |

---

## 2. User Experience & Functionality

### User Personas

| Persona | Description | Need |
|---------|-------------|------|
| **CHA** | Field health worker assigned to 1+ CHUs, uses mobile/tablet, moderate tech literacy | View facility-scoped dashboards with existing credentials |
| **Supervisor** | Oversees multiple CHAs/CHUs | View dashboards scoped to their administrative area |
| **System Admin** | Manages deployment and configuration | Configure dashboard mappings, monitor access |

### User Stories

**US-1: CHA Login**
> As a CHA, I want to log in with my existing CHT username and password so that I don't need a separate Superset account.

**Acceptance Criteria:**
- Login form accepts username and password
- Authentication validates against a single configured CouchDB `_session` endpoint
- Failed login shows clear error message
- Session persists via signed JWT cookie (`httpOnly`, `secure`)
- Session expires after 24 hours of inactivity

**US-2: Dashboard Viewing**
> As a CHA, I want to see dashboards filtered to my assigned facilities so that I only see relevant data.

**Acceptance Criteria:**
- After login, user sees a list of available dashboards (hardcoded config)
- Clicking a dashboard embeds it via Superset Embedded SDK
- Dashboard data is automatically filtered by user's `facility_id`
- RLS clause is injected server-side — user cannot modify filter scope
- Dashboard loads within 5 seconds on a 3G connection

**US-3: Multi-Dashboard Navigation**
> As a CHA, I want to switch between available dashboards without re-authenticating.

**Acceptance Criteria:**
- Dashboard list is always accessible via sidebar or top nav
- Switching dashboards generates a new guest token with the same RLS rules
- No full page reload required

### Non-Goals (Out of Scope)
- Superset user account provisioning or management
- Building or modifying dashboards within Superset
- Offline dashboard access
- Dashboard export (PDF/CSV) from within the portal
- Role-based dashboard visibility (all CHAs see the same dashboard set in MVP)
- Multi-domain CHT instance support
- Admin UI for dashboard configuration

---

## 3. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CHA's Browser                        │
│  ┌──────────────┐    ┌────────────────────────────────┐ │
│  │  Login Form   │    │  Dashboard Portal (Next.js)    │ │
│  │               │    │  ┌──────────────────────────┐  │ │
│  │  username     │    │  │ Superset Embedded iframe │  │ │
│  │  password     │    │  │ (@superset-ui/embedded)  │  │ │
│  │               │    │  └──────────────────────────┘  │ │
│  └──────┬───────┘    └──────────┬─────────────────────┘ │
└─────────┼───────────────────────┼───────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Backend (API Routes)                │
│                                                         │
│  POST /api/auth/login     → CouchDB _session            │
│  GET  /api/auth/session   → Validate JWT, return user   │
│  POST /api/auth/logout    → Clear cookie                │
│  POST /api/superset/token → Generate guest token        │
│  GET  /api/dashboards     → Return dashboard config     │
└────────┬──────────────────────────┬─────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐    ┌───────────────────────────────┐
│   CHT / CouchDB  │    │     Apache Superset           │
│                   │    │                               │
│  POST /_session   │    │  POST /api/v1/security/login  │
│  GET  /medic/     │    │  POST /api/v1/security/       │
│   org.couchdb.    │    │        guest_token/           │
│   user:{username} │    │                               │
└──────────────────┘    └───────────────────────────────┘
```

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 14** (App Router) | SSR, API routes, React — single deployable |
| Auth | **JWT cookies** (httpOnly, secure, signed) | Matches cht-user-management pattern |
| Embedding | **@superset-ui/embedded-sdk** | Official Superset embedding library |
| Styling | **Tailwind CSS** | Minimal UI, fast to build |
| Runtime | **Node.js 20 LTS** | K8s compatible, team familiarity |
| Deployment | **Kubernetes** | Existing infrastructure |

### Integration Points

**1. CHT/CouchDB Authentication (single instance)**
- `POST https://{CHT_DOMAIN}/_session` — authenticate with username/password
- `GET https://{CHT_DOMAIN}/medic/org.couchdb.user:{username}` — fetch user doc containing `facility_id` and `roles`
- Extract `facility_id` array from user document — this maps directly to the Superset `facility_id` filter column

**2. Superset Guest Token Generation**
- Backend authenticates to Superset via `POST /api/v1/security/login` (service account)
- Generates guest token via `POST /api/v1/security/guest_token/` with:
  - `resources`: list of allowed dashboard IDs (from hardcoded config)
  - `rls`: `[{ "clause": "facility_id IN ('fac-001', 'fac-002')" }]` derived from user's `facility_id`
- Token TTL: 5 minutes (SDK auto-refreshes via `fetchGuestToken` callback)

**3. Dashboard Configuration**
- Dashboard IDs and display names stored in environment variable or config file
- Example: `DASHBOARDS=[{"id":"uuid-1","name":"CHU Performance"},{"id":"uuid-2","name":"Monthly Summary"}]`

### Key Data Flow: Login → Dashboard

```
1. CHA submits credentials (username, password)
2. Backend POST to CouchDB /_session → receives AuthSession cookie
3. Backend GET user doc → extracts facility_id[], roles[]
4. Backend creates JWT with { username, facility_ids } → sets httpOnly cookie
5. Frontend redirects to /dashboards
6. User clicks a dashboard
7. Frontend calls POST /api/superset/token with dashboard_id
8. Backend validates JWT cookie, reads facility_ids
9. Backend authenticates to Superset (service account)
10. Backend requests guest_token with RLS clause: facility_id IN (facility_ids)
11. Frontend receives token, passes to embedDashboard({ fetchGuestToken: () => token })
12. Superset iframe renders with filtered data
```

### Security & Privacy

| Concern | Mitigation |
|---------|------------|
| Cross-CHU data leakage | RLS clauses generated server-side from authenticated user's `facility_id`; user cannot modify |
| Guest token theft | 5-min TTL, tokens scoped to specific dashboards + RLS rules |
| Superset service account exposure | Credentials stored as K8s secrets, never sent to client |
| Session hijacking | JWT in `httpOnly`/`secure`/`signed` cookie; HTTPS only |
| SQL injection in RLS | Validate `facility_id` values against expected format before interpolation |
| CORS | Superset configured to accept requests only from portal domain |

### Environment Variables

```
CHT_DOMAIN=https://cht.example.com
SUPERSET_URL=https://superset.example.com
SUPERSET_USERNAME=embed-service-account
SUPERSET_PASSWORD=<from-k8s-secret>
COOKIE_SECRET=<from-k8s-secret>
DASHBOARDS=[{"id":"uuid-1","name":"CHU Performance"},{"id":"uuid-2","name":"Monthly Summary"}]
```

---

## 4. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Misconfigured RLS exposes cross-CHU data | **Critical** | Medium | Integration tests that verify RLS filtering; audit logging of token generation |
| Guest token endpoint abuse | High | Low | Rate limiting on `/api/superset/token`; require valid session |
| CouchDB auth latency impacts login | Medium | Low | Timeout with clear error message |
| Superset service account credentials leak | Critical | Low | K8s secrets, rotate quarterly, least-privilege role |
| `facility_id` field missing from user doc | Medium | Medium | Graceful error: "No facilities assigned — contact admin" |
| Superset iframe rendering issues on mobile | Medium | Medium | Test on target devices; responsive container styling |

---

## 5. Phased Rollout

### MVP 
- Login with CHT credentials (single domain)
- Dashboard list page (hardcoded config)
- Embedded dashboard with RLS filtering by `facility_id`
- JWT session management
- K8s deployment manifests (Dockerfile + Helm chart or plain manifests)
- Basic error handling and loading states
- Unit + integration tests for auth and token generation

### v1.1 
- Dashboard access logging/audit trail
- Role-based dashboard visibility (supervisors see different dashboards)
- Token generation caching (reduce Superset API calls)
- Admin UI for dashboard configuration

### v2.0
- Offline-capable dashboard snapshots
- Dashboard export (PDF/CSV)
- User activity analytics
- SSO integration if CHT moves to OIDC

---

## 6. Testing Strategy

| Test Type | Scope | Tool |
|-----------|-------|------|
| Unit | JWT generation, RLS clause builder, auth flow | Jest |
| Integration | CouchDB auth round-trip, Superset token generation | Jest + test containers |
| E2E | Login → dashboard render → verify filtered data | Playwright |
| Security | RLS bypass attempts, token tampering, expired sessions | Manual + automated |

**Critical test case**: Log in as CHA assigned to CHU A, verify dashboard shows zero rows from CHU B.

---

## 7. Design Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `facility_id` usable as Superset filter column | **Yes, direct mapping** | No lookup table needed |
| Dashboard configuration | **Hardcoded in config** | Simplest for MVP, admin UI in v1.1 |
| CHT instance | **Single domain** | All CHAs use one instance, no domain selector needed |
