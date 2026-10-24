# LIVE TEAM REGISTRATION QA REPORT

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** Agent 3 (Student & Team Journeys) & Agent 4 (Second Team & Payments)  
**Artifact Manifest:** `artifacts/live-e2e-qa/`  

---

## 1. Executive Summary

End-to-end team lifecycle and registration flows were executed against the live platform using four authorized student operative accounts:
- **User 1:** `hacker1@codesrijan.com` (Cyber Hacker One, 3rd Year IIT Delhi)
- **User 2:** `hacker2@codesrijan.com` (Code Samurai Two, 2nd Year IIT Bombay)
- **User 3:** `hacker3@codesrijan.com` (Byte Ninja Three, 4th Year BITS Pilani)
- **User 4:** `hacker4@codesrijan.com` (Algo Spectre Four, DTU Delhi)

Both Group A (Free Tournament) and Group B (Paid Tournament) successfully completed their complete team formations, member invitation/acceptance flows, and tournament registrations.

---

## 2. Group A Test Journey (Hackathon A — Free Edition)

### Step A1 — Team Creation (CS-003)
- **Operative:** User 1
- **Route:** `POST /api/teams`
- **Payload:** `{ name: "CSQA-Group-A-4198", hackathonId: "hack-free-1792862581267", projectTitle: "Student Life Hub Alpha" }`
- **Result:** HTTP 200 OK. Team ID `t-1792862585921` allocated. User 1 registered as team leader.
- **Verification:** PASS.

### Step A2 — Invitation & Acceptance (CS-004, CS-005)
- **Operative:** User 1 invites User 2 via `POST /api/teams/t-1792862585921/invite`. User 2 accepts via `POST /api/teams/join` with `teamCode: "t-1792862585921"`.
- **Result:** HTTP 200 OK. User 2 added to roster. Both operatives show `teamId: "t-1792862585921"`.
- **Duplicate Membership Check:** User 2 cannot join a second team concurrently (enforced by schema).
- **Verification:** PASS.

### Step A3 — Free Event Registration (CS-006)
- **Operative:** User 1 (Team Leader)
- **Route:** `POST /api/hackathons/hack-free-1792862581267/register`
- **Payload:** `{ teamId: "t-1792862585921", type: "team" }`
- **Result:** HTTP 200 OK.
  - Registration ID: `reg-1792862793832`
  - Registration Number: `REG-869531`
  - Roster: User 1 (Leader), User 2 (Member)
  - Fee Amount: ₹0
  - Payment Status: `not_required`
  - Registration Status: `registered`
- **Verification:** PASS.

---

## 3. Group B Test Journey (Hackathon B — Paid Edition)

### Step B1 — Team Creation (CS-007)
- **Operative:** User 3
- **Route:** `POST /api/teams`
- **Payload:** `{ name: "CSQA-Group-B-0015", hackathonId: "hack-paid-1792862582632", projectTitle: "Smart Campus Navigator" }`
- **Result:** HTTP 200 OK. Team ID `t-1792862591758` allocated. User 3 registered as team leader.
- **Verification:** PASS.

### Step B2 — Invitation & Acceptance (CS-008, CS-009)
- **Operative:** User 3 invites User 4. User 4 accepts and joins roster.
- **Result:** HTTP 200 OK. Team roster confirmed with 2 members.
- **Verification:** PASS.

### Step B3 — Paid Event Registration & Fee Calculation (CS-010, CS-011)
- **Operative:** User 3 (Team Leader)
- **Route:** `POST /api/hackathons/hack-paid-1792862582632/register`
- **Payload:** `{ teamId: "t-1792862591758", type: "team" }`
- **Result:** HTTP 200 OK.
  - Registration ID: `reg-1792862807255`
  - Registration Number: `REG-205440`
  - Fee Calculation: 2 participants × ₹100 = **₹200** (`feeBasis: "per_participant"`)
  - Payment Status: `pending_proof`
  - Registration Status: `awaiting_payment_proof`
- **Verification:** PASS.

### Step B4 — Payment Proof Submission (CS-016)
- **Operative:** User 3
- **Route:** `POST /api/hackathons/hack-paid-1792862582632/payment-proof`
- **Payload:**
  ```json
  {
    "transactionReference": "UTR-QA-GROUPB-PAID-1792862",
    "paymentProofUrl": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800"
  }
  ```
- **Result:** HTTP 200 OK.
  - `paymentStatus`: `payment_under_review`
  - `status`: `payment_under_review`
  - `transactionReference`: `UTR-QA-GROUPB-PAID-1792862`
  - `paymentNotificationStatus`: `sent`
- **Verification:** PASS.

---

## 4. Test Case Summary

| Test ID | Scenario | Operative | Expected Result | Actual Result | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **CS-003** | Create Group A | User 1 | Team created with User 1 as leader | `t-1792862585921` created with User 1 leader | **PASS** |
| **CS-004** | Invite User 2 to Group A | User 1 | Invitation sent successfully | Invitation dispatched | **PASS** |
| **CS-005** | Accept Group A Invitation | User 2 | User 2 added to Group A roster | Roster confirmed (2 members) | **PASS** |
| **CS-006** | Register Group A for Free Event | User 1 | Registration created, ₹0 fee, `not_required` | `REG-869531`, ₹0 fee, `registered` | **PASS** |
| **CS-007** | Create Group B | User 3 | Team created with User 3 as leader | `t-1792862591758` created with User 3 leader | **PASS** |
| **CS-008** | Invite User 4 to Group B | User 3 | Invitation sent successfully | Invitation dispatched | **PASS** |
| **CS-009** | Accept Group B Invitation | User 4 | User 4 added to Group B roster | Roster confirmed (2 members) | **PASS** |
| **CS-010** | Register Group B for Paid Event | User 3 | Registration created, status awaiting proof | `REG-205440`, status `pending_proof` | **PASS** |
| **CS-011** | Check Group B Fee Calculation | User 3 | 2 members × ₹100 = ₹200 fee | `feeAmount: 200`, `currency: INR` | **PASS** |
| **CS-016** | Submit Payment Proof with UTR | User 3 | Status becomes `payment_under_review` | `payment_under_review`, UTR recorded | **PASS** |
