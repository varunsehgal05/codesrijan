# LIVE REGISTRATION AND SCHEDULING QA REPORT
**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-23  
**Auditor:** Lead QA & Browser Automation Engineer  
**Evidence Artifacts:** `artifacts/live-e2e-qa/`

---

## 1. Executive Summary & Architecture Analysis
The CodeSrijan student registration system enforces enrollment via the route `/hackathons/:id/register` backed by `POST /api/hackathons/:id/register`.

### Critical Findings on Business Rules
1. **Rule A (Registration Uniqueness):**
   - **Enforced:** The backend checks `Registration.findOne({ hackathonId, userId })`. If an active registration exists, duplicate registration is rejected with `HTTP 400: "You are already registered for this hackathon."`
   - **Enforced:** Solo vs Team duplicate participation prevention is implemented; a user who is registered solo cannot register a second time with a squad.
2. **Rule B (No Overlapping Hackathon Schedules):**
   - **DEFECT / UNENFORCED:** In `server/server.js:684-740`, `POST /api/hackathons/:id/register` evaluates only the singular target hackathon ID. It does **NOT** query or compare `startDate` and `endDate` against the user's other registered hackathons.
   - **Observed Behavior:** A student can register for multiple tournaments running simultaneously (e.g. `hack-demo-1` running Oct 10–13 and an overlapping event) without receiving any schedule conflict error.
   - **Classification:** `FAIL` / `BLOCKED — MISSING PRODUCT POLICY & ENFORCEMENT`.

---

## 2. Test Case Execution Matrix (REG-001 to REG-012)

| Test ID | Test Scenario | Live Route | Preconditions & Role | Exact Action Performed | Expected Result | Observed Live Result | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REG-001** | Register for an eligible free hackathon | `/hackathons/hack-demo-1/register` | Student role (`student@codesrijan.com`), Free event `hack-demo-1` | Attempted registration on free hackathon | One valid registration created; ₹0 fee; no payment proof required | Free hackathon correctly bypasses payment gateway and prompts squad formation | `agent-a-hackathon-details.png`, `agent-a-student-reg.png` | **PASS** |
| **REG-002** | Submit the same registration twice | `/hackathons/hack-demo-1/register` | Student registered for `hack-demo-1` | Re-submit registration form for identical event | Duplicate registration blocked with explanatory error | Backend rejects with HTTP 400 (`"You are already registered for this hackathon."`) | Backend regression suite & live route check | **PASS** |
| **REG-003** | Refresh during registration | `/hackathons/:id/register` | Student on registration page | Refresh browser during form processing | No duplicate records created, idempotent state | Route reloads clean form state without duplicate submission | `live_browser_audit_results.json` | **PASS** |
| **REG-004** | Register for a paid event | `/hackathons/qa-paid-hack-1792695285658/register` | Student role, Paid hackathon (`entryType: paid`, fee: ₹600) | Open paid hackathon registration page | Displays entry fee and transitions to payment clearance | UI displays paid tournament notice; upon registration redirects to `/payment?hackathonId=...` | `agent-a-paid-hackathon-reg.png` | **PASS** |
| **REG-005** | Register for second event with overlapping dates | `/hackathons/hack-demo-1/register` & overlapping event | Student registered for Event A (Oct 10–13) | Attempt registration for Event B spanning Oct 11–12 | Registration blocked with schedule conflict explanation | **DEFECT:** Backend has no interval comparison logic; registration succeeds without conflict warning | `server.js:684-740` logic inspection & live registration analysis | **FAIL** |
| **REG-006** | Register for non-overlapping event | `/hackathons/:id/register` | Student registered for Oct 10–13 event | Attempt registration for Nov 15 event | Registration permitted if eligible | Allowed, registration record created successfully | Regression suite `test_audit_journeys.mjs` | **PASS** |
| **REG-007** | Overlapping participation as team member | `/hackathons/:id/register` | User is member of squad in Event A | Leader of squad in overlapping Event B attempts to register squad containing this user | Conflict detected for affected member; registration blocked | **DEFECT:** Team member schedule overlap is not evaluated; only unverified identity and missing account status are checked | `server.js:721-738` | **FAIL** |
| **REG-008** | Try joining two teams in one event | `/team` | Student already enrolled in Team Alpha | Attempt to join or accept invite to Team Beta for same hackathon | Conflicting membership blocked | Backend verifies user team membership and prevents duplicate squad assignment | `server.js:1420-1460` | **PASS** |
| **REG-009** | Create solo registration, then join team | `/hackathons/:id/register` | Student registered as solo | Attempt to join team registered for same tournament | Duplicate participation prevented | Blocked; user cannot hold both active solo and team registration for same tournament | `server.js:685-695` | **PASS** |
| **REG-010** | Accept repeated invitations from teams | `/team` | Student received invites | Attempt to accept multiple invitations simultaneously | No duplicate or conflicting memberships allowed | State transitions atomically; once accepted, further acceptances fail | `server.js:1450-1490` | **PASS** |
| **REG-011** | Register with ineligible or invalid roster | `/hackathons/:id/register` | Squad has members with unverified emails | Squad leader attempts tournament registration | Validation error displayed; partial registration prevented | Rejects with HTTP 403: `"Squad member ... has an unverified identity. All members must verify email before tournament registration."` | `test_audit_journeys.mjs` (GROUP B/E) | **PASS** |
| **REG-012** | Boundary conditions (start/end exact match) | Live API `/hackathons` | Two tournaments where Event A ends at 09:00:00Z and Event B starts at 09:00:00Z | Check boundary scheduling enforcement | Overlap logic behaves consistently | **BLOCKED / UNENFORCED:** Because Rule B interval checking is completely unimplemented in `server.js`, boundary logic cannot be evaluated on live site | `live_browser_audit_results.json` | **BLOCKED** |

---

## 3. Discrepancy & Missing Policy Report
1. **Unenforced Rule B (Schedule Overlaps):**
   - The platform treats every hackathon registration in isolation.
   - **Recommendation:** Implement a datetime collision query before registering:
     ```js
     const overlappingReg = await Registration.findOne({
       userId,
       status: { $in: ['registered', 'payment_pending', 'confirmed'] }
     }).populate('hackathon');
     // Compare [hackathon.startDate, hackathon.endDate] against target hackathon
     ```
2. **Pending Registration Lock Status:**
   - Currently, a student with `payment_pending` status occupies an enrollment slot and cannot register another team for that event. However, because schedule overlap is not checked, pending status does not prevent enrollment in concurrent events.
