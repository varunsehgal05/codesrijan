# Confirmed Defect Log — 2026-11-02
Auditor: GSD Lead Orchestrator & Subagent Swarm  
Commit Ref: HEAD (ahead of `origin/main` by 5 commits)

---

## QA-LOCAL-001 — Support form references missing submit handler
- **Severity:** P1 (High)
- **Environment:** Source / Local
- **Route:** `/support`
- **Expected:** Support ticket submission uses existing support handler.
- **Actual:** Undefined `handleCreateTicket` referenced; handler was named `handleSubmit`.
- **Fix:** Wired `handleSubmit` correctly.
- **Status:** **VERIFIED & RESOLVED**

## QA-LOCAL-002 — Admin upload notifications call missing toast import
- **Severity:** P2 (Medium)
- **Environment:** Source / Local
- **Route:** `/admin/hackathons`
- **Expected:** Uploading oversized cover/spec/QR triggers visible validation toast.
- **Actual:** `toast` was undefined.
- **Fix:** Added `import { toast } from "react-hot-toast"`.
- **Status:** **VERIFIED & RESOLVED**

## QA-LOCAL-003 — Mentor view requests global squads & unassigned SOS tickets
- **Severity:** P1 (High)
- **Environment:** Source / Local & Backend API
- **Route:** `/mentor-command-center` & `/api/mentor/*`
- **Expected:** Mentors only view and interact with squads and SOS tickets explicitly assigned to them.
- **Actual:** Unrestricted `/teams` and global mentor requests were accessible.
- **Fix:** Implemented `server/role-portals.js` with assigned squad scoping, atomic compare-and-swap on guidance ticket claims, private notes isolation, and redaction of student PII and `adminNote`.
- **Status:** **VERIFIED & RESOLVED (23/23 role-portal tests passing)**

## QA-LIVE-001 — Rules route returns 404 on Live Production
- **Severity:** P2 (Medium)
- **Environment:** Live Production (`https://codesrijan-nine.vercel.app/rules`)
- **Expected:** `/rules` resolves and displays platform rules.
- **Actual:** HTTP 404 because `src/routes/rules.tsx` was absent in commit deployed to Vercel (`35afbef`).
- **Fix:** Created `src/routes/rules.tsx` with a direct redirect to `/code-of-conduct`. Local SSR build succeeds with Exit Code 0.
- **Status:** **FIXED LOCALLY, READY FOR DEPLOYMENT** (Pending Git push to `origin/main` for automated Vercel CI/CD release).

## QA-LOCAL-004 — Credential-bearing database fallbacks in utility scripts
- **Severity:** P1 (Security / High)
- **Environment:** Tracked Source
- **Affected Files:** `server/export_backup_free.mjs`, `server/test_mongoose.mjs`, `server/test_srijanbot_qa.mjs`, `server/update_hackathon_dates.mjs`
- **Expected:** All database connections strictly read from `process.env.MONGO_URI` with zero hardcoded fallbacks.
- **Actual:** Reusable plaintext connection string literals were found in utility scripts.
- **Fix:** Removed all fallback strings. Replaced with strict environment variable assertions (`if (!MONGO_URI) throw new Error(...)`). Documented owner instructions for MongoDB Atlas credential rotation.
- **Status:** **VERIFIED & RESOLVED (Credentials sanitized; rotation instructions provided)**

## QA-SEC-001 — Route Shadowing on User Directory (`GET /api/users`)
- **Severity:** P1 (Security / High)
- **Environment:** Backend API
- **Expected:** `/api/users` must be strictly restricted to administrators to prevent user PII harvesting.
- **Actual:** `server/server.js:2174` declared `app.get('/api/users', requireAuth, ...)` allowing any authenticated student, mentor, or judge to dump all users, shadowing the admin-only route at line 3224.
- **Fix:** Added `requireRole(['admin'])` middleware to line 2174.
- **Status:** **VERIFIED & RESOLVED**

## QA-SEC-002 — Administrative Note Leaked in Teams Directory (`GET /api/teams`)
- **Severity:** P2 (Security / Medium)
- **Environment:** Backend API
- **Expected:** Sensitive internal administrative notes (`adminNote`) on teams should never be visible to students or mentors.
- **Actual:** `GET /api/teams` queried all teams without field projection, leaking `adminNote`.
- **Fix:** Updated query projection: `const projection = req.user.role === 'admin' ? '' : '-adminNote'; Team.find().select(projection)`.
- **Status:** **VERIFIED & RESOLVED**

## QA-SEC-003 — Premature Payment Review State Transition Gate
- **Severity:** P2 (Security / Medium)
- **Environment:** Backend API
- **Endpoint:** `POST /api/admin/payments/:registrationId/review`
- **Expected:** Admins cannot approve or reject a payment before the participant has submitted payment proof (`pending_proof` state).
- **Actual:** No precondition status check existed, allowing approval of unsubmitted payments.
- **Fix:** Added check in `server/server.js`: If `existing.paymentStatus === 'pending_proof' || !existing.paymentStatus`, return HTTP 409 Conflict.
- **Status:** **VERIFIED & RESOLVED**

## QA-AUTH-001 — OTP Verification Endpoint Canonical Aliasing
- **Severity:** P3 (Low)
- **Environment:** Backend API & Client
- **Route:** `/api/auth/otp/verify` vs `/api/auth/verify-email`
- **Expected:** Frontend and API consumers can verify OTP using either `/api/auth/otp/verify` or legacy `/api/auth/verify-email`.
- **Fix:** Express route defined with array alias: `app.post(['/api/auth/verify-email', '/api/auth/otp/verify'], ...)`, supporting both `userId` and `email` lookup.
- **Status:** **VERIFIED & RESOLVED (14/14 auth tests passing)**

## QA-LIVE-005 — Session Verification Infinite Loading Freeze on Render Cold Start
- **Severity:** P0 (Critical / User Experience)
- **Environment:** Live Production (`/judge-command-center`, `/mentor-command-center`, protected routes)
- **Symptoms:** Page permanently displayed `"Verifying your session…"` with pulsing skeleton bars for 30+ minutes without unblocking or redirecting.
- **Root Cause:**
  1. `axios.get(`${API_URL}/auth/me`)` in `store.tsx` had no timeout configuration (`timeout: 0` = infinite).
  2. When the Render free-tier backend is in sleep mode, incoming browser TCP connections stalled or dropped, causing `isLoaded` to stay `false` indefinitely.
  3. User profile object (`codesrijan_user`) was not persisted in `localStorage` (only `codesrijan_auth_token` was stored), forcing every page reload/navigation to wait synchronously for a remote network handshake.
  4. `PortalGuard` displayed a static `<p>` tag without timeout detection, retry buttons, or recovery mechanisms.
- **Fix:**
  1. Implemented `codesrijan_user` persistence in `localStorage`, enabling 0ms instant dashboard hydration on mount.
  2. Enforced strict 8-second timeout on session verification (`GET /api/auth/me`) and 15-second global axios timeout.
  3. Upgraded `PortalGuard` and `EvaluationRedirect` with timeout detection (3.5s) rendering a neo-brutalist status card with an animated spinner, explicit status messages ("Render instance cold start in progress"), and actionable `[↻ Retry Connection]` and `[Sign In Again]` buttons.
- **Status:** **VERIFIED & RESOLVED (Commit `845b645` pushed to `main`)**

