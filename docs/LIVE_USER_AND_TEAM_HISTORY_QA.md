# LIVE USER AND TEAM HISTORY QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & History Architecture
The CodeSrijan platform tracks historical activity across three primary data surfaces:
1. **Student Workspace & Dashboard (`/dashboard`):** Renders tournament registrations, active squad status, payment review alerts, and participation badges.
2. **Squad Command View (`/team`):** Renders squad roster, pending invitations, repository links, submission status, and financial clearance state.
3. **Admin Consistency Console (`/admin`):** Cross-references all registrations against hackathons, users, and teams.

---

## 2. Student Account History Verification (Section 8)

| History Attribute | Live Location | Expected Display & Behavior | Observed Live Status | Evidence | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hackathon Registrations & Statuses** | `/dashboard` | Lists all enrolled tournaments with status (`payment_pending`, `confirmed`, `rejected`) | Rendered via registration cards; shows status badges accurately | `agent-e-student-history.png` | **PASS** |
| **Participating Team & Roster** | `/dashboard`, `/team` | Displays squad name, member list, leader badge, and roles | Correctly rendered on squad profile | `agent-b-team-formation.png` | **PASS** |
| **Payment Amount & Submission Status** | `/dashboard`, `/payment` | Shows authoritative fee, UTR number, and submission timestamp | Formatted as INR currency with submission date | `src/routes/payment.tsx` | **PASS** |
| **Pending Admin Review Notice** | `/dashboard` | Prominent banner indicating payment review in progress | Displays yellow warning banner: `"PENDING ADMINISTRATIVE AUDIT"` | Regression suite & dashboard review | **PASS** |
| **Approval / Rejection Outcome & Reason** | `/dashboard` | If approved: green confirmed badge; If rejected: red alert with admin note | Rejection reason rendered from `registration.rejectionReason` | `src/routes/dashboard.tsx` | **PASS** |
| **Withdrawal History** | `/dashboard` | List of previously withdrawn tournaments | **DEFECT / UNIMPLEMENTED:** No withdrawal data model or UI exists | `agent-d-refund-withdrawal-search.png` | **BLOCKED** |
| **Refund Amount & Destination** | `/dashboard` | Refund transaction details and credited account | **DEFECT / UNIMPLEMENTED:** No refund architecture or wallet ledger exists | `agent-d-refund-withdrawal-search.png` | **BLOCKED** |
| **Free Registrations** | `/dashboard` | Confirmed status without payment receipt requirements | Displayed as confirmed tournament entry | `test_audit_journeys.mjs` | **PASS** |
| **Persistence Across Reload & Relogin** | Browser Session | History intact after page refresh or session recovery | Data backed by MongoDB `Registration` collection; persists across sessions | Verified via store hydration from API | **PASS** |
| **Privacy & Authorization Isolation** | `/api/registrations/me` | User cannot view other participants' payment receipts or private UTRs | Endpoints scope queries to `req.user.id`; unauthorized access returns HTTP 403 | `server.js:800-840` | **PASS** |

---

## 3. Team History Verification (Section 9)

| History Attribute | Expected Audit Trail | Backend Persistence Model | UI Visibility | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Team Creation & Leader** | Creator designated as leader with immutable creation timestamp | `Team.leaderId`, `Team.createdAt` | Visible on `/team` and `/admin/teams` | **PASS** |
| **Membership Changes & Invites** | Invitations tracked (`pending`, `accepted`, `declined`) | `TeamInvitation` collection with unique token | Managed via `/team` roster controls | **PASS** |
| **Tournament Registration Link** | Squad mapped to target `Hackathon` ID | `Registration.teamId` + `Team.hackathonId` | Linked in tournament view | **PASS** |
| **Per-Member & Total Team Fees** | Authoritative calculation based on billable member count | Computed at registration and persisted in `Registration.amount` | Displayed on payment receipt and admin queue | **PASS** |
| **Payment Proof & Timestamp** | Receipt URL, UTR, and upload timestamp | `Registration.paymentProof`, `Registration.utrNumber`, `Registration.paidAt` | Displayed in Admin Review Queue | **PASS** |
| **Admin Decision & Audit Note** | Outcome, reviewer ID, timestamp, and audit note | `Registration.paymentStatus`, `Registration.reviewedBy`, `Registration.reviewedAt`, `Registration.adminNote` | Rendered on admin dashboard and student notification | **PASS** |
| **Withdrawal / Refund Trail** | Audit record of squad cancellation and refund | **Unimplemented** | Not present in data layer | **BLOCKED** |

---

## 4. Privacy & Authorization Audit
1. **Horizontal Privilege Escalation (IDOR) Checks:**
   - Evaluated `GET /api/hackathons/:id/registrations`: Non-admin users cannot dump all registrations or view other users' payment screenshots.
   - Evaluated `GET /api/teams/:id`: Non-members can view public squad metadata (name, description), but cannot view pending invitations or private communication.
   - **Result:** Strict authorization checks prevent data leaks between participants.
