# CodeSrijan production readiness assessment

Date: 2026-10-23 (Asia/Calcutta). Classification: **INTERNAL QA**.

## Executive assessment

The administrator payment-notification feature is implemented and genuine inbox delivery is verified. Authentication and payment-integrity fixes in approved commit `cac7c49` are live on Render, whose logs confirm MongoDB connectivity. The relay is deployed as version 4, including the Unicode signing fix discovered during real delivery testing. Vercel initially blocked the frontend on a known TanStack XSS vulnerability; the patched follow-up 229510c is now Ready. Render also reports 229510c Live with MongoDB connected. No production application data, credentials or payment approvals were changed. Private QA payment reconciliation and comprehensive role journeys remain open, so classification stays INTERNAL QA.

## Repository assessment

The actual Git root is `C:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main`. Work began at `master`, commit `1c119cd`, then moved to `fix/admin-payment-notifications`. Existing user modifications were preserved. Architecture: React/TanStack Start frontend, Express/Socket.IO backend, Mongoose/MongoDB, Firebase/session authentication and Apps Script transactional email. The inventory includes 65 frontend route declarations and 154 API declarations; declarations are not all unique endpoints. See the architecture and route matrix for source mapping and duplicate/model-collision risks.

## Parallel investigations

- Architecture/frontend workstream: mapped routes/models/APIs, documented cleanup limitations, repaired missing gallery state, workspace declaration order and disqualification-dialog wiring; ran browser and static checks.
- Security workstream: removed credential-bearing MongoDB fallbacks and fixed startup password resets, email-prefix role assignment, passwordless login, password-hash serialization and account-state enforcement; added isolated regression coverage.
- Payments/email workstream: implemented fixed recipient/template, persisted notification outcomes and atomic proof transition; repaired roster leader duplication and missing-account validation; exercised actual handlers with disposable MongoDB and relay VM tests.

## Deployment evidence

Both supplied backend hosts responded HTTP 200 to `/api/hackathons`, each with 12 records, but they are not interchangeable: `/api/admin/payments` returns 401 at `codesrijan-api-6tfr.onrender.com` and 404 at the older host. Public frontend assets referenced the older host. After the user signed in, Render identified the canonical service as `codesrijan-api-6tfr.onrender.com`, and Render/Vercel both showed deployed baseline `1c119cd`. Vercel had no project environment variables. Production `VITE_API_URL` was saved as `https://codesrijan-api-6tfr.onrender.com/api`, and local fallbacks were corrected in 34 files. Backend `MONGO_URI`, `APPS_SCRIPT_URL`, and `APPS_SCRIPT_SECRET` were confirmed present without reading values into reports. `ADMIN_NOTIFICATION_EMAIL` (user-selected `codesrijan@gmail.com`) and `FRONTEND_URL` were added using Save only. Matching relay Script Properties were saved and verified using boolean comparisons; the existing relay URL and access settings were preserved. Both application providers now serve the approved follow-up `229510c`; see final verification below.

Read-only live checks: `/api/users` and `/api/auth/me` returned 401 anonymously. The source-confirmed `/api/admin/payments` path exposed the backend mismatch described above. No active exploit or production OTP/password-reset mutation was attempted.

## Security and secrets

See SECURITY_AUDIT.md for precise verified defects and residual risks. Source credential removal does not revoke historical exposure: provider credential rotation and review of retained ignored local scripts remain required owner actions. Three tracked historical report files were scanned for credential/OTP patterns without printing values; no matches were found by that limited scan. This is not a complete Git-history or image-forensics scan.

## Email outcome

The fixed `payment_review_notification` template includes event/registration/reference/fee/currency/transaction timestamp and the configured admin queue link. It excludes receipt links, tokens and private participant records. Recipient selection is server-only and independently checked in Apps Script. Dynamic HTML is escaped; HMAC, timestamp, replay checks and script locking remain in place. Email failure preserves the saved review entry. Ambiguous outcomes require manual reconciliation before resend.

Real delivery used the actual payment handler and disposable local MongoDB only. Two rejected attempts preserved their review entries; no production data was created. No-send probes isolated a Unicode signature mismatch. Explicit UTF-8 HMAC in relay version 4 fixed it. The final reference `QA-ONLY-NO-PAYMENT-1792707337208` returned HTTP 200, persisted payment_under_review, sent exactly one notification and received relay/MailApp acceptance (quota returned 94). Independent Gmail UI inspection found and opened exactly one matching message, received at 03:45 IST on 23 October 2026. Its QA event, 0 INR fee, reference, timestamp and real `/admin/payments` link were verified. No private receipt URL or authentication material appeared. See REAL_NOTIFICATION_RESULT.md for full evidence. Quota snapshots are time-specific and changed between assessment turns; they are not cumulative delivery counts. Google documents 100 consumer-account recipients/day: [official quota guide](https://developers.google.com/apps-script/guides/services/quotas).

## Student/admin route status

The complete route inventory and scenario checklist is in ROUTE_TEST_MATRIX.md. The reviewed public browser suite ran against an externally reachable local frontend with only its port adjusted: four tests passed and one failed. The failure is a heading expectation mismatch: expected `CLASSIFIED STANDINGS`, observed `GLOBAL LEADERBOARD`. Authentication, enrollment, profile, chat, mentor/judge and other admin journeys were not comprehensively browser-tested. A later local Playwright capture verified registration at exactly 375×812 and 1280×800: no horizontal overflow and no uncaught page errors. Mobile help-widget overlap remains documented in RESPONSIVE_QA.md; this narrow check is not a complete responsive audit.

## Paid workflow and QA integrity

Actual-handler isolated tests cover persisted proof submission, concurrent retries, controlled notification payload/destination, delivery failure, queue persistence, authoritative fee/roster validation and missing-member rejection. Historical phase-3 tests additionally exercise copied handlers and therefore have weaker fidelity. Receipt content/privacy, UTR concurrency across distinct registrations, event-specific lock policy and all real browser transitions need further verification.

The live directory visibly lists eight QA events, including `qa-paid-hack-1792695285658`. The historical team ID is a lead only; private team membership, approved proof, metrics impact, lock ownership and audit history could not be verified without admin access. No cleanup was applied because event deletion alone lacks audited registration/lock reconciliation. A record-level plan is required before affecting possibly genuine participants.

## Verification ledger

- Frontend production build: **PASS**, final integrated rerun after fallback URL fixes.
- Combined security/concurrency/notification run: `node --test server/test-security-local.mjs server/test-security-atomic.js server/test_payment_notifications.mjs`: **15 passed, 0 failed** (7 atomic, 6 security, 2 notification).
- Legacy phase-3 suite: **23 passed, 0 failed** on a disposable MongoDB; duplicated handlers limit inference.
- Legacy phase-2 suite: **27 passed, 0 failed**, using guarded disposable MongoDB and mocked email. `node server/run-legacy-tests.js` runs both legacy suites; exit 0.
- Public Playwright: **4 passed, 1 failed**, unchanged assertions; earlier attempts were blocked by sandbox browser/network isolation, then resolved using the installed browser and external local frontend.
- Lint: **FAIL**, 22,336 findings (22,315 errors, 21 warnings), mostly formatting; no mass reformat applied.
- TypeScript: **PASS**, zero diagnostics after scoped fixes, including final integrated rerun.

## Meaningful changes

Backend: server startup/auth/registration/payment/review handlers; authentication middleware; user/registration/auth schemas; email dispatcher. Relay: fixed controlled template and setup guide. Safety/tests: explicit isolated-database helper, security/notification suites, legacy-suite runner, safe test defaults. Frontend: targeted runtime/type corrections. Configuration: removed vulnerable-deployment override, declared notification configuration names, exposed new regression tests through scoped ignore exceptions. Documentation: handoff, architecture, routes, security, payment, email, deployment and this report. Exact final changed-file inventory is available from Git diff; pre-existing user artifacts are identified in CODEX_HANDOFF.md.

## Release outcome and next gates

Source changed and tested: yes. Initial commit `cac7c49` was pushed after automatic review initially rejected the broad production push and the user explicitly approved the exact commit. Render deployed it successfully; startup and MongoDB connectivity were verified. Relay deployed: version 4, real inbox delivery verified. Initial Vercel deployment failed on CVE-2026-102989; the unsafe override was not restored. The targeted patched-dependency follow-up 229510c is deployed successfully on both providers. Production data verification remains read-only; QA cleanup and full authenticated route coverage remain open gates.

## Follow-up release and dependency evidence

Approved follow-up commit `229510c` patches TanStack Start to 1.168.60, aligns React Router 1.170.41 / router plugin 1.168.42, updates Vite to 8.3.5 and compatible vulnerable transitive packages, and makes relay HMAC explicitly UTF-8. Two error boundaries now handle the router's `unknown` error type correctly. Final TypeScript and production build both exit 0; Unicode notification tests pass 2/2. Live Unicode no-send authentication and actual inbox receipt are independently verified. The follow-up was pushed to main after explicit user approval.

Npm audit after compatible updates reports four high-severity findings in the Firebase/Firestore/grpc dependency chain and no critical findings. The suggested forced Firebase downgrade is a breaking change and was not applied. Scope/reachability and a supported upstream fix require further review before public launch. Backend deployment logs separately reported two moderate advisories. Lint and the stale leaderboard assertion remain failed as reported; no assertions were weakened.

Production acceptance remains incomplete: no staging environment was available for the full team-paid-approval/rejection browser scenario, and historical production QA record reconciliation requires authenticated record-level review. The successful notification test was deliberately isolated from production application data. Browser screenshots and measurements are retained under artifacts/screenshots; scope and widget overlap are documented in RESPONSIVE_QA.md.

## Final production verification

Vercel reports production release 229510c Ready (36-second build). A fresh read of codesrijan-nine.vercel.app returned HTTP 200; all 10 discovered JavaScript assets were checked, and the embedded API reference is now https://codesrijan-api-6tfr.onrender.com/api. The verified backend returns 200 for /api/hackathons and 401 anonymously for /api/admin/payments and /api/users. This confirms the frontend/backend URL mismatch is repaired in the live frontend. Render independently reports follow-up 229510c Deploy succeeded / Live, with MongoDB Connected in startup logs. The live homepage loaded its event/statistics data and showed no captured console errors.

## Remaining launch gates (ranked)

1. Rotate historically exposed reusable credentials through provider/account interfaces; inspect retained ignored scripts and Git history without rewriting published history. No automatic rotation was authorized or performed.
2. Reconcile eight publicly listed QA events and their private payment/registration/team-lock records. Genuine ownership and metrics impact must be proven before record-level mutations. No production cleanup was applied.
3. Complete authenticated student/admin/mentor/judge browser journeys and the full isolated team-paid review/rejection/retry scenario. The route matrix clearly marks untested routes; source presence is not a pass.
4. Resolve or assess four high frontend Firebase-chain advisories and two moderate backend advisories without forced incompatible downgrades.
5. Resolve baseline lint failures, the leaderboard test's stale heading expectation, and the mobile help-widget overlap. The existing test assertion was preserved.

Final classification remains **INTERNAL QA**, despite successful application deployments and real inbox verification. No money was transferred, no paid hosting was enabled, no dummy production payment was approved, and existing user work was preserved. Source deployments are cac7c49 followed by 229510c; the separate evidence-documentation commit remains local and was not deployed.

Additional runtime lead: stopping the assessment's local development server surfaced historical logs from 01:30 containing React Maximum update depth exceeded. These preceded the final frontend/dependency fixes and have not been attributed or reproduced against the final release. Include this lead in authenticated route regression work; the final live homepage console check was clear. Do not infer all frontend routes are error-free from the narrow public checks.
