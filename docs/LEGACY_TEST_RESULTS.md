# Historical regression suites — 23 October 2026

## Isolation and reproduction

From the repository root, run `node server/run-legacy-tests.js`.

The runner creates an ephemeral local MongoDB process, assigns each suite a separate `codesrijan_test_*` database through the guarded `TEST_MONGO_URI`, disables Apps Script and SMTP provider configuration, and stops MongoDB after both suites finish. Historical phase 2 injects SMTP mocks; phase 3 injects a relay mock. No production database or real mailbox is used. A cached MongoDB binary (or its initial download) and permission to launch the local test process are required.

## Results

- Phase 3 (`server/test_phase3_paid_hackathons.mjs`): **23 passed, 0 failed**, exit 0.
- Phase 2 (`server/test_phase2_security.mjs`): **27 passed, 0 failed**, exit 0.

Combined runner exit: **0**. Phase 2 now additionally verifies that immediate pending-account recovery shares the resend cooldown and cannot change credentials when throttled. It advances only the disposable fixture's resend timestamp before retaining the original successful recovery/login assertions. An initial intermediate source-edit failure was repaired before this final run; the final full application retains all 154 route declarations.

Phase 3 covers free registration, paid team registration, roster flags, fixed team fee, proof submission, duplicate references, admin queue authorization, and review status changes. Its Express handlers are copied into the test itself; passing results verify that historical harness, not the current `server.js` implementation. The HMAC test also uses a dispatcher mock rather than deployed Apps Script.

The separate `node --test server/test_payment_notifications.mjs` suite invokes the real application handlers with temporary MongoDB and executes the actual `Code.gs` in a simulated Apps Script runtime. Its latest notification/roster run after the server restoration passed **2 tests, 0 failures** (6.87 seconds). Neither suite proves production behavior or inbox receipt.
