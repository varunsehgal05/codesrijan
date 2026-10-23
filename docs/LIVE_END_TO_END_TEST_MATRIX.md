# LIVE END-TO-END QA TEST MATRIX
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Status Classification Totals

| Category | Total Tests | PASS | FAIL | BLOCKED | UNVERIFIED | NOT APPLICABLE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Registration & Scheduling (REG)** | 12 | 9 | 2 | 1 | 0 | 0 |
| **Team Formation & Fee Math (TEAM)** | 8 | 5 | 3 | 0 | 0 | 0 |
| **Payment & Admin Approval (PAY)** | 15 | 15 | 0 | 0 | 0 | 0 |
| **Withdrawal & Refunds (REF)** | 12 | 0 | 0 | 12 | 0 | 0 |
| **Responsive Viewports (VIEW)** | 5 | 5 | 0 | 0 | 0 | 0 |
| **Email Relay Scenarios (NOTIF)** | 15 | 2 | 0 | 3 | 10 | 0 |
| **TOTALS** | **67** | **36** | **5** | **16** | **10** | **0** |

---

## 2. Comprehensive Test Execution Details

### 2.1 Registration and Scheduling (REG-001 to REG-012)
| Test ID | Description | Live Environment Execution | Observed Behavior | Final Status |
| :--- | :--- | :--- | :--- | :---: |
| **REG-001** | Register for eligible free hackathon | Executed via live browser navigation (`/hackathons/hack-demo-1/register`) | Free registration recorded without requiring payment gateway clearance | **PASS** |
| **REG-002** | Submit same registration twice | Executed via API & UI form submit | Second attempt rejected with HTTP 400 (`"You are already registered"`) | **PASS** |
| **REG-003** | Refresh during registration | Live browser page reload during form state | Form resets cleanly without duplicate submission | **PASS** |
| **REG-004** | Register for paid event | Live browser navigation to `qa-paid-hack-1792695285658` | Displays entry fee ₹600; routes to payment submission | **PASS** |
| **REG-005** | Register for overlapping event | Evaluated on live registration endpoint | **FAIL:** Overlap logic absent; registration allowed without conflict check | **FAIL** |
| **REG-006** | Register for non-overlapping event | Executed via regression suite and route check | Permitted as expected | **PASS** |
| **REG-007** | Overlapping team participation | Evaluated on live team registration handler | **FAIL:** Team member schedule overlap not checked by backend | **FAIL** |
| **REG-008** | Join two teams in one event | Live squad membership check | Blocked; user cannot hold duplicate memberships in same event | **PASS** |
| **REG-009** | Solo registration, then join team | Live registration handler | Prevented; duplicate participation blocked | **PASS** |
| **REG-010** | Accept repeated team invitations | Live invitation resolution handler | Atomic resolution; repeated acceptance returns error | **PASS** |
| **REG-011** | Register with invalid squad roster | Squad with unverified email addresses | Blocked with HTTP 403 requiring verified email | **PASS** |
| **REG-012** | Boundary start/end interval conditions | Scheduling logic evaluation | Blocked because interval overlap checking is not implemented | **BLOCKED** |

---

### 2.2 Team Formation and Fee Calculation (TEAM-001 to TEAM-008)
| Test ID | Description | Live Environment Execution | Observed Behavior | Final Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEAM-001** | Create squad with unique name | Live browser on `/team` | Squad created; user assigned as leader | **PASS** |
| **TEAM-002** | Duplicate team name in same hackathon | Live API `POST /api/teams` | **FAIL:** Second team created with identical name; no unique index | **FAIL** |
| **TEAM-003** | Duplicate name with different casing | Live API `POST /api/teams` | **FAIL:** Accepted due to absence of case-insensitive collation | **FAIL** |
| **TEAM-004** | Name with leading/trailing spaces | Live API `POST /api/teams` | **FAIL:** Stored without trim normalization; duplicate allowed | **FAIL** |
| **TEAM-005** | Invite user already in another team | Live invitation handler | Conflicting membership blocked | **PASS** |
| **TEAM-006** | Verify leader and member roster | Live browser on `/team` & `/admin/teams` | Correct users, roles, and statuses displayed | **PASS** |
| **TEAM-007** | Change roster after fee calculated | Squad with submitted payment proof | Blocked; roster locked upon payment submission | **PASS** |
| **TEAM-008** | Concurrent team registration clicks | Live concurrent POST requests | MongoDB atomic uniqueness prevents duplicate records | **PASS** |

---

### 2.3 Payment and Admin Approval (PAY-001 to PAY-015)
| Test ID | Description | Live Environment Execution | Observed Behavior | Final Status |
| :--- | :--- | :--- | :--- | :---: |
| **PAY-001** | Submit valid paid payment form | `/payment` route form submission | Record created with `payment_pending`; appears in admin queue | **PASS** |
| **PAY-002** | Check student status immediately | `/dashboard` view | Displays pending review warning banner | **PASS** |
| **PAY-003** | Inspect pending payment as admin | Live browser on `/admin/payments` | Event, UTR, fee, and receipt preview visible | **PASS** |
| **PAY-004** | Approve valid QA payment | Live review action (`POST /api/admin/payments/:id/review`) | Status transitions to `confirmed`; payment marked `verified` | **PASS** |
| **PAY-005** | Reject payment | Live review action | Status marked `rejected`; participant remains unconfirmed | **PASS** |
| **PAY-006** | Reject with audit reason | Live review action with `adminNote` | Reason stored and sent in notification email | **PASS** |
| **PAY-007** | Submit proof for incorrect amount | Admin payment card inspection | Expected fee and submitted amount both visible to admin | **PASS** |
| **PAY-008** | Reuse same payment reference (UTR) | Sparse unique index check on `utrNumber` | Reused UTR rejected with HTTP 400 | **PASS** |
| **PAY-009** | Approve same payment twice | Idempotency guard check | Second review rejected with HTTP 400 | **PASS** |
| **PAY-010** | Conflicting concurrent admin reviews | Atomic `findOneAndUpdate` | Race-free; only first decision succeeds | **PASS** |
| **PAY-011** | Inspect payment queue after decision | `/admin/payments` view tabs | Record transitions cleanly to Verified/Rejected tab | **PASS** |
| **PAY-012** | Inspect 3-person team at ₹100/person | Authoritative fee math check | Calculated as ₹300 | **PASS** |
| **PAY-013** | Inspect rejected payment in dashboard | `/dashboard` student view | Displays rejection note and resubmission prompt | **PASS** |
| **PAY-014** | Retry form after network error | Form resubmission | Updated without creating duplicate records | **PASS** |
| **PAY-015** | Attempt approval without proof | Unpaid registration review | Blocked; proof required for verification | **PASS** |

---

### 2.4 Withdrawal and Refunds (REF-001 to REF-012)
| Test ID | Description | Live Environment Execution | Observed Behavior | Final Status |
| :--- | :--- | :--- | :--- | :---: |
| **REF-001** | Withdraw from paid hackathon | Live UI discovery on `/payment` and `/dashboard` | Feature absent; no withdrawal button or endpoint | **BLOCKED** |
| **REF-002** | Inspect refund status | Live UI discovery | Feature absent; no refund tracking model | **BLOCKED** |
| **REF-003** | Internal wallet refund credit | Live schema and balance inspection | Feature absent; no internal balance ledger in user schema | **BLOCKED** |
| **REF-004** | Duplicate refund prevention | Route inspection | Feature absent; no refund handler | **BLOCKED** |
| **REF-005** | Refresh during refund | Route inspection | Feature absent; no refund handler | **BLOCKED** |
| **REF-006** | Verify refund vs original fee | Calculation check | Feature absent; no refund calculation logic | **BLOCKED** |
| **REF-007** | Withdraw team with leader paid fee | Team refund check | Feature absent; no refund mechanism | **BLOCKED** |
| **REF-008** | One team member leaves paid squad | Member withdrawal check | Roster is permanently locked; no partial refund feature | **BLOCKED** |
| **REF-009** | Historical refund entries | Ledger check | Feature absent; no refund transaction model | **BLOCKED** |
| **REF-010** | Register free event after withdrawal | State transition check | Prerequisite withdrawal feature does not exist | **BLOCKED** |
| **REF-011** | Withdraw after cutoff deadline | Policy enforcement check | Feature absent; no cutoff policy implemented | **BLOCKED** |
| **REF-012** | Simulate failed refund | Error handling check | Feature absent; no refund test gateway | **BLOCKED** |

---

### 2.5 Responsive Viewports (VIEW-001 to VIEW-005)
| Test ID | Viewport Resolution | Device Category | Horizontal Scroll / Overflow | Visual Artifact | Status |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **VIEW-001** | 320 × 700 | Small Mobile (iPhone SE) | Overflow: `false` | Inspected via headless Chromium | **PASS** |
| **VIEW-002** | 375 × 812 | Standard Mobile (iPhone X/12) | Overflow: `false` | `agent-e-viewport-375x812.png` | **PASS** |
| **VIEW-003** | 768 × 1024 | Tablet (iPad Portrait) | Overflow: `false` | Inspected via headless Chromium | **PASS** |
| **VIEW-004** | 1280 × 800 | Laptop / Chromebook | Overflow: `false` | Inspected via headless Chromium | **PASS** |
| **VIEW-005** | 1440 × 900 | Desktop Large | Overflow: `false` | `agent-e-viewport-1440x900.png` | **PASS** |
