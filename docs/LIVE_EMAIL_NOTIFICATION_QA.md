# LIVE EMAIL NOTIFICATION QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Relay Mechanism:** Google Apps Script Web App Dispatcher (`server/services/email.js`)

---

## 1. Executive Summary & Relay Architecture
CodeSrijan maintains a strict **$0/month infrastructure budget** and dispatches outbound transactional emails using an authenticated Google Apps Script Web App dispatcher via HMAC-SHA256 signed POST payloads (`x-codesrijan-signature`, `x-codesrijan-timestamp`).

### Secret Hygiene & Safety Verification
- **Zero Exposed Secrets:** Email templates never include user passwords, session tokens, JWTs, or database identifiers.
- **Premature Claims:** The backend dispatches `payment_reviewed` **only after** atomic Mongoose transaction completion.

---

## 2. Notification Scenarios Verification Matrix

| Notification Scenario | Template Key | Intended Recipient | Data Elements Verified | Actual Live Delivery Proof | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Registration submitted** | `registration_confirmed` | Enrolling Student | Hackathon name, team ID, registration status | Payload generated with tournament metadata; live test inbox unverified | **UNVERIFIED** (Dispatched, Delivery Unchecked) |
| **Payment proof submitted** | `payment_submitted` | Squad Leader & Student | UTR, Hackathon Name, Submitted Amount, Pending Notice | Triggered on `/payment` submission; template payload verified | **UNVERIFIED** |
| **Payment under review** | `payment_under_review` | Admin notification inbox | Squad Name, UTR, Event, Expected Amount | Dispatched to `ADMIN_NOTIFICATION_EMAIL`; delivery unmonitored | **UNVERIFIED** |
| **Payment approved** | `payment_reviewed` (`status: verified`) | Squad Leader & Members | Hackathon name, Amount, Status: Confirmed, Next Steps | Verified via automated dispatcher test (`test_payment_notifications.mjs`) | **UNVERIFIED** (Live Inbox) / **PASS** (Payload) |
| **Payment rejected** | `payment_reviewed` (`status: rejected`) | Squad Leader | Hackathon name, Rejection Reason, Correction link | Verified with `rejectionReason: 'Invalid UTR reference'` | **UNVERIFIED** (Live Inbox) / **PASS** (Payload) |
| **Rejection reason provided** | `payment_reviewed` | Squad Leader | Specific audit feedback from administrator | Reason string correctly bound in email template body | **PASS** (Format verified) |
| **Payment / proof resubmitted** | `payment_resubmitted` | Admin Notification | Resubmitted UTR, Event ID, Prior Rejection Note | Handled through repeated `/payment` POST; payload confirmed | **UNVERIFIED** |
| **Registration confirmed** | `registration_confirmed` | Student | Hackathon dates, venue/online URL, squad role | Dispatched upon admin verification or free event entry | **UNVERIFIED** |
| **Team successfully registered** | `team_registered` | Squad Leader & Members | Team name, tournament name, roster summary | Roster details correctly populated | **UNVERIFIED** |
| **Team member invited** | `team_invitation` | Invited User Email | Squad name, Inviter name, Invitation link | Link generated with secure token (`/invite/:token`) | **PASS** (Format verified) |
| **Invitation accepted / rejected** | `invitation_response` | Squad Leader | Member name, Decision: Accepted/Declined | Dispatched on invitation resolution | **UNVERIFIED** |
| **Registration withdrawn** | N/A | Student | N/A | **Unimplemented:** No withdrawal feature exists in CodeSrijan | **BLOCKED** |
| **Refund initiated** | N/A | Paying Student | N/A | **Unimplemented:** No refund architecture exists in CodeSrijan | **BLOCKED** |
| **Refund completed / failed** | N/A | Paying Student | N/A | **Unimplemented:** No refund architecture exists in CodeSrijan | **BLOCKED** |
| **Free hackathon registration** | `free_registration_confirmed` | Student | Hackathon name, ₹0 Fee Notice, Squad Creation Link | Free enrollment generates confirmed record | **UNVERIFIED** |

---

## 3. Discrepancy & Observability Recommendations
1. **Inbox Delivery Telemetry:**
   - Because the live Google Apps Script endpoint runs on Google's free execution tier without an outbound delivery webhook, delivery to user inboxes cannot be cryptographically acknowledged by the backend API.
   - Per Section 7 instructions, external receipt is recorded as **UNVERIFIED** rather than assumed.
2. **Missing Notification Events:**
   - Withdrawal and refund notification templates (`withdrawal_confirmed`, `refund_processed`) must be authored in `server/services/email.js` once Rule E business logic is created.
