# CODESRIJAN — FINANCE, ACCOUNTING & RECONCILIATION GAP ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-08` | **Focus Area**: Event Payments, Accounting Ledgers & Financial Controls  
**Executive Author**: Chief Financial Analyst, Database Architect & Enterprise Security Auditor  

---

## 1. Executive Summary & Reality Check
Uploading a UPI QR code and collecting screenshot files is **not** a payment gateway or an accounting system—it is merely a manual evidence submission queue. If CodeSrijan is to support university hackathons charging ₹100 - ₹500 entry fees or enterprise events with prize pools of ₹1,00,000+, it must implement financial reconciliation, double-approval prevention, duplicate UTR detection, and an immutable transaction ledger.

---

## 2. Forensic Audit of the Current Payment Subsystem

### 2.1 Current Implementation Architecture
- **Participant Surface (`/payment` -> `payment.tsx`)**:
  - Displays event fee (e.g. `₹100`), UPI ID (`codesrijan@upi`), payee name, and dynamic QR image.
  - Inputs: UTR / Transaction Reference Number (`text`), Screenshot File (`file`).
  - Dispatches `POST /api/payments/proof`.
- **Administrative Surface (`/admin/payments` -> `admin.payments.tsx`)**:
  - Table of submitted proofs with UTR and thumbnail.
  - Action buttons: `APPROVE` and `REJECT`.
  - Dispatches `PATCH /api/payments/:id/status`.

---

## 3. Critical Financial Vulnerabilities & Gaps

### 3.1 Duplicate UTR Injection (Double-Spending Attack)
- **Vulnerability**: A participant can submit an identical 12-digit UPI reference number (`123456789012`) for multiple registrations or across multiple teammates.
- **Risk**: Fraudulent teams gain confirmed hackathon access without paying event fees.
- **Remediation**:
  - Create a unique compound index in MongoDB:
    ```javascript
    PaymentProofSchema.index({ transactionId: 1 }, { unique: true });
    ```
  - Enforce server-side duplicate check before accepting proof uploads:
    `if (await PaymentProof.findOne({ transactionId })) throw new Error("Transaction ID has already been submitted.");`

### 3.2 Double-Approval & Race Conditions
- **Vulnerability**: If two administrators click "Approve" simultaneously on the same payment queue item, two confirmation webhooks or email triggers dispatch.
- **Remediation**: Use atomic MongoDB document versioning:
  ```javascript
  const result = await PaymentProof.findOneAndUpdate(
      { _id: proofId, status: 'pending' },
      { $set: { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() } },
      { new: true }
  );
  if (!result) return res.status(409).json({ error: "Payment has already been processed." });
  ```

### 3.3 Zero Financial Ledger / Reconciliation
- **The Gap**: The system does not maintain a double-entry ledger. There is no record of total event gross revenue, platform commissions, net organizer payouts, or pending receivables.
- **Required Data Models**:
  - `FinancialLedgerEntry`:
    - `id`: Unique UUID
    - `hackathonId`: Reference to Event
    - `organizationId`: Reference to Host College
    - `type`: `REGISTRATION_FEE` | `SPONSORSHIP_INFLOW` | `PRIZE_PAYOUT` | `PLATFORM_FEE` | `REFUND`
    - `amount`: Number (in paise / cents to avoid floating-point math errors)
    - `currency`: `INR`
    - `paymentMethod`: `MANUAL_UPI` | `RAZORPAY_GATEWAY`
    - `referenceId`: UTR or Gateway Transaction ID
    - `verifiedBy`: User ID of Reviewer
    - `createdAt`: ISO 8601 Timestamp

---

## 4. Comprehensive Financial Policy Checklist (Decisions Required)

| Policy Area | Unresolved Product Question | Recommended Business Rule |
| :--- | :--- | :--- |
| **Refunds on Cancellation** | If a team cancels before registration closes, are fees refunded? | Non-refundable by default; eligible for credit in future hackathons. |
| **Event Cancellation** | If the organizer cancels the hackathon, who refunds students? | Organizer is legally and financially responsible; platform notifies all affected registrants. |
| **Fee Basis** | Is fee charged per individual hacker or per squad? | Configurable per event: `PER_PERSON` (e.g. ₹100/builder) vs `PER_SQUAD` (e.g. ₹400/team). |
| **Payment Disputes** | What if an admin rejects a valid UPI payment by mistake? | Student can click "Raise Dispute / Re-verify" with an explanation text box. |
| **Prize Distribution** | Does CodeSrijan escrow prize money, or do organizers distribute it? | Phase 1: Direct organizer distribution with signed receipt upload. Phase 2: Platform escrow. |

---

## 5. Exportable Accounting Reports
Administrators and college accountants require exportable CSV / Excel balance sheets:
1. **Gross Revenue Summary**: Total registrations x ticket price vs actual cleared receipts.
2. **Reconciliation Exceptions Log**: Unmatched bank transactions vs submitted screenshots.
3. **Disbursement Ledger**: Track prize payouts, sponsor contributions, and approved expense deductions.

