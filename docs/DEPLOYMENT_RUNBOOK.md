# Deployment runbook

Assessment date: 2026-10-23 (Asia/Calcutta).

## Release gates

1. Review the dedicated `fix/admin-payment-notifications` branch diff. Preserve the pre-existing generated router change and untracked user artifacts. Do not force-push.
2. Run isolated regression tests. Never run legacy scripts against production. Backend now requires explicit `MONGO_URI`; use a disposable database for tests.
3. Review frontend build, TypeScript and lint results. Existing failures must be resolved or explicitly assessed before release.
4. Authenticate to Render and Vercel and record deployed commit IDs and Vercel's effective `VITE_API_URL`. Both reported backend hosts return HTTP 200 for `/api/hackathons`, but only `codesrijan-api-6tfr.onrender.com` exposes `/api/admin/payments` (401 anonymously); the other returns 404. Public frontend assets reference the older host. Configure `VITE_API_URL` to the verified payment-capable service URL `https://codesrijan-api-6tfr.onrender.com/api` after confirming the provider target. Local fallback URLs now use this service. Dashboard commit ownership remains unverified.
5. Set backend configuration names `ADMIN_NOTIFICATION_EMAIL`, `FRONTEND_URL`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`, and `MONGO_URI` through provider UI. Use the intended existing administrator inbox and frontend origin. Never record secret values in documentation.
6. Update the existing Apps Script deployment with reviewed `google-apps-script/Code.gs`. Its Script Properties require `CODESRIJAN_RELAY_SECRET`, `ADMIN_NOTIFICATION_EMAIL`, and `FRONTEND_URL`; the recipient and frontend origin must match the backend. Preserve existing web-app access/execution settings.
7. Deploy the reviewed backend and frontend commits through existing free services. Record each deployment result independently.
8. Verify isolated QA payment submission, persisted queue state, relay acceptance, actual inbox delivery, link destination and rejection/retry. Never approve fake proof as real payment. Without staging, use automated integration tests and mark inbox acceptance incomplete.

## Operational checks

Inspect database connectivity through authorized provider logs, without copying connection URIs. Confirm non-admin API calls remain rejected. Email failure must preserve the queue entry. `pending` notification outcomes can indicate process interruption or ambiguous delivery: reconcile against relay logs/inbox before any manual resend.

The backend no longer resets existing seed account passwords or promotes the historical E2E account on startup. Optional `SEED_ADMIN_PASSWORD` and `SEED_STUDENT_PASSWORD` only create absent accounts; leave unset in established production.

## QA data reconciliation

The public directory visibly lists eight QA events, including `qa-paid-hack-1792695285658`. Read the corresponding registrations, review history and team locks before changing anything. Existing delete routes do not provide an audited cancellation/reconciliation workflow. Do not hard-delete the event or unlock its team blindly. Identify affected records and obtain approval if genuine participants could be affected.

## Credentials

Hardcoded database credentials were found in source and removed from active startup/test fallbacks. Removal does not revoke historical exposure. The owner should rotate exposed database and shared privileged credentials through provider interfaces, then review Git history and ignored local scripts for retained copies. Do not perform automatic password changes.

## Security block encountered and fixed locally

Vercel rejected cac7c49 because @tanstack/react-start 1.168.32 is affected by CVE-2026-102989. Follow-up 229510c upgrades to 1.168.60 with compatible router packages and Vite 8.3.5; build/type checks pass without the dangerous override. Both production pushes were explicitly approved by the user. The existing relay is now version 4 with explicit UTF-8 HMAC; real inbox acceptance passed. Configuration and provider identity checks are completed; record final deployed commits from the readiness report before a subsequent release.
