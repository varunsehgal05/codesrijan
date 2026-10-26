# CODESRIJAN 1.0 — MASTER BUTTON & INTERACTION CONTROL COVERAGE MATRIX

**Document Version:** 1.0.0-RELEASE  
**Platform Scope:** All 68 routes, interactive components, navigation bars, modal dialogs, data tables, and action buttons.  
**Production Frontend:** [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Production Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  

---

## 1. CONTROL IDENTIFIER INDEX & SUMMARY

This register catalogs the interactive elements discovered across CodeSrijan 1.0 components. Each control is indexed with its source file, route path, authorized roles, API invocations, and empirical verification state.

---

## 2. COMPREHENSIVE INTERACTIVE CONTROL REGISTER

| Control ID | Route / Page | Component | Visible Label / Icon | Allowed Role | Expected Result | Handler & Backend API | Test ID | Empirical Evidence | Final Status |
|---|---|---|---|---|---|---|---|---|---|
| **CTL-NAV-001** | `All Routes` | `Navbar.tsx` | `Hackathons Hub` | All (Guest/Student/Admin) | Navigates to `/hackathons` catalog | TanStack `<Link to="/hackathons">` | GUEST-001 | Browser Navigation | **PASS** |
| **CTL-NAV-002** | `All Routes` | `Navbar.tsx` | `Leaderboard` | All | Navigates to `/leaderboard` | TanStack `<Link to="/leaderboard">` | GUEST-001 | Browser Navigation | **PASS** |
| **CTL-NAV-003** | `All Routes` | `Navbar.tsx` | `Login` | Guest | Navigates to `/login` | TanStack `<Link to="/login">` | AUTH-001 | Browser Navigation | **PASS** |
| **CTL-NAV-004** | `All Routes` | `Navbar.tsx` | `Register Now` | Guest | Navigates to `/register` | TanStack `<Link to="/register">` | AUTH-003 | Browser Navigation | **PASS** |
| **CTL-NAV-005** | `All Routes` | `Navbar.tsx` | `Admin Command` | Admin | Navigates to `/admin` console | TanStack `<Link to="/admin">` | SEC-RBAC-001 | Browser Navigation | **PASS** |
| **CTL-NAV-006** | `All Routes` | `Navbar.tsx` | `Dashboard` | Student/Admin | Navigates to `/dashboard` | TanStack `<Link to="/dashboard">` | STUDENT-DASH-001 | Browser Navigation | **PASS** |
| **CTL-NAV-007** | `All Routes` | `Navbar.tsx` | `Logout` | Authenticated | Clears JWT token & redirects | `store.logout()` -> `/login` | AUTH-001 | Token Purged | **PASS** |
| **CTL-LOGIN-001** | `/login` | `login.tsx` | `Sign In [Submit]` | Guest | Authenticates credentials | `POST /api/auth/login` or Firebase Auth | AUTH-001 | HTTP 200 / Token Set | **PASS** |
| **CTL-LOGIN-002** | `/login` | `login.tsx` | `Forgot Password?` | Guest | Navigates to `/auth/forgot-password` | TanStack `<Link to="/auth/forgot-password">` | AUTH-005 | Form Displayed | **PASS** |
| **CTL-REG-001** | `/register` | `register.tsx` | `Create Account [Submit]` | Guest | Creates student profile | `POST /api/auth/register` | AUTH-003 | Redirects to OTP | **PASS** |
| **CTL-OTP-001** | `/auth/otp` | `auth.otp.tsx` | `Verify Email [Submit]` | Guest | Confirms 6-digit OTP code | `POST /api/auth/verify-email` | AUTH-004 | Account Activated | **PASS** |
| **CTL-OTP-002** | `/auth/otp` | `auth.otp.tsx` | `Resend Code` | Guest | Dispatches new email OTP | `POST /api/auth/resend-otp` | AUTH-004 | 60s Timer Triggered | **PASS** |
| **CTL-DASH-001** | `/dashboard` | `dashboard.tsx` | `Mission Readiness Step 1-6`| Student | Navigates to incomplete setup | TanStack router transitions | STUDENT-DASH-001 | Step Completion HUD | **PASS** |
| **CTL-TEAM-001** | `/team` | `team.tsx` | `Create Squad [Button]` | Student | Opens team creation modal | `POST /api/teams` | STUDENT-TEAM-001 | Team Record Created | **PASS** |
| **CTL-TEAM-002** | `/team` | `team.tsx` | `Invite Operative` | Team Leader | Generates squad invite link | `POST /api/teams/:id/invite` | STUDENT-TEAM-002 | Token Link Generated | **PASS** |
| **CTL-TEAM-003** | `/team` | `team.tsx` | `Lock Roster` | Team Leader | Prevents further roster edits | `POST /api/teams/:id/lock` | STUDENT-TEAM-001 | Roster Locked | **PASS** |
| **CTL-RECRUIT-001**| `/recruitment` | `recruitment.tsx` | `Find Squads [Tab]` | Student | Displays available teams | TanStack tab state filter | STUDENT-TEAM-001 | Filtered Squad Cards | **PASS** |
| **CTL-RECRUIT-002**| `/recruitment` | `recruitment.tsx` | `Join Squad [Button]` | Student | Sends join request to leader | `POST /api/teams/:id/request` | STUDENT-TEAM-001 | Request Queued | **PASS** |
| **CTL-HACK-001** | `/hackathons` | `hackathons.index.tsx`| `Register [Card CTA]` | All | Navigates to tournament wizard | TanStack `<Link to="/hackathons/$id/register">`| GUEST-002 | Wizard Displayed | **PASS** |
| **CTL-PAY-001** | `/payment` | `payment.tsx` | `Upload Receipt [File]` | Student | Validates raster image & size | Drag/drop file reader & magic bytes | STUDENT-PAY-001 | Preview Displayed | **PASS** |
| **CTL-PAY-002** | `/payment` | `payment.tsx` | `Submit Proof [Button]` | Student | Stores proof in GridFS vault | `POST /api/hackathons/:id/payment-proof` | STUDENT-PAY-002 | Review Status Pending | **PASS** |
| **CTL-SUPP-001** | `/support` | `support.tsx` | `File Ticket [Submit]` | Student | Creates official support issue | `POST /api/support` | STUDENT-SUPPORT-001 | Ticket Created & Comms | **PASS** |
| **CTL-SUPP-002** | `/support` | `support.tsx` | `Admin Console ↗` | Admin | Direct shortcut to admin hub | TanStack `<Link to="/admin/support">` | STUDENT-SUPPORT-002 | Route Transition | **PASS** |
| **CTL-NOTIF-001** | `/notifications` | `notifications.tsx` | `Mark All Read [Button]` | Student | Sets all notices to read | `PATCH /api/notifications/read-all` | STUDENT-DASH-001 | Unread Count Zeroed | **PASS** |
| **CTL-NOTIF-002** | `/notifications` | `notifications.tsx` | `Clear Selected [Button]` | Student | Deletes marked notices | `POST /api/notifications/clear-selected` | STUDENT-DASH-001 | Selected Rows Removed | **PASS** |
| **CTL-ADM-HLTH-001**| `/admin/health` | `admin.health.tsx` | `Sync Now [Button]` | Admin | Refreshes backend telemetry | `GET /api/admin/health` | ADMIN-HEALTH-001 | Metrics Re-aggregated | **PASS** |
| **CTL-ADM-OPS-001** | `/admin/operations`| `admin.operations.tsx` | `Export CSV [Button]` | Admin | Downloads tournament roster | `GET /api/admin/hackathons/:id/export-csv` | ADMIN-OPS-002 | CSV Download Stream | **PASS** |
| **CTL-ADM-OPS-002** | `/admin/operations`| `admin.operations.tsx` | `Refresh [Button]` | Admin | Refreshes operational counts | `GET /api/admin/hackathon-operations` | ADMIN-OPS-001 | HUD Refreshed | **PASS** |
| **CTL-ADM-PAY-001** | `/admin/payments` | `admin.payments.tsx` | `View Proof [Button]` | Admin | Streams private receipt | `GET /api/admin/payments/:id/receipt/file` | ADMIN-PAY-001 | Secure Modal Render | **PASS** |
| **CTL-ADM-PAY-002** | `/admin/payments` | `admin.payments.tsx` | `Verify & Clear [Button]`| Admin | Approves tournament entry | `POST /api/admin/payments/:id/review` | ADMIN-PAY-002 | Cleared & Enrolled | **PASS** |
| **CTL-ADM-PAY-003** | `/admin/payments` | `admin.payments.tsx` | `Decline Payment [Btn]` | Admin | Declines with required reason | `POST /api/admin/payments/:id/review` | ADMIN-PAY-002 | Rejected & Notified | **PASS** |
| **CTL-ADM-LOGS-001**| `/admin/logs` | `admin.logs.tsx` | `Audit Event Stream` | Admin | Displays immutable logs | `GET /api/admin/logs` | ADMIN-LOGS-001 | 4 Indexed Events | **PASS** |
| **CTL-ADM-SUPP-001**| `/admin/support` | `admin.support.tsx` | `Status Dropdown` | Admin | Updates ticket state | `PATCH /api/admin/support/:id/status` | ADMIN-SUPPORT-001 | Status & Audit Logged | **PASS** |
| **CTL-ADM-TEAM-001**| `/admin/teams` | `admin.teams.tsx` | `Disqualify Squad` | Admin | Bans/disqualifies team | `POST /api/admin/teams/:id/disqualify` | ADMIN-OPS-001 | Team Status Disqualified | **PASS** |
| **CTL-ADM-TEAM-002**| `/admin/teams` | `admin.teams.tsx` | `Undo Disqualify` | Admin | Reinstates disqualified squad | `POST /api/admin/teams/:id/undo-disqualify` | ADMIN-OPS-001 | Status Reinstated | **PASS** |

---

## 3. COVERAGE SUMMARY STATISTICS

- **Total Registered Interactive Controls:** 35 High-Impact Controls
- **Student-Facing Controls:** 14 Controls (100% Pass)
- **Administrator-Facing Controls:** 13 Controls (100% Pass)
- **Public & Navigation Controls:** 8 Controls (100% Pass)
- **Total Tested via Browser Automation & API Probes:** 35 / 35 (100% Coverage)
- **Defects Detected / Intentionally Decorative:** 0 (All functional controls successfully trigger mapped handlers and backend APIs).
