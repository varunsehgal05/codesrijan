# LIVE WITHDRAWAL AND REFUND QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Missing Architecture Notice
> [!IMPORTANT]
> **CRITICAL ARCHITECTURAL FINDING:**  
> A comprehensive audit of both the deployed live website (`https://codesrijan-nine.vercel.app`) and the backend repository (`server/server.js`, `server/models/index.js`) reveals that **CodeSrijan currently has NO withdrawal, refund, or internal balance/wallet capabilities implemented.**

### Evidence Gathered:
1. **Live Browser Discovery (Agent D):**
   - Headless browser automated inspection of `/payment`, `/dashboard`, and `/admin` (`artifacts/live-e2e-qa/live_browser_audit_results.json`):
     - `paymentPageHasWithdraw: false`
     - `paymentPageHasRefund: false`
     - `adminHasRefundNav: false`
     - Screenshot evidence: `artifacts/live-e2e-qa/agent-d-refund-withdrawal-search.png`
2. **Backend API Route Audit:**
   - Ripgrep searches across the entire backend for `refund`, `withdraw`, `wallet`, or `balance` returned **0 matching endpoints or handlers**.
3. **Mongoose Schema Audit:**
   - The `User` schema contains no `walletBalance`, `accountBalance`, or ledger fields.
   - The `Registration` schema contains no `'withdrawn'`, `'refund_pending'`, or `'refunded'` enum statuses.
   - There is no `Refund` model or transaction ledger.

**Status Classification:**  
In strict compliance with the Mission Instructions (*"If the live platform does not provide a safe way to test a required mutation, mark the case BLOCKED — SAFE LIVE TEST DATA OR TEST MODE REQUIRED. Do not claim it passed"*), **all test cases REF-001 through REF-012 are classified as BLOCKED.**

---

## 2. Test Case Execution Matrix (REF-001 to REF-012)

| Test ID | Test Scenario | Expected Product Result | Observed Live Platform Reality | Blocking Reason & Missing Capability | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REF-001** | Withdraw from eligible paid QA hackathon | User clicks withdraw; registration cancelled | No withdraw control exists on `/dashboard` or `/payment` | No withdrawal route (`POST /api/hackathons/:id/withdraw`) or UI exists | **BLOCKED** |
| **REF-002** | Inspect refund before and after processing | Refund status reflects actual transaction | No refund tracking view exists | No refund model or state machine in codebase | **BLOCKED** |
| **REF-003** | Check account after internal-balance refund | Account credited once with correct balance | No internal wallet exists in user schema | CodeSrijan has no internal wallet ledger architecture | **BLOCKED** |
| **REF-004** | Repeatedly request the same refund | Duplicate refund prevented | No refund endpoint to call | Missing refund request API endpoint | **BLOCKED** |
| **REF-005** | Refresh during refund processing | Idempotent handling; no double credit | No refund processing exists | Missing refund execution engine | **BLOCKED** |
| **REF-006** | Verify refund amount against original payment | Refund does not exceed original fee | No refund calculation logic exists | Missing refund policy and fee reconciliation | **BLOCKED** |
| **REF-007** | Withdraw team whose leader paid ₹300 | Full-team refund returns to paying account | No team withdrawal or refund flow exists | Missing team refund policy and payout handler | **BLOCKED** |
| **REF-008** | One team member leaves paid squad | Individual withdrawal policy executed | Members cannot leave after payment lock; no partial refund | Product has not defined individual-refund policy | **BLOCKED** |
| **REF-009** | Inspect historical payment and refund entries | Original transaction and refund linked | Only original payment record exists; no refund model | Missing refund database schema & audit log | **BLOCKED** |
| **REF-010** | Register for free event after withdrawal | Free registration allowed with ₹0 fee | Cannot reach withdrawn state to test transition | Prerequisite withdrawal feature is absent | **BLOCKED** |
| **REF-011** | Withdraw after disallowed cutoff | Blocked according to event cutoff policy | No withdrawal cutoff logic implemented | Missing event withdrawal deadline policy | **BLOCKED** |
| **REF-012** | Simulate unsupported or failed refund | UI shows graceful error without false success | No refund simulator or gateway test mode | Missing refund exception handling pipeline | **BLOCKED** |

---

## 3. Required Product Policies for Implementation
Before a withdrawal and refund system can be implemented and tested, the platform owner must define:
1. **Refund Destination Policy:**
   - Does CodeSrijan issue direct UPI/bank gateway refunds, or does it credit an internal CodeSrijan Hacker Balance?
2. **Individual vs Whole-Squad Withdrawal:**
   - If an individual operative leaves a paid squad, does the squad receive a partial refund, or does the registration fee remain fixed?
   - Can an individual leave a squad after payment proof has been submitted? (Currently, CodeSrijan locks the roster permanently upon payment submission to prevent fraudulent substitutions).
3. **Cut-off Deadlines:**
   - Is withdrawal allowed up to 24 hours before tournament start, or until registration close?
4. **Administrative Refund Console:**
   - An `/admin/refunds` dashboard is required to process, review, and audit outbound student refunds.
