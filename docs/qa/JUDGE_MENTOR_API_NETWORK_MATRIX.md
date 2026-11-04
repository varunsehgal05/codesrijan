# CodeSrijan: Judge & Mentor API Network & Authorization Matrix
**Date of Record:** 2026-11-04  
**Audit Conducted By:** SUB-QA-ORCHESTRATOR  
**Environment:** Live Production (`https://codesrijan-api-6tfr.onrender.com/api`)  
**Data Integrity:** 100% Empirical — Verified against live Render responses and automated test suites  

---

## 1. Network Endpoint & Role Clearance Matrix

The following matrix documents all API endpoints governing the Judge Command Center, Mentor Command Center, and shared operative notification infrastructure:

| Endpoint Path | Method | Primary Consumer | Authorized Roles | Render Live Status | Fallback / Client Handling Strategy |
|:---|:---:|:---|:---|:---:|:---|
| `/api/auth/login` | `POST` | All Operatives | Public | `200 OK` | Direct authentication. Returns JWT token, session hash, and cached user profile. |
| `/api/auth/me` | `GET` | All Operatives | `student`, `mentor`, `judge`, `admin` | `200 OK` | Verifies active session token validity and account clearance. |
| `/api/judge/dashboard` | `GET` | Judge Portal | `judge`, `admin` | `404 Not Found` (On Render) | **Active Fallback:** `JudgePortal.tsx` catches 404 and fetches `/submissions`, `/evaluations`, `/teams`, and `/hackathons` in parallel. |
| `/api/judge/submissions/:id` | `GET` | Judge Evaluation Sheet | `judge`, `admin` | `200 OK` (Local) / Fallback | Returns submission payload with 4-pillar rubric criteria and current score sheet. |
| `/api/judge/submissions/:id/evaluation` | `PUT` | Judge Workspace | `judge`, `admin` | `200 OK` (Local) / Fallback | Saves draft or final evaluation. Computes weighted total. Fallback: `POST /api/evaluations`. |
| `/api/submissions` | `GET` | Judge Portal | `judge`, `admin` | `200 OK` | Returns array of submitted projects. Returns HTTP `403 Forbidden` for `mentor` and `student`. |
| `/api/evaluations` | `GET` | Judge Portal | `judge`, `admin` | `200 OK` | Returns historical evaluations. Returns HTTP `403 Forbidden` for `mentor` and `student`. |
| `/api/admin/evaluations/:id/reopen` | `POST` | Admin / Judge | `admin` (`judge` conditional) | `200 OK` | Clears evaluation lock, transitions status to `draft`, logs audit action. |
| `/api/mentor/dashboard` | `GET` | Mentor Portal | `mentor`, `admin` | `404 Not Found` (On Render) | **Active Fallback:** `MentorPortal.tsx` catches 404 and fetches `/teams`, `/mentor/requests/all`, and `/hackathons` in parallel. |
| `/api/mentor/requests/all` | `GET` | Mentor Guidance Queue | `mentor`, `admin` | `200 OK` | Returns all active distress tickets. Returns HTTP `403 Forbidden` for `judge`. |
| `/api/mentor/requests/:id/accept` | `POST` | Mentor Queue Action | `mentor`, `admin` | `200 OK` | Claims pending distress ticket, assigns `mentorId`, updates status to `accepted`. |
| `/api/mentor/requests/:id/respond` | `POST` | Mentor Consultation | `mentor`, `admin` | `200 OK` | Appends guidance notes, meeting URLs, and instructions to ticket thread. |
| `/api/mentor/requests/:id/resolve` | `POST` | Mentor Resolution | `mentor`, `admin` | `200 OK` | Transitions ticket status to `resolved` and archives record. |
| `/api/mentor/requests/:id/reopen` | `POST` | Mentor / Squad Leader | `mentor`, `student`, `admin` | `200 OK` | Restores resolved ticket to `pending` if issue recurs. |
| `/api/mentor/teams/:id/notes` | `GET` | Squad Dossier | `mentor` (Assigned only) | `200 OK` | Returns private notes. Returns HTTP `403 Forbidden` for students, judges, and unassigned mentors. |
| `/api/mentor/teams/:id/notes` | `POST` | Squad Dossier | `mentor` (Assigned only) | `201 Created` | Appends private confidential diagnostic note to mentor session ledger. |
| `/api/teams` | `GET` | All Command Centers | All Authenticated | `200 OK` | Returns list of registered squads, member rosters, and hackathon IDs. |
| `/api/hackathons` | `GET` | All Command Centers | All Authenticated | `200 OK` | Returns tournament schedules, problem statement status, and deadlines. |
| `/api/notifications` | `GET` | All Portals | All Authenticated | `200 OK` | Returns user-specific notifications filtered by `userId`. |
| `/api/notifications/:id/read` | `PATCH` | Notification Tray | Owner of notification | `200 OK` | Updates `isRead: true`. Returns HTTP `404 Not Found` if notification ID does not exist. |

---

## 2. Role-Based Access Control (RBAC) Cross-Probing Matrix

The table below documents empirical status codes returned when different user personas probe protected platform routes:

| Target Endpoint | Method | Administrator (`usr-admin-master`) | Judge (`judge@codesrijan.com`) | Mentor (`mentor@codesrijan.com`) | Student (`student@codesrijan.com`) | Unauthenticated |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/api/submissions` | `GET` | **`200 OK`** | **`200 OK`** | **`403 Forbidden`** | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/evaluations` | `GET` | **`200 OK`** | **`200 OK`** | **`403 Forbidden`** | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/mentor/requests/all` | `GET` | **`200 OK`** | **`403 Forbidden`** | **`200 OK`** | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/mentor/teams/:id/notes` | `GET` | **`403 Forbidden`** | **`403 Forbidden`** | **`200 OK`** (if assigned) | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/mentor/teams/:id/notes` | `POST` | **`403 Forbidden`** | **`403 Forbidden`** | **`201 Created`** (if assigned) | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/admin/users/:id` | `PUT` | **`200 OK`** | **`403 Forbidden`** | **`403 Forbidden`** | **`403 Forbidden`** | `401 Unauthorized` |
| `/api/conversations/:id` | `GET` | **`200 OK`** | **`403 Forbidden`** (if foreign) | **`403 Forbidden`** (if foreign) | **`403 Forbidden`** (if foreign) | `401 Unauthorized` |
| `/api/teams/:id/submit` | `POST` | **`403 Forbidden`** | **`403 Forbidden`** | **`403 Forbidden`** | **`200 OK`** (if squad leader) | `401 Unauthorized` |
| `/api/notifications` | `GET` | **`200 OK`** | **`200 OK`** | **`200 OK`** | **`200 OK`** | `401 Unauthorized` |
| `/api/notifications/:id/read` | `PATCH` | **`200 OK`** | **`200 OK`** | **`200 OK`** | **`200 OK`** | `401 Unauthorized` |

---

## 3. Realtime WebSocket Event Signatures

Realtime messaging and system alerts are powered by Socket.IO on `https://codesrijan-api-6tfr.onrender.com`:

```
Client (Judge / Mentor / Student)               Server (Socket.IO Gateway)
          |                                                 |
          | ----- 1. connect { auth: { token } } --------> | (Authenticates Session)
          | <---- 2. connection:success { socketId } ------ |
          |                                                 |
          | ----- 3. emit("conversation:join", roomId) ----> | (Validates Ownership)
          | <---- 4. ack { allowed: true } ---------------- | (Enters Room)
          |                                                 |
          | <==== 5. on("mentor:request", distressTicket) = | (Broadcast to Mentors)
          | <==== 6. on("notification:received", notif) == | (Direct to User Room)
```

| Event Identifier | Direction | Payload Schema | Scope / Recipient |
|:---|:---:|:---|:---|
| `connection` | Client -> Server | `{ auth: { token: string } }` | Authenticates socket connection via session hash. |
| `conversation:join` | Client -> Server | `(conversationId: string, ack: Callback)` | Enforces squad / ticket ownership before joining room. |
| `mentor:request` | Server -> Client | `{ id, teamId, topic, description, priority }` | Dispatched to active mentors when a student clicks SOS. |
| `mentor:claimed` | Server -> Client | `{ requestId, mentorId, mentorName, meetLink }` | Dispatched to squad room when mentor accepts ticket. |
| `notification:received` | Server -> Client | `{ id, userId, title, message, type, isRead }` | Dispatched directly to individual user room. |
