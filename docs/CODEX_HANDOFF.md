# CodeSrijan engineering handoff

Assessment date: 2026-10-23, Asia/Calcutta. Real repository root is the nested `interactive-showcase-main` directory, not its containing workspace folder.

## Repository and branch

Initial branch: `master`; initial HEAD: `1c119cd`. Historical Render configuration commit `538b9a8` is present in local history. Active work: `fix/admin-payment-notifications`. Deployment commit IDs remain unverified because Render/Vercel browser sessions require login.

Pre-existing work preserved: modified `src/routeTree.gen.ts`; untracked `FULL_SITE_STRUCTURE.md`, `api_performance_test.js`, `playwright.config.ts`, `server/isolated_backend.js`, `playwright-report/` and regression output under `test-results/`. New verification outputs use `artifacts/` and ignored log files instead of overwriting those reports.

## Read first

- [Readiness report](PRODUCTION_READINESS_REPORT.md)
- [Architecture](CODEBASE_ARCHITECTURE.md)
- [All discovered routes and API declarations](ROUTE_TEST_MATRIX.md)
- [Security findings](SECURITY_AUDIT.md)
- [Paid workflow](PAID_HACKATHON_FLOW.md)
- [Email relay setup](EMAIL_RELAY_SETUP.md)
- [Deployment runbook](DEPLOYMENT_RUNBOOK.md)

## Working constraints

Keep hosting costs at zero. No Resend, paid upgrades, fake production payment approval, credential logging or hard deletion of production QA records. No destructive Git history changes. Never invoke legacy reset/seed/test scripts with inherited production credentials.

## Unfinished acceptance work

Authenticate to provider dashboards, record deployed commits and configuration, deploy reviewed/tested changes, verify actual administrator inbox delivery, and inspect existing QA registration/payment/team audit records. Public QA events are confirmed but private payment status and lock ownership remain unverified. Do not declare public launch readiness from local test results.

## Current release progress

Source commits: cac7c49 and 229510c, both pushed to main with explicit user approval. Render's baseline service is verified as codesrijan-api-6tfr.onrender.com. The older hostname is a different deployment and lacks the payment queue API. Vercel production VITE_API_URL now targets the verified service. Apps Script version 4 is deployed with matching notification configuration and explicit UTF-8 HMAC; real codesrijan@gmail.com inbox receipt is verified. See the readiness report for final application deployment outcomes and remaining QA/security gates. Do not use the earlier unfinished-acceptance list as evidence that inbox verification is still missing.

Final hosting evidence: Vercel229510c Ready and Render229510c Live, with database connection confirmed. Live frontend assets now reference the correct -6tfr API; protected APIs reject guests. Remaining work is the launch-gate list in the readiness report, not source deployment or inbox acceptance. Documentation/diagnostics are committed locally separately from the deployed source commits.
