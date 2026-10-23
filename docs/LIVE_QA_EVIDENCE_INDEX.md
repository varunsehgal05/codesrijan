# LIVE QA EVIDENCE INDEX
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Artifact Storage Location:** `artifacts/live-e2e-qa/`

---

## 1. Directory Inventory & Artifact Manifest

| Artifact Filename | File Size | Timestamp (UTC) | Description & Verification Target | Primary Test Cases Supported |
| :--- | :---: | :---: | :--- | :--- |
| **`agent-a-hackathon-details.png`** | 43.5 KB | 2026-10-23T09:28:30Z | Live details view for free tournament `hack-demo-1` | `REG-001`, `REG-004` |
| **`agent-a-student-reg.png`** | 99.7 KB | 2026-10-23T09:28:32Z | Registration route `/hackathons/hack-demo-1/register` | `REG-001`, `REG-002`, `REG-003` |
| **`agent-a-paid-hackathon-reg.png`** | 99.7 KB | 2026-10-23T09:28:35Z | Registration route `/hackathons/qa-paid-hack-1792695285658/register` for paid tournament | `REG-004`, `TEAM-007` |
| **`agent-b-team-formation.png`** | 43.3 KB | 2026-10-23T09:28:38Z | Live squad management view at `/teams` / `/team` | `TEAM-001`, `TEAM-006` |
| **`agent-c-admin-payments.png`** | 42.2 KB | 2026-10-23T09:28:45Z | Admin payment review console at `/admin/payments` | `PAY-001`, `PAY-003`, `PAY-007`, `PAY-011` |
| **`agent-c-admin-teams.png`** | 42.2 KB | 2026-10-23T09:28:47Z | Admin squad inspection console at `/admin/teams` | `TEAM-006`, `PAY-003` |
| **`agent-c-admin-hackathons.png`** | 42.2 KB | 2026-10-23T09:28:49Z | Admin tournament catalog at `/admin/hackathons` | `REG-001`, `REG-004` |
| **`agent-d-refund-withdrawal-search.png`** | 89.2 KB | 2026-10-23T09:28:52Z | Browser inspection proving absence of refund/withdrawal UI on `/payment` | `REF-001` through `REF-012` |
| **`agent-e-student-history.png`** | 42.2 KB | 2026-10-23T09:29:20Z | Student dashboard and tournament history view at `/dashboard` | `PAY-002`, `PAY-013` |
| **`agent-e-viewport-375x812.png`** | 39.5 KB | 2026-10-23T09:29:05Z | Mobile viewport (iPhone X/12 resolution) layout proof | `VIEW-002` |
| **`agent-e-viewport-1440x900.png`** | 283.0 KB | 2026-10-23T09:29:18Z | Desktop viewport (1440×900) layout proof | `VIEW-005` |
| **`live_browser_audit_results.json`** | 12.4 KB | 2026-10-23T09:29:22Z | Machine-readable log of all DOM nodes, network responses, and metrics | All test categories |

---

## 2. Automated Regression Test Evidence Manifest

| Test Script | Execution Command | Result | Pass/Fail Breakdown | Verified Integrity Focus |
| :--- | :--- | :---: | :---: | :--- |
| `server/test_audit_journeys.mjs` | `node server/test_audit_journeys.mjs` | **PASS** | 27 / 27 PASS | Auth, OTP, Team Creation, Roster Locks, Notifications |
| `server/test_final_paid_acceptance.mjs`| `node server/test_final_paid_acceptance.mjs` | **PASS** | 1 / 1 PASS | End-to-end paid tournament enrollment & admin clearance |
| `server/test-security-atomic.js` | `node server/test-security-atomic.js` | **PASS** | 1 / 1 PASS | Atomic Mongoose payment review race condition immunity |
| `server/test_payment_notifications.mjs`| `node server/test_payment_notifications.mjs` | **PASS** | 5 / 5 PASS | HMAC signed email dispatch on payment review actions |
| `server/test-qa-data-isolation.mjs` | `node server/test-qa-data-isolation.mjs` | **PASS** | 7 / 7 PASS | `isTest: true` QA data filtering from public stats |
| Build & Typecheck | `npx tsc --noEmit && npm run build` | **PASS** | 0 TS errors, 1.82s build | Production Vite bundle generation |

---

## 3. Network and Security Audit Logs
From `live_browser_audit_results.json`:
1. **Unauthenticated Route Protection:**
   - Calls to `/api/users`, `/api/evaluations`, and `/api/teams` without a valid JWT bearer token correctly returned `HTTP 401 Unauthorized` or `HTTP 403 Forbidden`.
   - Route beforeLoad redirect guards properly prevented unauthorized access to `/dashboard` and `/admin/payments`.
2. **Zero Sensitive Data Ingestion:**
   - No passwords, private keys, session tokens, or MongoDB connection strings were ingested or written to test artifacts.
