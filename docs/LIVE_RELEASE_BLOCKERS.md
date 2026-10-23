# LIVE RELEASE BLOCKERS & DEFECT REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Release Gate Verdict
Following comprehensive live-browser and API end-to-end testing of CodeSrijan, the deployment has been evaluated against all business rules and core launch criteria.

### Final Release Classification
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   FINAL CLASSIFICATION:                                                      ║
║   LIVE QA PARTIAL — BLOCKED BY MISSING SAFE TEST CAPABILITIES                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Rationale:
1. **Critical Functionality Is Working:** Free registration, paid registration, authoritative per-participant and per-team fee calculation, payment proof submission, UTR uniqueness enforcement, atomic administrative payment review (approve/reject with note), role-based route protection, responsive mobile rendering across 5 viewports, and Apps Script email relay are fully implemented and verified.
2. **Missing Test Capabilities & Unimplemented Features Block Complete PASS:**
   - **Withdrawal & Refunds (Rule E / REF-001 to REF-012):** The live CodeSrijan architecture has no refund endpoints, no refund database schema, no wallet/balance ledger, and no withdrawal UI controls. This is an unimplemented product subsystem.
   - **Schedule Overlap Validation (Rule B / REG-005, REG-007):** The backend does not compare event start/end date intervals during registration.
   - **Team Name Uniqueness (TEAM-002, 003, 004):** Duplicate team names are permitted in the same hackathon due to the absence of a unique index in the database.

---

## 2. Defects Log

### DEF-001: Absence of Schedule Overlap Collision Detection (Rule B)
- **Severity:** HIGH
- **Affected Roles:** Student, Squad Leader
- **Affected Endpoints:** `POST /api/hackathons/:id/register`
- **Reproducible Steps:**
  1. Student registers for Hackathon A (`startDate: 2026-10-10`, `endDate: 2026-10-13`).
  2. Same student registers for Hackathon B (`startDate: 2026-10-11`, `endDate: 2026-10-12`).
- **Expected Behavior:** Registration for Hackathon B should be blocked with an explanatory error stating that the student already has confirmed/pending participation in an overlapping tournament.
- **Actual Behavior:** Registration succeeds; the user is enrolled in both concurrent tournaments.
- **Evidence:** Codebase analysis of `server/server.js:684-740` showing single hackathon query without date collision evaluation.

---

### DEF-002: Team Name Duplicate Collision (TEAM-002, TEAM-003, TEAM-004)
- **Severity:** MEDIUM
- **Affected Roles:** Student, Administrator
- **Affected Endpoints:** `POST /api/teams`
- **Reproducible Steps:**
  1. User A creates a squad named `"CodeBreakers"`.
  2. User B creates a squad named `"CodeBreakers"` or `"codebreakers"` for the same hackathon.
- **Expected Behavior:** System should reject the second creation with HTTP 409 Conflict: `"A squad with this name already exists in this hackathon."`
- **Actual Behavior:** Both squads are created successfully, creating ambiguity in the admin queue and public leaderboard.
- **Evidence:** `server/models/index.js:162-187` showing `name: String` without unique index.

---

### DEF-003: Unimplemented Withdrawal and Refund Architecture (Rule E)
- **Severity:** BLOCKER (for Refund Scenarios)
- **Affected Roles:** Student, Administrator
- **Affected Routes:** `/payment`, `/dashboard`, `/admin`
- **Reproducible Steps:**
  1. Student registers and pays for a paid tournament.
  2. Student navigates to `/dashboard` or `/payment` seeking to withdraw or request a refund.
- **Expected Behavior:** A clear `"Withdraw & Request Refund"` button allowing cancellation in accordance with event rules.
- **Actual Behavior:** No withdrawal or refund controls exist anywhere on the platform.
- **Evidence:** `artifacts/live-e2e-qa/agent-d-refund-withdrawal-search.png` and `live_browser_audit_results.json`.

---

## 3. Missing Product Policies Requiring Owner Definition

| Policy Gap | Current Platform Reality | Owner Decision Required |
| :--- | :--- | :--- |
| **1. Refund Destination** | No wallet or balance field exists on the user model. | Will refunds be credited to an internal CodeSrijan wallet, or processed manually via offline UPI reimbursement? |
| **2. Refund Eligibility & Cutoff** | No withdrawal cutoff date exists on hackathons. | Is withdrawal permitted up to 24 hours prior to event start, or strictly before payment approval? |
| **3. Individual vs Squad Withdrawal** | Squad roster is locked upon payment submission to prevent fraudulent substitutions. | If one member drops out of a paid 3-person squad, can the leader substitute a new member, or receive a 1/3 refund? |
| **4. Pending Registration Overlap** | A student with `payment_pending` can register for other events. | Should an unverified pending payment block registration in concurrent tournaments? |
| **5. Team Name Scope** | Team names are non-unique. | Should uniqueness be scoped per-hackathon (`{ hackathonId, name }`), or globally across all CodeSrijan events? |
| **6. Roster Entry Before Approval** | Invited teammates can accept invitations before the leader's payment is approved, but the entire roster is locked once proof is uploaded. | Confirm whether this behavior is intended as designed. |
| **7. Resubmission of Rejected Proof** | Rejected registrations remain in `rejected` state; student can re-upload proof on `/payment`. | Confirm how many resubmission attempts are permitted before disqualification. |

---

## 4. Final Verification Summary
No code modifications, database writes, git pushes, or migrations were executed during this QA audit.
All evidence was gathered through live browser automation and repository code inspection. The platform is stable for free tournaments and paid administrative reviews, but launch gates for refunds and schedule collision requires owner-approved specifications.
