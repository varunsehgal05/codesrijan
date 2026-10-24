# LIVE EMAIL DELIVERY QA REPORT

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** Agent 5 — Admin Payment Review & Email Verification Specialist  
**Artifact Manifest:** `artifacts/live-e2e-qa/`  

---

## 1. Executive Summary & Cost Boundary Compliance

In strict adherence to mission requirements:
- **Hosting / Service Cost:** **$0.00 / month** (Maintained strictly; zero paid email SaaS or external transactional APIs introduced).
- **Email Infrastructure Utilized:** CodeSrijan's existing dual-relay mechanism:
  1. Google Apps Script Webhook Relay (`APPS_SCRIPT_URL`) with HMAC SHA-256 payload signing.
  2. Fallback SMTP Transport (`nodemailer`) configured with TLS.

Per the mission directive:
> *"Do not silently claim that an email was delivered when only an API response was observed. Distinguish these states: Notification created, Email request accepted by relay, Email sent by mail service, Email delivered or observed in the authorized test inbox. If the dummy address cannot receive email, report delivery as BLOCKED or UNVERIFIED and provide the evidence."*

---

## 2. Delivery Pipeline State Taxonomy

| State | Definition in CodeSrijan Architecture | Observed Evidence Mechanism |
| :--- | :--- | :--- |
| **1. Notification Created** | An in-app notification document is written to MongoDB `notifications` collection. | Database record ID generated. |
| **2. Email Request Accepted** | The backend service compiles template data and hands it to `sendPaymentRejectionEmail` / Apps Script dispatcher. | Async Promise resolved in `server/server.js`. |
| **3. Email Sent by Mail Service** | The Apps Script dispatcher or SMTP transport submits the payload to the mail delivery network. | `paymentNotificationStatus: "sent"` recorded on Registration object. |
| **4. Email Delivered to Inbox** | The recipient inbox receives the message in its IMAP/POP3 inbox folder. | Physical inbox inspection. |

---

## 3. Event-by-Event Verification Matrix

| Notification Event | Recipient | Payload Context Verified | Relay Submission Status | Inbox Delivery Status | Classification |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Team Invitation** | User 2 (`hacker2@codesrijan.com`) | Team `CSQA-Group-A-4198` | Submitted to relay | Unroutable (Dummy domain) | **UNVERIFIED** |
| **Free Registration Confirmation** | User 1 (`hacker1@codesrijan.com`) | `REG-869531`, Fee: ₹0 | Submitted to relay | Unroutable (Dummy domain) | **UNVERIFIED** |
| **Paid Proof Submission** | User 3 (`hacker3@codesrijan.com`) | `REG-205440`, UTR, Fee: ₹200 | Logged: `paymentNotificationStatus: "sent"` | Unroutable (Dummy domain) | **UNVERIFIED** |
| **Payment Declined / Rejection** | User 3 (`hacker3@codesrijan.com`) | Reason: `"Transaction ID mismatch on bank ledger. Please re-upload clear proof."` | Executed via `sendPaymentRejectionEmail` | Unroutable (Dummy domain) | **UNVERIFIED** |
| **Payment Approved** | User 3 (`hacker3@codesrijan.com`) | Event confirmed, receipt attached | Executed via `sendPaymentConfirmationEmail` | Unroutable (Dummy domain) | **UNVERIFIED** |

---

## 4. Root Cause of Delivery Blocker

1. **Domain MX Records:** The authorized test accounts (`hacker1@codesrijan.com`, etc.) utilize a staging domain (`codesrijan.com`) without active public MX mailboxes configured to receive external inbound SMTP deliveries.
2. **Relay Pipeline Health:** The email formatting, template generation, HMAC signing, and dispatch triggers execute without runtime exceptions (`paymentNotificationStatus: "sent"` in MongoDB).
3. **Audit Verdict (CS-019):** **UNVERIFIED (INBOX UNROUTABLE FOR TEST DOMAIN)**. In strict alignment with mission guidelines, we refuse to claim delivery until the domain is configured with active inbound mail routing or an accessible QA mailbox.
