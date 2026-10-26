# CODESRIJAN 1.0 — HACKATHON, SQUAD, SUBMISSION & LEADERBOARD QA REPORT
**Subagent Designation:** Subagent F (Competition Workflows, Tournament Lifecycle & Judging QA)  
**Document Version:** 1.0.0-RELEASE  
**Production Frontend:** [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Production Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  
**Verification Scope:** End-to-end tournament operations from catalog discovery to winner declaration.  

---

## 1. TOURNAMENT LIFECYCLE VERIFICATION

| Tournament Phase | Schedule Condition | Server Authoritative Rule | UI Behavior & State Effect | Test Status |
|---|---|---|---|---|
| **Upcoming** | `currentTime < registrationStartDate` | Registration blocked | Countdown timer active; `REGISTER` disabled. | **PASS — VERIFIED** |
| **Registration Open** | `registrationStartDate <= currentTime < registrationEndDate` | Open enrollment | Wizard enabled; fee calculated; team selection active. | **PASS — VERIFIED** |
| **Active Tournament** | `hackathonStartDate <= currentTime < submissionDeadline` | Problem statements revealed | Problem statements decrypted; workspace scratchpad enabled. | **PASS — VERIFIED** |
| **Evaluation Phase** | `submissionDeadline <= currentTime < evaluationEndDate` | Submissions locked | Submissions disabled; judge grading consoles unlocked. | **PASS — VERIFIED** |
| **Concluded** | `currentTime >= evaluationEndDate` | Tournament completed | Final rankings published; certificates batch-generated. | **PASS — VERIFIED** |

### Key Rule:
Start dates, end dates, and submission deadlines are enforced exclusively by the Render backend server time. Client browser clock tampering cannot unlock problem statements prematurely or permit late project submissions.

---

## 2. PROBLEM STATEMENT CONFIDENTIALITY
- **Pre-Start Encryption:** Prior to the tournament start timestamp, `GET /api/problems` and `GET /api/hackathons/:id/problems` redact problem details and deliverables unless the requester has `role === 'admin'`.
- **Manual Reveal Control:** Administrators can override release via `PATCH /api/admin/hackathons/:id/reveal-problems`.
- Verified in `src/routes/problems.tsx` and tested in `server/test_admin_health_and_ops.mjs`.

---

## 3. SQUAD CREATION & ROSTER LOCKING
- **Team Size Bounds:** 1 to 4 members per squad.
- **Unique Name Constraint:** Duplicated squad names within the same hackathon return `HTTP 400 Bad Request`.
- **Roster Lock Enforcement:** Once locked (`POST /api/teams/:id/lock`), members cannot leave, dissolve, or invite new operatives. Attempted mutations return `HTTP 400 Squad roster is locked`.
- Verified in `node --test server/test-security-local.mjs` (Scenario: locked roster blocks leave, dissolve and transfer).

---

## 4. JUDGE SCORING & LEADERBOARD ACCURACY
- **Four-Pillar Rubric:**
  1. Innovation & Originality (0 - 25 points)
  2. Technical Execution & Architecture (0 - 25 points)
  3. Design, UI & User Experience (0 - 25 points)
  4. Real-World Impact & Feasibility (0 - 25 points)
  - Total Maximum: 100 points.
- **Unevaluated Squad Handling:**
  - Squads awaiting evaluation are excluded from ranked tiers with un-fabricated scores.
  - Verified on live `/leaderboard` and in `server/test_focused_regression.mjs`.
- **Disqualification Handling:**
  - Disqualified squads receive zero rank on public leaderboards and an explicit administrative notice.

---

## 5. CONCLUSION
The competition workflow operates with strict server-side authority, tamper-resistant judging algorithms, and verified pre-start confidentiality.
