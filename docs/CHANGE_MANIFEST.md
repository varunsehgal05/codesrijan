# Change manifest

Assessment changes on fix/admin-payment-notifications. Existing src/routeTree.gen.ts work is user-owned and excluded below.

- .gitignore: Scoped test tracking or deployment configuration safety.
- google-apps-script/Code.gs: Fixed administrator notification template and relay configuration guidance.
- google-apps-script/README.md: Fixed administrator notification template and relay configuration guidance.
- render.yaml: Scoped test tracking or deployment configuration safety.
- server/check_user.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/middleware/auth.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/models/auth.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/models/index.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/server.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/services/email.js: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/test_phase2_security.mjs: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- server/test_phase3_paid_hackathons.mjs: Authentication, payment notification/integrity, safe database configuration or regression harness correction.
- src/components/ChatBotWidget.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/components/NotificationBell.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/lib/store.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/lib/utils.ts: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.hackathons.$id.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.hackathons.create.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.index.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.leaderboard.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.payments.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.problems.$id.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.support.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.teams.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/admin.users.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/ai-assistant.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/auth.forgot-password.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/auth.otp.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/auth.reset-password.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/certificates.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/chat.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/dashboard.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/faq.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/gallery.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/hackathons.$id.register.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/hackathons.index.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/index.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/mentor-command-center.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/mentor.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/payment.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/problems.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/profile.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/recruitment.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/register.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/settings.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/sponsors.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/support.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/team.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/timeline.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- src/routes/workspace.tsx: Verified backend fallback URL and/or targeted frontend runtime/type correction.
- vercel.json: Scoped test tracking or deployment configuration safety.

New source/test files: server/test-database.js, server/test-security-local.mjs, server/test-security-atomic.js, server/test_payment_notifications.mjs, server/run-legacy-tests.js.

New documentation: CODEX_HANDOFF.md, CODEBASE_ARCHITECTURE.md, ROUTE_TEST_MATRIX.md, SECURITY_AUDIT.md, PAID_HACKATHON_FLOW.md, EMAIL_RELAY_SETUP.md, DEPLOYMENT_RUNBOOK.md, LEGACY_TEST_RESULTS.md, PRODUCTION_READINESS_REPORT.md and this manifest.

Follow-up 229510c also changes package.json/package-lock.json (patched and aligned dependencies), src/routes/__root.tsx and admin.teams.tsx (unknown error handling), relay Code.gs and email.js (explicit UTF-8), and the notification regression (Unicode case). New opt-in local delivery/no-send diagnostic scripts are retained with documentation; no secrets are embedded.
