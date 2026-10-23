# CodeSrijan — API & Security Audit Report

**Audit Date:** 2026-10-23  
**Lead Security & Backend Test Engineer:** Antigravity Application Security Team  
**Scope:** 154 Backend Endpoints declared in `server/server.js`, Database Models, WebSocket Handlers, and Authentication Middleware  
**Canonical API Target:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Classification:** INTERNAL QA SECURITY AUDIT  

---

## 1. API Route Inventory & Authentication Matrix

Out of 154 mapped backend endpoints in `server/server.js`:
- **Public Endpoints (32):** Open to unauthenticated visitors (`/api/public/stats`, `/api/leaderboard`, `/api/hackathons`, `/api/sponsors`, `/api/announcements`, `/api/auth/login`, `/api/auth/register`, etc.).
- **Authenticated Student Endpoints (68):** Protected by `requireAuth` and `requireRole(['student'])` (profile updates, squad creation, invitations, tournament registrations, payment proof upload, task management, support tickets, messages).
- **Administrative Endpoints (54):** Protected by `requireAuth` and `requireRole(['admin'])` (`/api/admin/payments/*`, `/api/admin/hackathons/*`, `/api/admin/users/*`, `/api/admin/logs`, `/api/admin/analytics`, `/api/admin/settings`, etc.).

---

## 2. Security Test Matrix & Verification Outcomes

### API-001 — Unauthenticated Access Rejection
- **Action:** Send requests without `Authorization: Bearer <token>` to protected endpoints (`/api/auth/me`, `/api/teams`, `/api/admin/payments`).
- **Result:** Server middleware `requireAuth` immediately halts request and returns HTTP 401 Unauthorized (`{"message":"Authentication required."}`).
- **Status:** **PASS**.

### API-002 — Role-Based Access Control (RBAC)
- **Action:** Student attempts to access admin review queue (`GET /api/admin/payments`) or publish hackathons (`POST /api/hackathons/:id/publish`).
- **Result:** Server middleware `requireRole(['admin'])` rejects with HTTP 403 Forbidden (`{"message":"Access denied: Administrative privileges required."}`).
- **Status:** **PASS**.

### API-003 — Resource Ownership Enforcement
- **Action:**
  1. Student B attempts to access private support tickets created by Student A (`GET /api/support`).
  2. Student B attempts to submit project deliverables or edit tasks of Student A's squad.
- **Result:**
  - Support query filters by `userId: req.user.id`; Student B receives an empty array.
  - Team tasks require membership in `team.memberIds`; non-members are rejected with HTTP 403.
- **Status:** **PASS**.

### API-004 — Invalid Resource Identifiers
- **Action:** Query endpoints with malformed MongoDB ObjectIDs (e.g. `GET /api/hackathons/invalid-id-99999`).
- **Result:** Controller checks for document existence and safely returns HTTP 404 Not Found without crashing or leaking stack traces.
- **Status:** **PASS**.

### API-005 — Input Validation Boundaries
- **Email Validation (`BUG-AUTH-001` Remediated):** Added `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` check to `POST /api/auth/register`; rejects malformed emails with HTTP 400.
- **Password Length:** Rejects passwords < 8 characters with HTTP 400.
- **Message Content (`BUG-CHAT-001` Remediated):** Added trim check to `POST /api/conversations/:id/messages`; rejects whitespace with HTTP 400.
- **Status:** **PASS (Remediated locally)**.

### API-006 & API-007 — Duplicate Operations & State-Machine Enforcement
- **Duplicate Registration:** Repeating registration for the same event returns HTTP 409 Conflict.
- **Duplicate UTR:** Reusing an existing transaction reference returns HTTP 409 Conflict.
- **Lifecycle Transitions:** Submitting payment proof on an already verified registration returns HTTP 400.
- **Status:** **PASS**.

### API-008 — QA-Data Isolation & Leaderboard Protection
- **Vulnerability Prior to Patch:** Early staging test scores could inflate the public leaderboard or tournament metrics.
- **Remediation Implemented & Verified in `4c3851c`:**
  - `isTest: { type: Boolean, default: false, index: true }` added to `Hackathon`, `Registration`, and `Team` schemas.
  - Public stats, active countdown, and leaderboard filter out test records using relationship verification (`testHackIds` / `genuineTeamIds`).
  - Historical ambiguous team `t-1791543889807` safely filtered without modifying database records.
- **Status:** **PASS**.

### API-009 — Apps Script Email Relay Security
- **HMAC Authentication:** Outgoing HTTP relay requests are authenticated with HMAC-SHA256 signatures over payload and timestamp.
- **Replay Protection:** Replayed requests older than 300 seconds are rejected.
- **Template Restraint:** Relay permits only approved templates (`verification_otp`, `password_reset`, `payment_review_notification`, `admin_payment_alert`).
- **Status:** **PASS**.

### API-010 — WebSocket Room Isolation
- **Room Authorization:** Socket connection requires a valid, non-revoked session token. Joining a conversation room requires that the user is an explicit participant or active squad member.
- **Status:** **PASS**.

### API-011 — Sensitive Response Data Exclusion
- **Audit:** Examined JSON payloads of `/api/auth/me`, `/api/users/profile`, `/api/admin/users`, and `/api/teams`.
- **Finding:** Password hashes (`passwordHash`) are excluded via `.select('-passwordHash')` and schema `toJSON` transforms. MongoDB connection strings, JWT secrets, and relay keys are never serialized in API responses.
- **Status:** **PASS**.

### API-012 — Atomic Concurrency & Race Condition Defense
- **Payment Decisions:** Optimistic versioning (`__v` check / atomic `findOneAndUpdate`) prevents race conditions during simultaneous payment reviews.
- **OTP Rotation:** Parallel verification attempts cannot consume the same code twice.
- **Status:** **PASS**.

---

## 3. Severity-Ranked Security Findings Summary

| Finding ID | Title | Severity | Impact | Status |
| :--- | :--- | :---: | :--- | :---: |
| **SEC-001** | Missing Email Format Regex on Registration | Medium | Allowed registering invalid emails | **RESOLVED LOCALLY** |
| **SEC-002** | Blank Message Acceptance on Chat API | Low | Created empty messages in chat database | **RESOLVED LOCALLY** |
| **SEC-003** | Support Ticket Schema Priority Mismatch | Medium | 500 error on default priority ticket creation | **RESOLVED LOCALLY** |
| **SEC-004** | Solo Registration Dependency Conflict | High | Double-counted fees and registrations for teammates | **RESOLVED LOCALLY** |
| **SEC-005** | Production Credential Rotation Required | High | Old credentials used during development | **PENDING OWNER ACTION** |
