# CODESRIJAN — USER ROLES AND PERMISSIONS MATRIX

**Audit Date:** October 30, 2026  
**Auditor:** Principal Security & Software Architect  
**Scope:** Server middleware (`server/middleware/auth.js`), Mongoose schemas (`server/models/index.js`), Client navigation guards (`src/routes/__root.tsx`, `src/routes/admin.tsx`).  

---

## 1. Existing System Roles (Strict Enum)

In the current CodeSrijan implementation, the database enforces exactly four (4) user roles:
```typescript
enum UserRole {
  STUDENT = 'student',
  JUDGE = 'judge',
  MENTOR = 'mentor',
  ADMIN = 'admin'
}
```

There is **no database or middleware concept** of:
* `organizer`
* `organization_admin`
* `volunteer`
* `moderator`
* `sponsor`
* `super_admin` vs `event_admin`

---

## 2. Granular Permissions & Capabilities Matrix

| Platform Action / Capability | Student (`student`) | Judge (`judge`) | Mentor (`mentor`) | Admin (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Public Catalog & Problems** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Register for Hackathon (Solo / Squad)** | ✅ Yes | ❌ Blocked | ❌ Blocked | ❌ Blocked (Bypassed) |
| **Create or Join a Squad** | ✅ Yes | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Upload Payment Proof & Enter UTR** | ✅ Yes | ❌ N/A | ❌ N/A | ❌ N/A |
| **Access Team Kanban Workspace (HUD)** | ✅ (If in Squad) | ❌ No | ❌ No | ✅ Audit View |
| **Lock Problem Statement for Team** | ✅ (Leader only)| ❌ No | ❌ No | ✅ Can override |
| **Submit Final Project Payload** | ✅ (Leader only)| ❌ No | ❌ No | ✅ Can inspect |
| **Chat in Squad Channel** | ✅ (If Member) | ❌ No | ❌ No | ✅ Global Comms |
| **Create Support / SOS Ticket** | ✅ Yes | ❌ No | ❌ No | ✅ Can manage |
| **Accept & Resolve Mentor SOS Calls** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Grade Submissions on Rubrics** | ❌ No | ✅ Yes | ❌ No | ✅ Can override |
| **View Unofficial Live Leaderboard** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Verify / Reject Payment Proofs** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Create / Publish Hackathons** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Publish / Edit Problem Statements** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Disqualify / Reinstate Squads** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Ban / Unban / Promote Users** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Configure System Deadlines & Freeze**| ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Generate & Bulk Issue Certificates** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |
| **Access Render Health & Server Logs** | ❌ No | ❌ No | ❌ No | ✅ Exclusive |

---

## 3. Enforcement Layers: Backend vs Frontend

### 3.1 Backend Middleware Enforcement (`server/middleware/auth.js`)
* **`requireAuth`**: Validates either a Firebase Admin ID Token or an internal 256-bit SHA-256 session token from `Session` collection. Ensures `accountStatus === 'active'` and `emailVerified === true`.
* **`requireRole(roles)`**: Inspects `req.user.role`. If `req.user.role` is not present in the allowed array, instantly returns:
  ```json
  { "message": "Forbidden. Insufficient clearance." } // HTTP 403
  ```
* **Endpoints Guarded**:
  - `POST /api/admin/*` -> `requireRole(['admin'])`
  - `GET /api/evaluations/*` -> `requireRole(['judge', 'admin'])`
  - `PUT /api/mentor-requests/*` -> `requireRole(['mentor', 'admin'])`
  - `POST /api/submissions` -> `requireRole(['student'])`

### 3.2 Frontend Route Guards (`src/routes/admin.tsx`)
* The Admin layout checks `currentUser.role !== 'admin'`. If true, TanStack Router triggers an immediate client redirect:
  ```typescript
  if (!currentUser || currentUser.role !== 'admin') {
      navigate({ to: "/dashboard" });
  }
  ```
* **Security Observation**: While client-side guards prevent UI rendering, true security relies on the backend `requireRole` middleware. The backend correctly returns 403 on all `/api/admin` routes when tested with student session tokens.

---

## 4. Architectural Weaknesses in the Current RBAC Model

1. **All-or-Nothing Super-Admin Privileges**:
   - An administrator who is only intended to verify payment receipts also receives permission to delete problem statements, ban students, alter grades, and view all server health diagnostics.
2. **Missing Multi-Tenant Organizer Role**:
   - If a college professor wants to run an event for their campus, they cannot be granted scoped access to their own hackathon without also giving them master administrative access to all other colleges' events and participant databases.
3. **Absence of On-Site Operations Roles**:
   - Physical events require volunteer check-in staff at venue registration desks. Currently, giving someone check-in ability would require making them a super-admin.
4. **Lack of Blind Evaluation Separation**:
   - Judges can see team names, member colleges, and student identities, which violates collegiate competition integrity standards.

---

## 5. Recommended 3-Tier Enterprise RBAC Model

To support multi-college expansion, the RBAC model should evolve into:

```
Platform Super-Admin (Central CodeSrijan Core Team)
├── Organization Owner (e.g. Dean / Head of Innovation)
│   ├── Event Director / Lead Organizer (Assigned to Hackathon X)
│   │   ├── Finance Auditor (Scoped to Hackathon X Payments)
│   │   ├── Track Lead / Problem Curator (Scoped to Hackathon X Tracks)
│   │   ├── Volunteer / Check-In Staff (Scoped to Attendance QR)
│   ├── Judge (Scoped to Hackathon X Submissions)
│   └── Mentor (Scoped to Hackathon X SOS Tickets)
└── Student Builder (Global Identity, registers across multiple hackathons)
```

---

*Verified from `server/middleware/auth.js` and `server/models/index.js`.*
