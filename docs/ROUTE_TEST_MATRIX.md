# Route and API verification matrix

Assessment date: 2026-10-23. Inventory generated from local `createFileRoute` declarations and Express registrations. Items remain **NOT TESTED** unless explicitly scoped in the execution evidence below. Source presence is not a pass result. Preserve HTTP statuses, final redirected URL, screenshots, console/network failures and exact isolated fixture IDs when running checks.

## Execution evidence from this assessment

- Local public browser suite: reviewed `tests/public.spec.ts` (five guest navigation/assertion tests; no form submission). Executed with unchanged assertions and line reporter. First attempt: 5 failed before browser launch because the sandbox browser cache was missing. Installed-cache retry: 5 failed at initial navigation with `ERR_NETWORK_ACCESS_DENIED`. Approved retry: 5 failed at initial navigation with `ERR_CONNECTION_TIMED_OUT` against `http://localhost:5173`. **Result: BLOCKED before assertions, 0 passed; no route functional pass can be claimed.** `/about` navigation was never reached because its shared test failed first at `/timeline`. Evidence is retained in separate `artifacts/public-browser/`, `artifacts/public-browser-installed/`, and `artifacts/public-browser-approved/` directories; existing `playwright-report/` and `test-results/` were not overwritten.
- TypeScript verification: `npx tsc --noEmit` failed. After three minimal runtime fixes (missing gallery state, workspace declaration order, existing disqualification-dialog wiring), the rerun reports **56 TypeScript errors**. Full diagnostics: `artifacts/typescript-after-runtime-fixes.txt`. Remaining errors include shared User/Team type gaps, undefined checks, OTP return-type mismatch, typed route construction and callbacks without complete return paths. This is a failed static check, not a browser result.
- Live directory observation reported by the coordinating assessment: eight QA events are publicly listed, including `qa-paid-hack-1792695285658`. This is a confirmed content-hygiene finding for the live directory, not verification of enrollment/payment behavior. No deletion was performed by this document's author.


- Local browser run on reachable frontend port 5174: **4 passed, 1 failed (22.7 seconds)**. Temporary sibling spec changed only localhost port 5173 to 5174; assertions unchanged, temporary file removed afterward. Homepage heading/navbar, problems guest redirect/login heading, timeline/about text, and guest support protection passed. Leaderboard rendered GLOBAL LEADERBOARD while test expected CLASSIFIED STANDINGS: proven content/assertion mismatch, not a proven crash. Evidence: `artifacts/public-browser-port5174/`. These scoped results supersede earlier environment blockage for these assertions only.
- Final TypeScript check after scoped frontend fixes: **PASS**, `npx tsc --noEmit` exited 0 with no diagnostics. Evidence: `artifacts/typescript-final.txt` (empty output). The earlier 56-error result is retained above as baseline history; config was not relaxed and no ts-ignore directives were added.

- Final frontend production build: **PASS**, `npm run build` exited 0; log `artifacts/frontend-build-final.txt`. Build completion does not replace runtime feature checks.

Only the statuses above were established. Role-based workflows, paid transitions, email delivery, production mobile behavior and API authorization remain NOT TESTED here.

## Common checks

For each frontend route: direct navigation, refresh/SSR, expected content, mobile overflow, loading/error/empty state, keyboard access, broken links and console/network errors. For protected screens: anonymous access, correct role, wrong role, logout then Back, and stale/expired token. For dynamic routes: valid isolated ID, nonexistent ID, malformed ID and another user's object. Admin children share the `/admin` layout, whose source sends non-admin users to `/dashboard`; the API must independently reject them.

For each API: valid input, missing/invalid/expired token where protected, wrong role, cross-user/team object access, malformed input, missing entity, persisted result on re-fetch and appropriate failure status. Read-only checks do not authorize mutations. Run mutations against isolated fixtures and record cleanup residuals.

Priority journeys: account registration -> real OTP receipt -> verification -> login; password reset -> old session revocation; leader/member invitation -> squad roster; paid enrollment -> proof -> admin review -> refreshed student status; project submission -> judge evaluation -> leaderboard; support conversation and realtime message delivery. All these journeys remain NOT TESTED in this matrix.

## Frontend route inventory

Each entry lists route, source file, and runtime status. Group labels describe intended use, not proven access-control enforcement.
- `/about` — `src/routes/about.tsx` — **PASS, LOCAL SCOPED: heading assertion** on port 5174. Remaining functionality NOT TESTED.
- `/admin-login` — `src/routes/admin-login.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/analytics` — `src/routes/admin.analytics.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/announcements` — `src/routes/admin.announcements.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/certificates` — `src/routes/admin.certificates.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/evaluations` — `src/routes/admin.evaluations.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/gallery` — `src/routes/admin.gallery.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/hackathons/$id` — `src/routes/admin.hackathons.$id.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/hackathons/create` — `src/routes/admin.hackathons.create.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/hackathons` — `src/routes/admin.hackathons.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/` — `src/routes/admin.index.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/judges` — `src/routes/admin.judges.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/leaderboard` — `src/routes/admin.leaderboard.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/logs` — `src/routes/admin.logs.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/mentors` — `src/routes/admin.mentors.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/payments` — `src/routes/admin.payments.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/problems/$id` — `src/routes/admin.problems.$id.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/problems/create` — `src/routes/admin.problems.create.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/problems` — `src/routes/admin.problems.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/recruitment` — `src/routes/admin.recruitment.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/schedule` — `src/routes/admin.schedule.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/settings` — `src/routes/admin.settings.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/sponsors` — `src/routes/admin.sponsors.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/submissions` — `src/routes/admin.submissions.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/support` — `src/routes/admin.support.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/teams` — `src/routes/admin.teams.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin` — `src/routes/admin.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/admin/users` — `src/routes/admin.users.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/ai-assistant` — `src/routes/ai-assistant.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/announcements` — `src/routes/announcements.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/auth/forgot-password` — `src/routes/auth.forgot-password.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/auth/otp` — `src/routes/auth.otp.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/auth/reset-password` — `src/routes/auth.reset-password.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/certificates` — `src/routes/certificates.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/challenge` — `src/routes/challenge.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/chat` — `src/routes/chat.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/code-of-conduct` — `src/routes/code-of-conduct.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/community` — `src/routes/community.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/dashboard` — `src/routes/dashboard.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/evaluations` — `src/routes/evaluations.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/faq` — `src/routes/faq.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/gallery` — `src/routes/gallery.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/hackathons/$id/register` — `src/routes/hackathons.$id.register.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/hackathons/` — `src/routes/hackathons.index.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/highlights` — `src/routes/highlights.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/host-event` — `src/routes/host-event.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/` — `src/routes/index.tsx` — **PASS, LOCAL SCOPED: homepage heading/navbar assertions** on port 5174. Remaining functionality NOT TESTED.
- `/invite/$token` — `src/routes/invite.$token.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/leaderboard` — `src/routes/leaderboard.tsx` — **FAIL, LOCAL ASSERTION: actual GLOBAL LEADERBOARD differs from expected CLASSIFIED STANDINGS** on port 5174. Remaining functionality NOT TESTED.
- `/login` — `src/routes/login.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/mentor-command-center` — `src/routes/mentor-command-center.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/mentor` — `src/routes/mentor.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/payment` — `src/routes/payment.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/privacy-policy` — `src/routes/privacy-policy.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/problems` — `src/routes/problems.tsx` — **PASS, LOCAL SCOPED: guest redirect and login heading** on port 5174. Remaining functionality NOT TESTED.
- `/profile-overview` — `src/routes/profile-overview.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/profile` — `src/routes/profile.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/recruitment` — `src/routes/recruitment.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/register` — `src/routes/register.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/settings` — `src/routes/settings.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/sponsors` — `src/routes/sponsors.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/support` — `src/routes/support.tsx` — **PASS, LOCAL SCOPED: guest authentication notice** on port 5174. Remaining functionality NOT TESTED.
- `/team` — `src/routes/team.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.
- `/timeline` — `src/routes/timeline.tsx` — **PASS, LOCAL SCOPED: timeline body text** on port 5174. Remaining functionality NOT TESTED.
- `/workspace` — `src/routes/workspace.tsx` — **NOT TESTED**. Apply common checks and verify route-specific data/actions.

## API inventory in registration order

Middleware text is copied from the route declaration, so handlers must still be read for ownership rules. Duplicate method/path entries are deliberate inventory evidence; earlier matching handlers usually respond first. Socket.IO events and `/api-docs` are described in the architecture document.

- `POST /api/auth/register` — no route-level requireAuth — **NOT TESTED**.
- `PUT /api/users/profile` — authenticated — **NOT TESTED**.
- `POST /api/auth/resend-otp` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/auth/verify-email` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/auth/login` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/auth/me` — authenticated — **NOT TESTED**.
- `POST /api/auth/sessions/revoke` — authenticated — **NOT TESTED**.
- `POST /api/auth/forgot-password` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/auth/reset-password` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/hackathons` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/hackathons` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/hackathons/active` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/hackathons/:id` — no route-level requireAuth — **NOT TESTED**.
- `PUT /api/hackathons/:id` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/hackathons/:id` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/publish` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/unpublish` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/open-registration` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/close-registration` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/open-submissions` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/close-submissions` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/hackathons/:id/register` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/hackathons/:id/payment-proof` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/hackathons/:id/my-registration` — authenticated — **NOT TESTED**.
- `GET /api/hackathons/:id/registration` — authenticated — **NOT TESTED**.
- `POST /api/hackathons/:id/retry-payment` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/admin/payments` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/payments/:registrationId/review` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/payments/:registrationId/receipt` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/hackathons/:id/registration` — authenticated — **NOT TESTED**.
- `GET /api/student/registrations` — authenticated — **NOT TESTED**.
- `GET /api/admin/problems` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/problems` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/problems/:id` — authenticated; roles: admin — **NOT TESTED**.
- `PUT /api/admin/problems/:id` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/admin/problems/:id` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/problems/:id/publish` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/problems/:id/lock` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/problems` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/hackathons/:id/problems` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/problems/:id` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/users` — authenticated — **NOT TESTED**.
- `GET /api/users/search` — authenticated — **NOT TESTED**.
- `GET /api/users/:id` — authenticated — **NOT TESTED**.
- `GET /api/teams` — authenticated — **NOT TESTED**.
- `POST /api/teams` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/join` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/leave` — authenticated; roles: student — **NOT TESTED**.
- `DELETE /api/teams/:id` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/:id/transfer` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/:id/lock` — authenticated; roles: student, admin — **NOT TESTED**.
- `PUT /api/teams/:id/links` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/:id/submit` — authenticated; roles: student, admin — **NOT TESTED**.
- `GET /api/admin/submissions` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/submissions/:id/:action` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/teams/:id/disqualify` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/teams/:id/undo-disqualify` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/teams` — authenticated; roles: admin — **NOT TESTED**.
- `PUT /api/admin/teams/:id` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/teams/:id/points` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/teams/:id/invite` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/accept-invite/:inviteId` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/teams/invitations/me` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/:id/select-problem` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/:id/request` — authenticated; roles: student, admin — **NOT TESTED**.
- `GET /api/teams/requests/me` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/requests/:id/:action` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/:id/kick` — authenticated; roles: student, admin — **NOT TESTED**.
- `POST /api/teams/:id/problem` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/submissions` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/evaluations` — authenticated; roles: judge, admin — **NOT TESTED**.
- `POST /api/evaluations` — authenticated; roles: judge, admin — **NOT TESTED**.
- `POST /api/certificates/generate` — authenticated — **NOT TESTED**.
- `GET /api/certificates/verify/:id` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/evaluations` — authenticated; roles: judge, admin — **NOT TESTED**.
- `GET /api/recruitment` — authenticated — **NOT TESTED**.
- `POST /api/recruitment` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/problems` — authenticated — **NOT TESTED**.
- `POST /api/problems` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/users` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/users/:id` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/timeline` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/timeline` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/sponsors` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/sponsors` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/gallery` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/gallery` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/faqs` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/faqs` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/search` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/public/stats` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/announcements` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/announcements` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/users` — authenticated; roles: admin — **NOT TESTED**.
- `PUT /api/admin/users/:id` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/admin/users/:id` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/logs` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/ai/chat` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/teams/:id/tasks` — authenticated — **NOT TESTED**.
- `POST /api/teams/:id/tasks` — authenticated; roles: student — **NOT TESTED**.
- `PUT /api/teams/:id/tasks/:taskId/status` — authenticated; roles: student, admin — **NOT TESTED**.
- `DELETE /api/teams/:id/tasks/:taskId` — authenticated; roles: student — **NOT TESTED**.
- `POST /api/teams/:id/submit` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/admin/submissions` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/analytics` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/support` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/support/:id/status` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/submissions/:id/unlock` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/admin/submissions/:id/lock` — authenticated; roles: admin — **NOT TESTED**.
- `PUT /api/teams/:id/links` — authenticated; roles: student — **NOT TESTED**.
- `GET /api/evaluations` — authenticated — **NOT TESTED**.
- `POST /api/evaluations/:teamId` — authenticated; roles: judge, admin — **NOT TESTED**.
- `GET /api/submissions` — authenticated; roles: judge, admin — **NOT TESTED**.
- `GET /api/evaluations` — no route-level requireAuth — **NOT TESTED**.
- `POST /api/evaluations/:teamId` — authenticated; roles: judge, admin — **NOT TESTED**.
- `GET /api/conversations` — authenticated — **NOT TESTED**.
- `POST /api/conversations/direct` — authenticated — **NOT TESTED**.
- `GET /api/conversations/:id/messages` — authenticated — **NOT TESTED**.
- `POST /api/conversations/:id/messages` — authenticated — **NOT TESTED**.
- `POST /api/support` — authenticated — **NOT TESTED**.
- `GET /api/support` — authenticated — **NOT TESTED**.
- `GET /api/admin/support` — authenticated; roles: admin — **NOT TESTED**.
- `PATCH /api/support/:id/status` — authenticated — **NOT TESTED**.
- `PATCH /api/admin/support/:id/status` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/support/:id/clone` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/admin/support/:id` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/settings` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/announcements` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/admin/announcements` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/announcements` — authenticated; roles: admin — **NOT TESTED**.
- `PUT /api/admin/announcements/:id` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/admin/announcements/:id` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/logs` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/sponsors` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/admin/sponsors` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/sponsors` — authenticated; roles: admin — **NOT TESTED**.
- `DELETE /api/admin/sponsors/:id` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/admin/certificates` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/admin/certificates/batch` — authenticated; roles: admin — **NOT TESTED**.
- `GET /api/notifications` — authenticated — **NOT TESTED**.
- `PATCH /api/notifications/:id/read` — authenticated — **NOT TESTED**.
- `GET /api/admin/analytics` — authenticated; roles: admin — **NOT TESTED**.
- `POST /api/mentor/requests` — authenticated — **NOT TESTED**.
- `GET /api/mentor/requests/all` — authenticated; roles: mentor, admin — **NOT TESTED**.
- `GET /api/teams/:id/mentor-requests` — authenticated — **NOT TESTED**.
- `POST /api/mentor/requests/:id/accept` — authenticated; roles: mentor, admin — **NOT TESTED**.
- `POST /api/mentor/requests/:id/resolve` — authenticated — **NOT TESTED**.
- `GET /api/gallery/projects` — no route-level requireAuth — **NOT TESTED**.
- `GET /api/leaderboard` — no route-level requireAuth — **NOT TESTED**.

## Evidence to add after execution

Replace NOT TESTED only with a scoped result: date, environment/build, role, route/API, assertion, actual status/result and evidence path. An HTTP 200 page shell does not prove successful hydration, authenticated data loading or a working action. Historical reports/scripts in the repository are not fresh evidence. Paid-flow assertions and cleanup caveats are in PAID_HACKATHON_FLOW.md and CODEBASE_ARCHITECTURE.md.



