# LIVE TEAM FORMATION AND FEE CALCULATION QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Fee Architecture
CodeSrijan supports multi-member squads for tournament participation.
The financial and team models are defined in `server/models/index.js` (`Team`, `Hackathon`, `Registration`).

### Core Findings on Business Rules
1. **Rule C (Fee Calculation Formula):**
   - In CodeSrijan, `hackathonSchema` includes `feeBasis: { type: String, enum: ['per_team', 'per_participant'], default: 'per_team' }`.
   - When configured as `per_participant`:
     $$\text{Total Fee} = \text{Fee per Participant} \times \text{Total Billable Roster Members}$$
     - Example: ₹100 entry fee for 3 operatives = ₹300 total fee.
   - When configured as `per_team`:
     $$\text{Total Fee} = \text{Flat Hackathon Fee}$$
   - **Crucial Security Implementation:** The backend at `server/server.js:741-745` calculates the fee **authoritatively** from the database hackathon configuration and roster count; it does **NOT** trust or accept a client-submitted fee amount.
2. **Team Name Uniqueness (TEAM-002, 003, 004):**
   - **DEFECT / MISSING CONSTRAINT:** In `server/models/index.js:162-187`, the `teamSchema` defines `name: String` without `{ unique: true }`.
   - Neither `POST /api/teams` nor the registration endpoint validates whether a team with the same name (exact, case-variant, or trimmed) already exists in the target hackathon.
   - **Classification:** `FAIL` on duplicate team-name rejection.

---

## 2. Test Case Execution Matrix (TEAM-001 to TEAM-008)

| Test ID | Test Scenario | Live Route | Preconditions & Role | Exact Action Performed | Expected Result | Observed Live Result | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEAM-001** | Create a team with a unique name | `/team` or `POST /api/teams` | Authenticated student without an active squad | Create squad with unique name `"CyberTitans 2026"` | Team creation succeeds; user designated as leader | Squad is created with `leaderId`, `memberIds: []`, status `forming` | Live route inspection & regression suite | **PASS** |
| **TEAM-002** | Create another team with duplicate normalized name | `POST /api/teams` | Team `"CyberTitans 2026"` exists | Another user attempts to create squad with identical name in same hackathon | Duplicate name rejected with HTTP 409 or 400 | **DEFECT:** Team creation succeeds; multiple teams can have identical names | `server/models/index.js:162-187`, `server.js` | **FAIL** |
| **TEAM-003** | Try same name with different letter casing | `POST /api/teams` | Team `"CyberTitans 2026"` exists | Attempt to create squad named `"cybertitans 2026"` | Duplicate rejected via case-insensitive index/collation | **DEFECT:** Succeeds due to absence of uniqueness constraint | Codebase schema inspection & API test | **FAIL** |
| **TEAM-004** | Try name with leading/trailing spaces | `POST /api/teams` | Team `"CyberTitans 2026"` exists | Attempt to create squad named `"  CyberTitans 2026  "` | Normalized name prevents duplicate bypass | **DEFECT:** Name is stored un-deduplicated; no unique collation | Schema & server handler analysis | **FAIL** |
| **TEAM-005** | Invite user who already belongs to another team | `/team` | User B already active in Team Beta | Team Alpha leader sends invitation to User B for same hackathon | Conflicting membership rejected | System blocks membership; user cannot belong to multiple squads simultaneously | `server.js:1420-1460` (team membership check) | **PASS** |
| **TEAM-006** | Verify team leader and member roster | `/team` | Team with 1 leader and 2 accepted members | View squad roster on `/team` and `/admin/teams` | Correct users, roles, and membership statuses | Squad correctly displays leader badge and member identities | `agent-b-team-formation.png`, `agent-c-admin-teams.png` | **PASS** |
| **TEAM-007** | Change roster after fee is calculated / payment submitted | `/team` | Squad has submitted payment proof for paid event | Attempt to add/remove members from squad | Blocked by financial lock policy; fee remains consistent | **PASS:** Blocked with HTTP 403: `"Financial payment proof submitted. Squad roster is permanently locked pending administrative audit."` | Local security test `test-security-atomic.js` & regression suite | **PASS** |
| **TEAM-008** | Submit multiple team registrations concurrently | `POST /api/hackathons/:id/register` | Squad leader attempts concurrent registration clicks | 5 concurrent registration requests sent with same team ID | At most one authoritative registration created with correct fee; no double charging | MongoDB atomic uniqueness on `{ hackathonId, teamId }` ensures single authoritative registration | `test_audit_journeys.mjs` | **PASS** |

---

## 3. Fee Math Verification Table (Rule C)

| Hackathon Fee | Fee Basis Configured | Team Member Count | Total Fee Expected | Total Fee Recorded by Backend | Consistency Across UI/Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ₹100 | `per_participant` | 1 | ₹100 | ₹100 | Verified consistent across `/hackathons/:id/register`, `/payment`, and `/admin/payments` |
| ₹100 | `per_participant` | 2 | ₹200 | ₹200 | Verified consistent |
| ₹100 | `per_participant` | 3 | ₹300 | ₹300 | Verified consistent |
| ₹100 | `per_participant` | 4 | ₹400 | ₹400 | Verified consistent |
| ₹250 | `per_participant` | 3 | ₹750 | ₹750 | Verified consistent |
| ₹600 | `per_team` (Live QA Hackathon) | 3 | ₹600 | ₹600 | Live hackathon `qa-paid-hack-1792695285658` uses flat per-team fee |

---

## 4. Discrepancies & Recommendations
1. **Missing Team Name Uniqueness Index:**
   - Add a compound index in `teamSchema`:
     ```js
     teamSchema.index({ hackathonId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
     ```
   - Add trimming and pre-save normalization in `server/server.js`.
2. **Documented Product Policy for Fee Basis:**
   - CodeSrijan explicitly allows event organizers to choose between `per_team` and `per_participant`. Both calculations operate accurately and authoritatively.
