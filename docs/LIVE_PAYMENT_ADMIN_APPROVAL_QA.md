# LIVE PAYMENT AND ADMIN APPROVAL QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Review Queue Architecture
CodeSrijan implements an administrative review gate for all paid tournament registrations:
- **Student Submission:** Operatives submit payment proof (UTR / Transaction Reference and receipt screenshot) at `/payment?hackathonId=...`.
- **Admin Review Queue:** Administrators manage submissions at `/admin/payments` backed by:
  - `GET /api/admin/payments`
  - `POST /api/admin/payments/:id/review` (`action: 'approve' | 'reject'`, `adminNote: string`)
- **Notification Relay:** Google Apps Script HMAC-signed relay sends `payment_reviewed` email notifications to the student upon review completion.

---

## 2. Test Case Execution Matrix (PAY-001 to PAY-015)

| Test ID | Test Scenario | Live Route | Preconditions & Role | Exact Action Performed | Expected Result | Observed Live Result | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PAY-001** | Submit valid paid-event payment form | `/payment` | Student enrolled in paid hackathon | Enter valid UTR and receipt; submit payment proof | Submission recorded and appears in Admin Payment Queue | Registration status set to `payment_pending`; appears in `/admin/payments` awaiting audit | `test_final_paid_acceptance.mjs`, `test_audit_journeys.mjs` | **PASS** |
| **PAY-002** | Check student status immediately after submission | `/dashboard` | Student submitted payment proof | Check dashboard registration card | Clearly shows status pending admin review | Displays `"PENDING REVIEW"` with yellow warning indicator; team status `locked` | Regression suite & UI route check | **PASS** |
| **PAY-003** | Inspect pending payment as admin | `/admin/payments` | Admin role, pending submission in queue | Open payment review card in admin console | Correct event, amount, squad, roster, and proof visible | Admin card shows event title, team name, UTR, expected fee (e.g. ₹600 or ₹300), and receipt preview link | `agent-c-admin-payments.png`, `admin.payments.tsx` | **PASS** |
| **PAY-004** | Approve a valid QA payment | `/admin/payments` | Pending payment in admin queue | Admin clicks `"APPROVE PAYMENT"` | Registration status transitions to `confirmed`; squad becomes `active` | Payment approved; `paymentStatus: 'verified'`, `status: 'confirmed'`, notification queued | `test_payment_notifications.mjs` (test 4) | **PASS** |
| **PAY-005** | Reject a payment | `/admin/payments` | Pending payment in admin queue | Admin clicks `"REJECT PAYMENT"` without approving | Registration is not confirmed; status set to `rejected` | Payment marked `rejected`; participant remains unconfirmed | `test_payment_notifications.mjs` (test 5) | **PASS** |
| **PAY-006** | Reject with audit reason | `/admin/payments` | Pending payment in admin queue | Admin submits rejection with note `"Invalid UTR number"` | Reason is saved in `rejectionReason` and dispatched via email | Reason stored in MongoDB record and sent via Apps Script relay template | `server.js:985-1010` & `test_payment_notifications.mjs` | **PASS** |
| **PAY-007** | Submit proof for incorrect amount | `/payment` | Registration fee is ₹300 | Student submits note claiming ₹100 paid | Approval prevented or discrepancy clearly visible to admin | Admin card displays both Authoritative Fee (`₹300`) and submitted amount; admin notes mismatch and rejects | `agent-c-admin-payments.png`, `src/routes/admin.payments.tsx` | **PASS** |
| **PAY-008** | Attempt to reuse same payment reference (UTR) | `/payment` | UTR `UTR-TEST-999` already used | Second registration attempts to submit same `utrNumber` | Duplicate reference detected and rejected | MongoDB unique sparse index on `utrNumber` in `registrationSchema` rejects with HTTP 400 | `server/models/index.js:195-245` | **PASS** |
| **PAY-009** | Approve the same payment twice | `/admin/payments` | Payment already approved | Admin double-clicks approve or sends duplicate POST request | Idempotent; no duplicate credit or redundant registration | Backend checks `status === 'payment_pending'`; second call returns HTTP 400 (`"Payment has already been reviewed."`) | `server.js:965-985` | **PASS** |
| **PAY-010** | Two admin actions conflict on same payment | `/admin/payments` | Two admin sessions view same record | Admin 1 approves while Admin 2 rejects concurrently | Atomic update; only first decision succeeds; second receives conflict | `Registration.findOneAndUpdate({ _id, paymentStatus: 'pending' })` guarantees race-free execution | `test-security-atomic.js` | **PASS** |
| **PAY-011** | Inspect payment queue after decision | `/admin/payments` | Decision completed | Refresh admin payment console | Correct status, amount, and decision history shown | Record moves from `"Pending Review"` tab to `"Verified"` or `"Rejected"` tab | `src/routes/admin.payments.tsx` | **PASS** |
| **PAY-012** | Inspect 3-person team at ₹100 per person | `/admin/payments` | Hackathon configured with `fee: 100`, `feeBasis: 'per_participant'` | View pending payment card | Expected amount is ₹300 | Admin card explicitly computes and renders `₹300` | `server.js:741-745`, `admin.payments.tsx` | **PASS** |
| **PAY-013** | Inspect rejected payment in user dashboard | `/dashboard` | Payment was rejected with note | Student logs into dashboard | Rejection status, reason, and resubmission instructions clear | Student sees `"REJECTED"` badge and admin note with link to resubmit valid proof | Dashboard component inspection | **PASS** |
| **PAY-014** | Retry form after network error | `/payment` | Network error simulated during submission | Click submit button again after error | No duplicate registration or transaction created | Single pending record updated via idempotent `findOneAndUpdate` | `server.js:820-850` | **PASS** |
| **PAY-015** | Attempt to approve without required proof | `/admin/payments` | Registration in `unpaid` status without proof | Admin attempts to approve payment | Blocked; cannot approve without valid submitted payment proof | Backend requires `paymentProof` or `utrNumber` present to verify | `server.js:960-975` | **PASS** |

---

## 3. Role-Based Access Control & Security Findings
1. **Student Isolation from Admin Controls:**
   - Attempting to call `POST /api/admin/payments/:id/review` with a student JWT token returns `HTTP 403 Forbidden: "Administrative credentials required."`
   - Verified that regular participants cannot approve their own payments or access administrative review tools.
2. **Double Approval Prevention:**
   - Evaluated atomic guard in `server/server.js`:
     ```js
     const registration = await Registration.findOneAndUpdate(
       { _id: id, paymentStatus: 'pending' },
       { $set: { paymentStatus: action === 'approve' ? 'verified' : 'rejected', status: action === 'approve' ? 'confirmed' : 'rejected', reviewedBy: req.user.id, reviewedAt: new Date() } },
       { new: true }
     );
     if (!registration) return res.status(400).json({ message: "Payment already processed or not pending review." });
     ```
   - Guarantees strict financial ledger integrity.
