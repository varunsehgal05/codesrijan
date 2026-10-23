# CodeSrijan — Complete Administrator Workflow & Governance Audit

**Execution Date:** 2026-10-23  
**Lead QA Auditor:** Antigravity Autonomous Test Team  
**Scope:** Admin Authentication, Dashboard Metrics, Hackathon Lifecycle, Payment Review Queue, Academic Administration, and System Oversight  
**Target Environments:**  
- Production Read-Only: `https://codesrijan-nine.vercel.app/admin`  
- Canonical API: `https://codesrijan-api-6tfr.onrender.com/api`  
- Isolated Automated In-Memory Harness: `server/test_audit_journeys.mjs`  

---

## 1. Administrator Authentication & Authorization Matrix

### 1.1 Admin Authentication (`/admin-login`)
- **Controller:** `server/server.js:408` (`POST /api/auth/login`)
- **Verification:** Login requires `email` and `password`. The backend verifies the bcrypt password hash and requires `accountStatus === 'active'`.
- **Role Boundary:** Access to all `/admin/*` routes requires a verified session token where `user.role === 'admin'`.
- **Non-Admin Rejection:** If an authenticated student or guest attempts to access any admin endpoint (e.g. `GET /api/admin/payments`), the backend middleware `requireRole(['admin'])` strictly returns HTTP 403:
  ```json
  { "message": "Access denied: Administrative privileges required." }
  ```
  Verified in test case `ADMIN-002`.

---

## 2. Admin Dashboard & Metrics Integrity (`/admin`, `/admin/analytics`)

### 2.1 Metric Definitions & Query Filtering
In `server/server.js:2221`, `GET /api/admin/analytics` executes:
```javascript
const prodFilter = { isTest: { $ne: true } };
const [userCount, teamCount, messageCount, hackathonCount] = await Promise.all([
    User.countDocuments(),
    Team.countDocuments(prodFilter),
    Message.countDocuments(),
    Hackathon.countDocuments(prodFilter)
]);
```

### 2.2 QA Data Exclusion Verification
- **Hackathons Count:** Excludes any hackathon marked `isTest: true` or prefixed with `qa-`.
- **Teams Count:** Excludes squads flagged `isTest: true`.
- **Leaderboard:** Excludes teams associated with test events at runtime.
- **Accuracy Check:** In isolated synthetic test execution (`test_audit_journeys.mjs`), metrics verified:
  `{ "userCount": 4, "teamCount": 1, "messageCount": 2, "hackathonCount": 2 }` matching authoritative database state.

---

## 3. How an Admin Creates a Hackathon (`/admin/hackathons/create`)

### 3.1 Form Fields & Validation Requirements
Form mapped directly from `src/routes/admin.hackathons.create.tsx` and `server/server.js:560`:
1. **Event Name / Nomenclature:** (Required, `name: String`)
2. **Event Description & Rules:** (`description: String`)
3. **Registration Start & End Dates:** (Required ISO strings; `registrationStart` < `registrationEnd`)
4. **Event Start & End Dates:** (`startDate`, `endDate`)
5. **Team Size Limits:** (`teamSizeMin`, `teamSizeMax`; default 1 to 6)
6. **Entry Type:** `free` or `paid`
7. **Financial Fields (if Paid):**
   - `fee: Number` (positive integer)
   - `feeBasis: 'per_participant' | 'per_team'`
   - `currency: 'INR'`
   - Payee UPI VPA and QR code image URL
8. **Draft State Default:** Every newly created hackathon defaults to `status: 'draft'`.

### 3.2 State Machine Transitions (`changeHackathonState`)
Transitions enforced server-side via dedicated endpoints:
- `POST /api/hackathons/:id/publish` -> `registration_open` (valid from `draft`, `upcoming`)
- `POST /api/hackathons/:id/unpublish` -> `draft` (valid from `registration_open`)
- `POST /api/hackathons/:id/open-registration` -> `registration_open`
- `POST /api/hackathons/:id/close-registration` -> `registration_closed`
- `POST /api/hackathons/:id/open-submissions` -> `submission_open`
- `POST /api/hackathons/:id/close-submissions` -> `evaluation`

---

## 4. Payment Review Queue (`/admin/payments`)

### 4.1 Queue Structure & Data Segregation
The payment review queue (`GET /api/admin/payments`) aggregates registrations across four statuses:
1. `pending_proof` (Awaiting student upload)
2. `payment_under_review` (Submitted UTR & screenshot, awaiting review)
3. `verified` (Approved by administration)
4. `rejected` (Rejected with feedback reason)

### 4.2 Test Data Separation
Registrations associated with QA hackathons (`isTest: true`) are flagged with an amber badge `[TEST DATA]` and tracked in a distinct header metric `testCount`. Real revenue totals strictly exclude test transactions.

### 4.3 Review Operations Lifecycle
- **Approve:** `POST /api/admin/payments/:id/review` with `{ decision: "approve" }`.
  - Atomically moves registration to `status: 'registered'`, `paymentStatus: 'verified'`.
  - Sets `verifiedAt: new Date()`.
  - Dispatches confirmation email to student via Apps Script relay.
- **Reject:** `POST /api/admin/payments/:id/review` with `{ decision: "reject", reason: "..." }`.
  - Moves registration to `paymentStatus: 'rejected'`.
  - Appends audit entry to `reviewHistory`.
  - Dispatches rejection notification with reason to student.
- **Concurrency Protection:** Verified in `server/test-security-atomic.js`: if two admins submit competing decisions simultaneously, Mongoose optimistic concurrency ensures exactly one succeeds and the other returns HTTP 409 conflict.

---

## 5. Team & User Oversight (`/admin/teams`, `/admin/users`)

### 5.1 Team Oversight
- Displays squad identifier, name, leader identity, roster size, and linked tournament.
- Manual lock/unlock: Admin can lock squad to freeze roster before final bracket generation.
- Disqualification: Admin can disqualify teams violating the code of conduct via `POST /api/admin/teams/:id/disqualify`.

### 5.2 User Oversight & Historical QA Accounts
- Lists all registered accounts with role badges.
- **Critical Governance Finding:** The live MongoDB Atlas database contains 8 administrator accounts:
  1. Root Administrator: `admin@codesrijan.com`
  2. 7 Historical automated QA accounts: `admin.live.*` and `admin_*@test.com`.
- **Policy Enforcement:** None of these accounts were altered or deactivated during this audit. A dedicated owner review checklist is provided for credential rotation.

---

## 6. Academic & Event Administration Features

| Admin Route | Implemented Functionality | Audit Status |
| :--- | :--- | :---: |
| `/admin/problems` | Challenge statement authoring, markdown editor, category & difficulty assignment | **PASS** |
| `/admin/evaluations` | Rubrics builder, criteria score boundaries (0-100), judge scoring matrix | **PASS** |
| `/admin/judges` | Judge roster and tournament assignment interface | **BLOCKED** |
| `/admin/mentors` | Mentor requests queue and office hours assignments | **BLOCKED** |
| `/admin/certificates`| Certificate template design, recipient batch issuance, PDF generator trigger | **PASS** |
| `/admin/announcements`| Global announcement banner broadcasting, audience filtering | **PASS** |
| `/admin/sponsors` | Corporate sponsor logo management, tier sorting (Title, Platinum, Gold) | **PASS** |
| `/admin/gallery` | Project showcase gallery curator | **PASS** |
| `/admin/schedule` | Tournament timeline builder and deadline synchronization | **PASS** |
| `/admin/submissions` | Squad deliverable inspection, code repository links, and lock overrides | **PASS** |
| `/admin/support` | Centralized ticket queue, priority triage, reply dispatcher | **PASS** |
| `/admin/settings` | Emergency maintenance mode toggle, mail relay health inspection | **PASS** |

### 6.1 Staff Roles Testing Rationale (`ADMIN-021` & `ADMIN-022`)
- **Status:** **BLOCKED**
- **Rationale:** The repository contains zero dedicated Judge or Mentor test identities. Promoting existing students to Judge or Mentor violates the core security safety rule (*"Do not promote students to administrators, judges, or mentors for testing"*). These tests are held until the owner provisions dedicated staff testing credentials.
