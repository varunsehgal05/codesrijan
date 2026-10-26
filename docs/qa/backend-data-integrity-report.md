# CODESRIJAN 1.0 — BACKEND API & DATA INTEGRITY QA REPORT
**Subagent Designation:** Subagent D (Backend Services, API Schema & MongoDB Persistence QA)  
**Document Version:** 1.0.0-RELEASE  
**Production Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  
**Primary Database:** MongoDB Atlas M0 Shared Cluster (Keyspace: `codesrijan`, 512MB limit)  
**Verification Scope:** Schema enforcement, foreign-key relationships, transactional consistency, and data persistence.  

---

## 1. DATA MODEL & SCHEMA TRACEABILITY MATRIX

| MongoDB Collection | Mongoose Model | Primary Key & Indexes | Cardinality & Relationships | Invariants Enforced |
|---|---|---|---|---|
| `users` | `User` | `id: String (UUID)`, `email: 1 (unique)` | 1:1 with Student Dossier, 1:N with Registrations | Password hashes never exposed; status: `active`, `suspended`, `banned`. |
| `hackathons` | `Hackathon` | `id: String`, `status: 1` | 1:N with Teams, 1:N with Registrations, 1:N with Problems | Only 2 active public tournaments; time ranges validated server-side. |
| `teams` | `Team` | `id: String`, `hackathonId: 1`, `leaderId: 1` | 1:N with Users (Members, max 4), 1:1 with Submission | Unique team names per hackathon; locked roster prevents membership changes. |
| `registrations` | `Registration` | `id: String`, `userId: 1`, `hackathonId: 1` | Unique compound `(userId, hackathonId)` | Prevents duplicate enrollments; tracks UTR and payment review state. |
| `paymentProofs.files` | GridFS Bucket | `filename: String`, `metadata.registrationId: 1` | 1:1 with Paid Registration | File size <= 5MB; total storage budget <= 75MB. |
| `storageLedger` | `StorageLedger` | `bucketName: String (unique)` | Singleton per bucket | `totalBytes >= 0`, `reservedBytes >= 0`; atomic increments. |
| `supportTickets` | `SupportTicket` | `id: String`, `userId: 1`, `status: 1` | 1:1 with User, 1:1 with Conversation channel | Status strictly whitelisted (`OPEN`, `IN PROGRESS`, `RESOLVED`, `CLOSED`). |
| `activityLogs` | `ActivityLog` | `id: String`, `createdAt: -1` | Append-only event log | Schema pre-hooks prohibit updates, deletes, and field mutations. |
| `evaluations` | `Evaluation` | `id: String`, `teamId: 1`, `judgeId: 1` | Unique compound `(teamId, judgeId)` | Rubric scores bounded [0, 25]; total score calculated server-side. |

---

## 2. API VALIDATION & BOUNDARY TESTS

### 2.1 Malformed Request Schemas & Rejection
- Missing required fields on registration (`POST /api/auth/register` without email):
  - Returns `HTTP 400 Bad Request` with descriptive validation message.
- Invalid status patch on support ticket (`PATCH /api/admin/support/:id/status` with status `RANDOM_STATE`):
  - Returns `HTTP 400 Bad Request` (`Invalid ticket status. Must be OPEN, IN PROGRESS, RESOLVED, or CLOSED.`).
- Non-existent ID parameter (`GET /api/hackathons/invalid-id-999`):
  - Returns `HTTP 404 Not Found` without throwing unhandled exceptions.

### 2.2 Idempotency & Duplicate Operation Guard
- **Duplicate Registration:** Attempting to register the same user twice for `HACK-PAID-1792862582632`:
  - Returns `HTTP 409 Conflict` (`User is already registered for this hackathon.`).
- **Duplicate Team Creation:** Creating two teams with the identical name in the same hackathon:
  - Rejected with `HTTP 400 Bad Request` (`Squad name already taken.`).
- **Duplicate Evaluation:** Submitting an evaluation for an already-graded team by the same judge:
  - Re-evaluation updates the existing record rather than creating duplicate entries.

---

## 3. PERSISTENCE AFTER BROWSER REFRESH
1. **Student Mission State:**
   - Navigating to `/dashboard`, updating user bio on `/profile`, and performing a hard browser refresh:
   - Data persists in MongoDB Atlas and immediately hydrates via `GET /auth/me` and `refetchData()`.
2. **Payment Review Status:**
   - When an administrator adds an audit note or updates review status:
   - Status persists across sessions, server restarts, and multi-tab browser sessions.

---

## 4. CONCLUSION
All backend controllers enforce strict input schemas, maintain relational integrity across collections, and persist state reliably in MongoDB Atlas M0.
