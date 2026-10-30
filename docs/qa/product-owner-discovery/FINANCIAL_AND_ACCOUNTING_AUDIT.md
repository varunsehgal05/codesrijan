# CODESRIJAN — FINANCIAL AND ACCOUNTING AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal Financial Systems Architect & Senior Backend Engineer  
**Perspective:** Corporate Comptroller & Certified Accountant  
**Core Subject:** Evaluation of CodeSrijan's Payment Subsystem, Revenue Tracking, and Financial Integrity  

---

## 1. Executive Summary & Reality Check

> **CRITICAL ARCHITECTURAL DISTINCTION:**  
> CodeSrijan's existing payment system is **NOT an automated payment gateway**.  
> It is an **asynchronous manual UPI QR verification pipeline** designed to operate at **$0.00/month infrastructure cost** without payment gateway merchant account setup fees, KYC friction, or transaction gateway commissions (e.g. 2% + GST).

While this manual proof workflow is functional for small student hackathons (50-200 teams), it possesses significant accounting gaps when evaluated as an institutional multi-tenant financial engine.

---

## 2. Participant Payments Audit

| Financial & Audit Question | Actual Implementation State | Evidence in Source Code |
| :--- | :--- | :--- |
| **Does each payment have a unique transaction record?** | ⚠️ **NO independent transaction collection.** Payment data is stored as sub-fields directly inside the `Registration` document. | `server/models/index.js` (`registrationSchema` lines 126-150). |
| **Is there a unique reference ID?** | ✅ **YES.** The 12-digit UPI UTR number is indexed: `transactionReference: { type: String, index: true }`. | `Registration.transactionReference` indexed in MongoDB. |
| **Is payment linked to user, team, and hackathon?** | ✅ **YES.** Bound via `Registration.userId`, `Registration.teamId`, and `Registration.hackathonId`. | Enforced by compound unique index `{ hackathonId: 1, userId: 1 }`. |
| **Can a participant upload payment proof?** | ✅ **YES.** Multipart file upload via Multer, stored in MongoDB GridFS with MIME and size tracking. | `storageProvider: 'gridfs'`, `paymentProofUrl`. |
| **Can proof be reviewed by administrators?** | ✅ **YES.** Full-featured administrative review modal on `/admin/payments`. | `POST /api/admin/payments/:id/verify` & `/reject`. |
| **Are pending, approved, and rejected statuses maintained?** | ✅ **YES.** Strict enum: `['not_required', 'pending_proof', 'payment_under_review', 'verified', 'rejected']`. | `registrationSchema` line 128. |
| **Is the reviewer identity recorded?** | ✅ **YES.** `reviewedBy` (stores admin `userId`) and `reviewedAt` timestamp. | `Registration.reviewedBy`, `Registration.reviewedAt`. |
| **Are rejection reasons saved?** | ✅ **YES.** `reviewReason` string captures mandatory reason and appends to `reviewHistory`. | Captured in `reviewHistory: [{ status, reason, reviewedBy, timestamp }]`. |
| **Can duplicate proofs or approvals occur?** | ⚠️ **PARTIAL RISK.** If two different students upload the exact same UTR number, the backend returns a 409 error. However, image hashing is not implemented, so duplicate screenshots with slightly edited UTRs can slip through. | Monitored by UTR string match only. |
| **Can participants see payment history?** | ⚠️ **PARTIAL.** Students see their current hackathon payment state on `/payment` and `/dashboard`. They cannot view a multi-event historical receipt vault. | Only active registration is rendered. |
| **Is there a dispute / appeal mechanism?** | ❌ **NO.** If rejected, students must create a generic support ticket under `/support`. | No dedicated payment dispute workflow. |

---

## 3. Organizer Finance Audit

| Organizer Financial Question | Current Status | Analysis & Missing Capabilities |
| :--- | :---: | :--- |
| **Can organizers view their event income?** | ⚠️ Global Admin Only | Super-admin dashboard displays aggregate revenue settled (`₹42,300`). External organizers cannot view an isolated financial statement. |
| **Can they see total registrations vs verified payments?** | ✅ Implemented | Telemetry breakdown on `/admin/payments` and `/admin/health` shows verified vs pending counts. |
| **Can they distinguish pending payments from actual receipts?** | ✅ Implemented | Clean visual separation between `payment_under_review` (pending) and `verified` (settled cash). |
| **Is there a double-entry transaction ledger?** | ❌ **NOT IMPLEMENTED** | There are no debits, credits, account charts, or ledger balances. If a registration status is edited in MongoDB, there is no immutable ledger entry. |
| **Can they export financial reports?** | ⚠️ **MISSING** | No 1-click CSV/Excel export button on `/admin/payments`. Organizers must manually copy-paste or query the database. |
| **Are payment corrections audited?** | ✅ Implemented | `reviewHistory` array logs status changes, reviewer names, and timestamps. |
| **Can they manage refunds?** | ⚠️ **PARTIAL SCHEMA ONLY** | The schema contains `refundRequested`, `refundReason`, `refundUpi`, and `refundRequestedAt`, but there is **no refund execution UI** or payout mechanism. |
| **Can they record event expenses?** | ❌ **NOT IMPLEMENTED** | No ledger to record venue rental, food/catering, audio-visual, or swag costs. |
| **Can they record sponsorship amounts?** | ❌ **NOT IMPLEMENTED** | `/admin/sponsors` stores sponsor tiers and logos, but no contract amounts, invoicing dates, or payment receipts. |
| **Can they record prize distributions?** | ❌ **NOT IMPLEMENTED** | Prize amounts are displayed as static text; no bank account capture or prize remittance tracking exists. |

---

## 4. Platform-Level Finance & Multi-Tenancy

1. **Does CodeSrijan currently charge organizers or participants?**
   - **Participants:** Yes, if the active hackathon is marked `entryType: 'paid'` (e.g. ₹100).
   - **Organizers:** No. Platform usage is currently free.
2. **Is a platform commission implemented?**
   - **NO.** There is no split-payment logic or percentage take (e.g. 5% platform fee).
   - Because payments are made directly to the organizer's personal or institutional UPI ID, 100% of the funds go directly into the organizer's bank account.
3. **Can the super-admin view all event transactions?**
   - Yes, globally across all events via `/admin/payments`.
4. **Are organizer financial records isolated?**
   - **NO.** All payment records reside in the shared `registrations` collection. Without tenant isolation, any admin sees all payments.
5. **Is there a settlement or payout system?**
   - **NO.** Because students pay the organizer's UPI ID directly, CodeSrijan never holds custody of funds, eliminating escrow and payout requirements.

---

## 5. Accounting Vulnerabilities & Integrity Risks

```
[Vulnerability 1: Direct UPI Friction]
Student sends ₹100 via Google Pay -> Enters UTR "123456789012" -> Attaches screenshot
Risk: Bank statement reconciliation is 100% human-dependent. If an admin approves
without verifying the bank account, the team enters without actually paying.

[Vulnerability 2: No Automated Refund Pipeline]
If an event is cancelled or postponed, the organizer must manually open Google Pay/PhonePe,
look up each student's UPI ID, and manually transfer funds back one by one.
```

---

## 6. Financial Policy Decisions Requiring Product Owner Approval

The following financial decisions **cannot be solved by code** and require explicit owner determination:

1. **Payment Model Selection:**
   - *Option A (Keep Current):* Direct Organizer UPI QR (Zero gateway fees, 100% free, manual verification required).
   - *Option B (Automated Gateway):* Razorpay / Cashfree integration (Instant automatic clearance, webhook verification, 2% + GST fee per transaction, requires registered business entity).
2. **Platform Monetization Strategy:**
   - Will CodeSrijan remain 100% free for colleges, charge a flat hosting fee per hackathon (e.g., ₹2,999/event), or take a percentage commission on paid registrations?
3. **Refund & Cancellation Responsibility:**
   - If an organizer cancels an event after collecting ₹50,000 in student fees, who holds legal and financial liability to refund the students?
4. **Prize Money Custody:**
   - Should prize money be held in escrow by CodeSrijan prior to event kickoff, or paid out directly by sponsors/colleges post-event?

---

*Verified from payment controller and registration schema in `server/server.js`.*
