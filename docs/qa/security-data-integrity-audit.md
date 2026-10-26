# SUBAGENT C — AUTHENTICATION, SECURITY & DATA INTEGRITY AUDIT
**Platform Release:** CodeSrijan 1.0  
**Audit Date:** 2026-10-26  
**Auditor:** Subagent C (Authentication, Security and Data Integrity)  

---

## 1. Security Architecture & Threat Model Overview

CodeSrijan 1.0 operates under a zero-trust model where client UI state is considered purely advisory. All administrative capabilities, data queries, file downloads, and mutations are authoritatively verified on the backend.

---

## 2. Authentication & Session Security

### 2.1 Password Hashing & Identity Protection
- **Algorithm:** bcrypt with 12 salt rounds (`bcrypt.hash(password, 12)`).
- **Leakage Prevention:** Passwords and hashes are strictly excluded from JSON serialization via Mongoose query projections (`select('-passwordHash')`).
- **Absence of Local Credential Guard:** Identities created without local password hashes cannot be authenticated via username/password endpoints, preventing null-password bypasses.

### 2.2 Session Management & Token Hashing
- **Token Format:** Bearer JWT tokens with cryptographically secure secret signing.
- **Server-Side Session Revocation:** Session tokens are SHA-256 hashed before storage in the `Session` collection (`sessionTokenHash`). Revocation is instantaneous by setting `revokedAt = new Date()`.
- **Query Parameter Token Elimination:** Private endpoints strictly reject authentication tokens passed in URL query strings (e.g. `?token=xyz`), preventing credential leakage in access logs, browser history, and HTTP Referer headers.

---

## 3. Role-Based Authorization & Tenant Isolation

### 3.1 Server-Side Role Enforcement
- Endpoints under `/api/admin/*` are strictly protected by `requireAuth` and `requireRole(['admin'])`.
- Verified in automated tests:
  - `GET /api/admin/health`: 401 Unauthorized (Guest), 403 Forbidden (Student)
  - `GET /api/admin/hackathon-operations`: 401 Unauthorized (Guest), 403 Forbidden (Student)
  - `GET /api/admin/hackathons/:id/export-csv`: 401 Unauthorized (Guest), 403 Forbidden (Student)
  - `GET /api/admin/logs`: 401 Unauthorized (Guest), 403 Forbidden (Student)
  - `PATCH /api/admin/support/:id/status`: 401 Unauthorized (Guest), 403 Forbidden (Student)

### 3.2 Cross-User Data Isolation
- **Support Tickets:** Ordinary students querying `GET /api/support` can only access tickets matching `{ userId: req.user.id }`.
- **Squad Rosters:** Locked squads prevent unauthorized members from leaving or dissolving the team without leader and administrative review.

---

## 4. File Storage Safety & GridFS Vault

### 4.1 Strict MIME & Magic-Byte Validation
- **Whitelist:** JPEG (`0xFF 0xD8 0xFF`), PNG (`0x89 0x50 0x4E 0x47`), and WebP (`RIFF...WEBP`).
- **Forbidden Payloads:** Vector formats (SVG), HTML, JavaScript, and executables are rejected with HTTP 400. Payloads exceeding 5MB are rejected with HTTP 413.

### 4.2 Storage Budgets & Capacity Fencing
- **Proof Storage Budget:** 75 MB (`PROOF_STORAGE_BUDGET_BYTES`).
- **Cluster Hard Ceiling:** 400 MB of 512 MB (`TOTAL_STORAGE_SAFETY_LIMIT_BYTES`), guaranteeing at least 112 MB reserve for database indexes and collections on the MongoDB Atlas M0 cluster.
- **Atomic Admission:** Reservations are placed atomically via `findOneAndUpdate`. Concurrent requests that exceed remaining capacity are rejected immediately without writing to GridFS.
- **Lease Expiry & Auto-Cleanup:** Inactive leases expire automatically after their TTL, and the reconciler reclaims uncommitted bytes.

---

## 5. CORS Policy & Exposed Headers

### 5.1 Strict Origin Allowlist
- **Production Origin:** Exactly `https://codesrijan-nine.vercel.app`.
- **Preview Deployments:** Strictly scoped to `/^https:\/\/codesrijan(?:-[a-z0-9-]+)?\.vercel\.app$/i`. Arbitrary Vercel subdomains (e.g. `https://attacker.vercel.app`) receive no CORS access headers and are blocked.
- **Local Dev Origins:** `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4173` are rejected in production (`NODE_ENV === 'production'`).

---

## 6. Audit Trail & Immutable Logging (Feature 7)

- **Storage:** Persisted server-side in `ActivityLog` (`server/models/secondary.js`).
- **Context Recorded:** Authenticated user email/ID, role, action, entity type, entity ID, description, IP address, and user-agent.
- **Data Protection:** Passwords, private tokens, OTPs, and payment numbers are never logged in audit trails.
- **Fail-Safe Operation:** Logging routines are wrapped in safe handlers to ensure audit failures never disrupt underlying business transactions.
