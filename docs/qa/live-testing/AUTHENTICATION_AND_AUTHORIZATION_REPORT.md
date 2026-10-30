# CODESRIJAN — AUTHENTICATION AND AUTHORIZATION REPORT
**Environment**: Production (`https://codesrijan-nine.vercel.app`)  
**Backend API**: `https://codesrijan-api-6tfr.onrender.com/api`  
**Security Boundary**: Firebase Authentication + JWT Auth Bearer Tokens + MongoDB Atlas Role Authorization  
**Verification Date**: 2026-10-30  

---

## 1. Authentication Architecture Overview
The CodeSrijan authentication subsystem operates on a dual-layer security model:
1. **Firebase Authentication SDK Layer**: Client-side initialization connects to Firebase project `codesrijan-450d0` (`auth/email-password-provider`).
2. **Express API / JWT Session Layer**: In environments where Firebase client SDK network handshakes are intercepted or degraded, the client store (`src/lib/store.tsx`) smoothly falls back to `POST /api/auth/login`.
3. **Session Persistence**: Valid tokens are saved to client `localStorage.setItem('codesrijan_auth_token', token)`.
4. **Global Interceptors**: An Axios request interceptor attaches `Authorization: Bearer <token>` to all subsequent HTTP dispatches.
5. **WebSocket Synchronization**: The Socket.io client instance disconnects and reconnects passing `auth: { token }` to authenticate real-time channels.

---

## 2. Authentication Test Results

### Test Case AUTH-01: Invalid Credentials Rejection
- **Test Procedure**:
  1. Navigate to `https://codesrijan-nine.vercel.app/login` with cleared session state.
  2. Enter unauthenticated username `invalid_user@codesrijan.com` and password `WrongPass123!`.
  3. Submit login request.
- **Observed Behavior**:
  - The form triggers validation and dispatches `POST /api/auth/login`.
  - Backend responds with `401 Unauthorized` / `Authentication failed`.
  - Frontend renders a prominent neo-brutalist alert banner informing the user of the invalid credentials.
  - The URL does not route away from `/login`; local storage remains free of unauthorized session tokens.
- **Evidence**: `docs/qa/live-testing/evidence/authentication/01_invalid_login.png`
- **Result**: **PASS**

### Test Case AUTH-02: Student Login Handshake
- **Test Credentials**: `student@codesrijan.com` (Vanguard Hacker)
- **Observed Behavior**:
  - Successful authentication returns student profile payload:
    - User ID: `user_student_prod`
    - Role: `student`
    - Team ID: `team_prod_squad`
    - College: `National Institute of Technology`
  - Client stores Bearer token in `codesrijan_auth_token`.
  - TanStack router transitions to `/dashboard`.
  - UI renders Student Operative Workspace HUD with squad affiliation and hackathon countdown timer.
- **Evidence**: `docs/qa/live-testing/evidence/authentication/02_student_authenticated.png`
- **Result**: **PASS**

### Test Case AUTH-03: Admin Login Handshake
- **Test Credentials**: `admin@codesrijan.com` (Codesrijan Administrator)
- **Observed Behavior**:
  - Successful authentication returns administrator profile payload:
    - User ID: `user_admin_prod`
    - Role: `admin`
    - Permissions: Global Directorate
  - Client navigates to `/dashboard`.
  - Header displays `ADMIN PANEL` badge and role badge `Role: ADMIN`.
  - Lone Wolf warning box is cleanly absent (admin accounts do not participate as competitors).
  - Admin governance navigation links render across the header and HUD.
- **Result**: **PASS**

---

## 3. Role-Based Access Control (RBAC) Matrix

| Protected Resource / Route | Anonymous Visitor | Student Role | Admin Role | Enforced Boundary | Status |
| :--- | :---: | :---: | :---: | :--- | :---: |
| `/` (Landing Page) | Allowed | Allowed | Allowed | Public marketing discovery | **PASS** |
| `/about`, `/announcements` | Allowed | Allowed | Allowed | Public informational | **PASS** |
| `/login`, `/register` | Allowed | Redirect `/dashboard` | Redirect `/dashboard` | Session-aware auth guard | **PASS** |
| `/dashboard` | Redirect `/login` | Allowed (Student HUD) | Allowed (Admin Directorate)| Auth token guard | **PASS** |
| `/admin/*` (Governance) | Redirect `/login` | 403 Forbidden | Allowed | Role `admin` strict guard | **PASS** |
| `GET /api/users` | 401 Unauthorized | 403 Forbidden | 200 OK (8 users returned) | Backend Express JWT middleware | **PASS** |
| `POST /api/hackathons` | 401 Unauthorized | 403 Forbidden | 201 Created | Admin only creation gate | **PASS** |
| `PATCH /api/teams/:id/status`| 401 Unauthorized | 403 Forbidden | 200 OK | Admin DIQ & Ban controls | **PASS** |

---

## 4. Session Termination & Invalidation
- Invoking `LOGOUT` triggers `store.logout()`:
  1. `localStorage.removeItem('codesrijan_auth_token')`
  2. `firebase.auth().signOut()`
  3. `socket.disconnect()`
  4. Redirection to `/login`
- Subsequent requests to protected endpoints return `401 Unauthorized`.
- No lingering credential leakage detected in browser storage or network payloads.
