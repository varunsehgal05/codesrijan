# CODESRIJAN 1.0 — MASTER QUALITY ASSURANCE & VERIFICATION TEST PLAN

**Document Version:** 1.0.0-RELEASE  
**Authoritative Platform:** CodeSrijan 1.0 (Student-Run Hackathon & Tournament Management Platform)  
**Production Frontend:** [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Production Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  
**Git Remote:** `https://github.com/varunsehgal05/codesrijan.git`  
**Operating Budget:** **$0.00 / month** (MongoDB Atlas M0 Free + Render Web Service Free + Vercel Hobby + Google Apps Script Relay v5)  
**Current Authoritative Release Gate:** `74/74 Passing Tests across 8 Test Suites, 68 Registered Routes, Clean Working Tree`  

---

## 1. PURPOSE, SCOPE & EXECUTION ARCHITECTURE

This Master Test Plan establishes the exhaustive quality assurance framework for CodeSrijan 1.0. Every student-facing, administrator-facing, and public module is decomposed into deterministic, verifiable test cases with stable identifiers.

### Testing Principles:
1. **Empirical Evidence First:** No feature or endpoint is declared operational without tangible proof (exit code 0, status 200/401/403, browser console log, or visual artifact).
2. **Strict RBAC & Tenant Isolation:** Multi-tenant boundaries are strictly guarded across students, judges, mentors, and administrators.
3. **Zero Data Destruction:** Production testing preserves all genuine participant records, active competition schedules, and financial audit trails. QA mutations utilize isolated test accounts.
4. **$0.00/Month Budget Invariant:** Infrastructure boundaries (75MB GridFS storage ledger, 100 emails/day Apps Script quota, 512MB RAM container ceiling) are enforced and verified against unbounded growth.

---

## 2. DISCOVERED ROUTE INVENTORY (ALL 68 ROUTES)

The platform implements 68 registered route files under `src/routes/` orchestrated by `@tanstack/react-router` and compiled via Vite + Nitro SSR:

```
src/routes/
├── __root.tsx (Root Layout & Global HUD)
├── index.tsx (Landing Page)
├── about.tsx, announcements.tsx, sponsors.tsx, gallery.tsx, faq.tsx, leaderboard.tsx
├── code-of-conduct.tsx, privacy-policy.tsx, community.tsx, highlights.tsx, timeline.tsx
├── host-event.tsx, certificates.tsx
├── login.tsx, register.tsx, admin-login.tsx
├── auth.otp.tsx, auth.forgot-password.tsx, auth.reset-password.tsx
├── dashboard.tsx, profile.tsx, profile-overview.tsx, settings.tsx, notifications.tsx
├── team.tsx, workspace.tsx, recruitment.tsx, chat.tsx, support.tsx, payment.tsx
├── challenge.tsx, problems.tsx, evaluations.tsx, mentor.tsx, mentor-command-center.tsx
├── ai-assistant.tsx, invite.$token.tsx, hackathons.index.tsx, hackathons.$id.register.tsx
└── admin.tsx (Admin Layout & Clearance Guard)
    ├── admin.index.tsx (Admin Executive HUD)
    ├── admin.health.tsx (Platform Health & Telemetry Dashboard)
    ├── admin.operations.tsx (Hackathon Operations Hub & CSV Export)
    ├── admin.payments.tsx (Payment Review Queue & UTR Verification)
    ├── admin.hackathons.tsx, admin.hackathons.create.tsx, admin.hackathons.$id.tsx
    ├── admin.users.tsx, admin.teams.tsx
    ├── admin.problems.tsx, admin.problems.create.tsx, admin.problems.$id.tsx
    ├── admin.submissions.tsx, admin.judges.tsx, admin.evaluations.tsx, admin.mentors.tsx
    ├── admin.announcements.tsx, admin.leaderboard.tsx, admin.certificates.tsx
    ├── admin.recruitment.tsx, admin.support.tsx, admin.sponsors.tsx, admin.logs.tsx
    ├── admin.settings.tsx, admin.schedule.tsx, admin.analytics.tsx, admin.gallery.tsx
```

---

## 3. MASTER STABLE TEST MATRIX (CATEGORIZED BY DOMAIN)

| Test ID | Route / Domain | Target Control / Feature | Expected Behavior | Category | Priority |
|---|---|---|---|---|---|
| **GUEST-001** | `/` | Hero CTAs & Live Badges | Returns HTTP 200, renders dynamic event status, smooth scrolling. | Public UI | High |
| **GUEST-002** | `/hackathons` | Public Tournament Directory | Displays exactly 2 active public tournaments; hides archived/drafts. | Catalog | High |
| **GUEST-003** | `/certificates` | Public Certificate Verification | Verifies certificate token; blocks tampering; returns verification status. | Security | Medium |
| **AUTH-001** | `/login` | Password Authentication | Authenticates active user, sets JWT, routes admin to `/admin`, student to `/dashboard`. | Auth | Critical |
| **AUTH-002** | `/login` | Invalid Password Challenge | Returns HTTP 401 with descriptive error without leaking account hash. | Security | High |
| **AUTH-003** | `/register` | Student Registration & Validation | Validates email, password strength, enforces unique accounts. | Auth | Critical |
| **AUTH-004** | `/auth/otp` | Email OTP Verification | Verifies 6-digit code, enforces 60s resend cooldown, rejects replay. | Security | High |
| **AUTH-005** | `/auth/forgot-password` | Password Reset Request | Sends reset token via Apps Script relay, rate-limits abuse. | Security | High |
| **STUDENT-DASH-001** | `/dashboard` | Student Command Center | Loads authenticated profile, enrolled events, team status, readiness checklist. | Functional | Critical |
| **STUDENT-TEAM-001** | `/team` | Squad Creation & Roster | Creates new squad, verifies leader assignment, prevents duplicate teams. | Functional | Critical |
| **STUDENT-TEAM-002** | `/team` | Invite & Join Acceptance | Accepts valid invitation token, prevents squad over-capacity. | Functional | High |
| **STUDENT-PAY-001** | `/payment` | Private Proof Upload | Enforces JPEG/PNG/WebP raster format, magic byte check, 5MB limit. | Storage | Critical |
| **STUDENT-PAY-002** | `/payment` | Atomic Capacity Guard | Reserves 50KB-5MB from 75MB GridFS ledger; blocks over-budget uploads. | Storage | Critical |
| **STUDENT-SUPPORT-001** | `/support` | Support Ticket Submission | Allows student ticket creation, enforces 15-min rate limit (max 5). | Functional | High |
| **STUDENT-SUPPORT-002** | `/support` | Admin Barrier on `/support` | Omits TALK TO ADMIN button for admins; displays ADMIN CONSOLE ↗ link. | RBAC | High |
| **ADMIN-HEALTH-001** | `/admin/health` | Telemetry Dashboard | Renders live CPU, memory, MongoDB readyState, GridFS headroom, queues. | Telemetry | Critical |
| **ADMIN-OPS-001** | `/admin/operations` | Operations Hub | Loads all hackathon cards, registration counts, squad counts, problem locks. | Operations | Critical |
| **ADMIN-OPS-002** | `/admin/operations` | CSV Roster Export | Exports sanitized CSV with formula-injection protection (`=`, `+`, `-`, `@`). | Security | High |
| **ADMIN-PAY-001** | `/admin/payments` | Payment Review Queue | Loads pending UTRs, streams private receipt proof securely via Blob URL. | Financial | Critical |
| **ADMIN-PAY-002** | `/admin/payments` | Payment Decision & Notes | Approves/declines with mandatory reason; logs reviewer email and timestamp. | Audit | High |
| **ADMIN-LOGS-001** | `/admin/logs` | Immutable Audit Trail | Reads activity logs; schema pre-hooks block update and delete operations. | Audit | Critical |
| **ADMIN-SUPPORT-001** | `/admin/support` | Global Ticket Management | Displays active tickets; updates status (`IN PROGRESS`, `RESOLVED`, `CLOSED`). | Operations | High |
| **SEC-RBAC-001** | `/admin/*` | Route Guard Enforcement | Unauthenticated or student sessions receive ACCESS DENIED / redirect. | Security | Critical |
| **SEC-API-001** | `/api/admin/*` | Server-Side Admin Auth | Missing/invalid bearer token returns HTTP 401; non-admin returns HTTP 403. | Security | Critical |
| **SEC-CORS-001** | `Express Server` | Production CORS Policy | Restricts origins to Vercel production and verified local test origins. | Security | Critical |
| **DATA-PERSIST-001** | `MongoDB Atlas` | Session & State Reload | State changes survive hard refresh and browser tab re-initialization. | Integrity | Critical |
| **A11Y-001** | `All Routes` | WCAG 2.2 AA Compliance | High contrast (4.5:1), keyboard focus indicators, accessible ARIA labels. | A11y | High |
| **PERF-001** | `Vercel / Render` | Bundle & Startup Limits | Nitro SSR build <2s, initial payload <600KB gzip, memory <150MB. | Performance | High |
| **DEPLOY-001** | `Production` | Revision Parity | Render backend and Vercel frontend run identical release SHA (`7be6506`). | Release | Critical |

---

## 4. SUBAGENT ASSIGNMENT MATRIX

| Agent Identifier | Target Focus Area | Primary Deliverable |
|---|---|---|
| **Subagent A** | Student-Facing Pages & Workflows | `docs/qa/student-functional-test-report.md` |
| **Subagent B** | Administrator Consoles & Workflows | `docs/qa/admin-functional-test-report.md` |
| **Subagent C** | Authentication, Sessions, RBAC & Isolation | `docs/qa/security-rbac-test-report.md` |
| **Subagent D** | Backend APIs & MongoDB Data Integrity | `docs/qa/backend-data-integrity-report.md` |
| **Subagent E** | Payment Gateway, GridFS Vault & Email Relay | `docs/qa/payments-gridfs-email-test-report.md` |
| **Subagent F** | Hackathons, Squads, Submissions & Leaderboard | `docs/qa/competition-workflow-test-report.md` |
| **Subagent G** | Responsive Viewports, Accessibility & Browser QA | `docs/qa/browser-accessibility-performance-report.md` |
| **Subagent H** | Independent Retest & Final Release Gatekeeper | `docs/qa/independent-retest-report.md` |

---

## 5. TEST EXECUTION ENVIRONMENT & REGRESSION SCRIPTS

### Core Project Regression Commands:
1. `node server/test_focused_regression.mjs` (19 scenarios)
2. `node --test server/test-security-local.mjs` (8 scenarios)
3. `node --test server/test_cors_policies.mjs` (5 scenarios)
4. `node --test server/test_firebase_and_catalog_regression.mjs` (8 scenarios)
5. `node --test server/test_gridfs_concurrency.mjs` (4 scenarios)
6. `node --test server/test_gridfs_lease_lifecycle.mjs` (4 scenarios)
7. `node --test server/test_gridfs_storage.mjs` (15 scenarios)
8. `node --test server/test_admin_health_and_ops.mjs` (11 scenarios)
9. `npm run build` (Production client and SSR build)
