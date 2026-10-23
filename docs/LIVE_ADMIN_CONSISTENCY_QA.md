# LIVE ADMIN CONSISTENCY QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Admin Surface
The CodeSrijan Administrative Console provides centralized control over tournaments, participants, squads, evaluations, and financial clearance:
- `/admin` — High-level platform statistics and operations overview
- `/admin/payments` — Payment Review Queue (audit, verify, reject UTRs)
- `/admin/hackathons` — Tournament creation, fee rules, and lifecycle stages
- `/admin/teams` — Squad monitoring, roster auditing, and disqualifications
- `/admin/users` — Participant directory and role management

---

## 2. Multi-Surface Consistency Verification Matrix

| Admin Console Surface | Backing API Endpoint | Data Synchronized with Student View | Consistency Result | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment Review Queue** | `GET /api/admin/payments` | Synchronized with `/payment` and student `/dashboard` | Consistent: Amount, UTR, and status match across views | `agent-c-admin-payments.png` | **PASS** |
| **Squads & Rosters** | `GET /api/admin/teams` | Synchronized with student `/team` page | Consistent: Member rosters, leader assignment, and lock status match | `agent-c-admin-teams.png` | **PASS** |
| **Hackathon Catalog** | `GET /api/hackathons` | Synchronized with student `/hackathons` catalog | Consistent: 12 events indexed identically | `agent-c-admin-hackathons.png` | **PASS** |
| **Approved Payments** | `GET /api/admin/payments?status=verified` | Synchronized with student `confirmed` status badge | Consistent: Approved payment changes status in both views immediately | Regression suite & store sync | **PASS** |
| **Rejected Payments** | `GET /api/admin/payments?status=rejected` | Synchronized with student rejection alert banner | Consistent: Rejection note matches `Registration.rejectionReason` | `test_payment_notifications.mjs` | **PASS** |
| **Outbound Refunds** | N/A | **Unimplemented** | Discrepancy: No refund queue or refund ledger exists | `agent-d-refund-withdrawal-search.png` | **BLOCKED** |
| **Search & Real-time Filtering** | `/admin/payments` UI filter | Real-time filtering across UTR, Team, Operative Name | Responsive filter updates queue without server roundtrip delay | `src/routes/admin.payments.tsx` | **PASS** |
| **Page Refresh Idempotency** | Browser Refresh | Actions retain state; refreshing does not alter decision | Verified: Refreshing `/admin/payments` retains exact verified/rejected counts | `live_browser_audit_results.json` | **PASS** |

---

## 3. Discrepancy Audit: Admin View vs Student View
During comprehensive testing, no discrepancies were detected between the admin state and the student state for implemented workflows:
- When an admin approves a payment, the student's status changes from `"PENDING REVIEW"` to `"CONFIRMED"`.
- When an admin rejects a payment, the student's status transitions to `"REJECTED"` and displays the exact rejection note.
- When a squad roster is locked upon payment submission, both the squad leader on `/team` and the administrator on `/admin/teams` observe the locked state.

The only gap is the complete absence of a **Refund Management Console**, which is documented as a product policy omission.
