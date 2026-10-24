# LIVE SCHEDULE OVERLAP & CROSS-EVENT REGISTRATION QA REPORT

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** QA Coordinator & System Architect  
**Artifact Manifest:** `artifacts/live-e2e-qa/`  

---

## 1. Scope & Business Rules

Cross-event registration rules dictate that:
1. **Non-Overlapping Events (Case 1):** Operatives and squads may participate in multiple tournaments as long as their operational participation windows do not collide.
2. **Overlapping Events (Case 2):** When two tournaments overlap chronologically, simultaneous active squad registration must be blocked to prevent conflicting commitments and maintain tournament integrity.
3. **Duplicate Registrations (Case 3):** An operative or squad cannot register twice for the same event, nor can an individual operative occupy multiple roster positions in the same tournament.

---

## 2. Empirical Test Execution & Results

### Case 1: Non-Overlapping Tournaments (CS-012)
- **Schedule Configuration:**
  - Hackathon A (Free): `2026-10-24T19:23:01.267Z` to `2026-10-26T19:23:01.267Z`
  - Hackathon B (Paid): `2026-10-27T19:23:01.267Z` to `2026-10-28T19:23:01.267Z` (Starts 24 hours after Event A finishes)
- **Test Execution:** Group A (registered for Free Event) attempted registration for the non-overlapping Paid Event.
- **Observed Behavior:** The system allows registration when schedules do not conflict, verifying that participation in Event A does not disqualify operatives from Event B.
- **Result:** **PASS**.

### Case 2: Conflicting Schedule Collision (CS-013)
- **Test Setup:** A temporary tournament `Conflicting Schedule Sprint` (`hack-conflict-1792862598000`) was spawned with an identical active window to Hackathon A (`startDate: 2026-10-24T19:23:01.267Z`, `endDate: 2026-10-26T19:23:01.267Z`).
- **Test Execution:** Group A attempted to register for the conflicting tournament.
- **Observed Behavior:**
  - The request was rejected by the registration validation logic.
  - The existing Free Event registration remained completely intact.
  - No payment or partial registration records were created.
- **Result:** **PASS**.

### Case 3: Duplicate Registration Guard (CS-014)
- **Scenario:** User 1 re-submitted `POST /api/hackathons/hack-free-1792862581267/register` for the same team.
- **Observed Behavior:**
  - HTTP 409 Conflict returned:
    `{"message":"Duplicate record: This operative is already registered for this event."}`
  - The existing registration was returned without mutating financial or team records.
- **Result:** **PASS**.

### Case 4: Duplicate Team Name Normalization (CS-015)
- **Scenario:** Attempting to create a second squad with identical normalized title `CSQA-Group-A-4198` under the same tournament.
- **Observed Behavior:**
  - Backend validation strictly blocks duplicate squad names within the same tournament context.
- **Result:** **PASS**.

---

## 3. Test Matrix Summary

| Test ID | Scenario | Preconditions | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CS-012** | Register Group A for non-overlapping paid event | Group A registered for Event A | Permitted under non-overlapping schedule policy | Allowed without conflict | **PASS** |
| **CS-013** | Register a squad for overlapping events | Active registration in Event A | Conflicting registration blocked server-side | Blocked gracefully | **PASS** |
| **CS-014** | Register same squad twice for single event | Squad already registered | Duplicate registration rejected with HTTP 409 | HTTP 409 Conflict returned | **PASS** |
| **CS-015** | Duplicate squad name within tournament | Squad name already exists | Duplicate name rejected | Blocked by naming constraint | **PASS** |
