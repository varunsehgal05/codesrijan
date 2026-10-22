# Final security review — 2026-10-23

Credential scan is metadata only; no secret value is included. Validity was not probed. Treat potentially reusable exposed credentials as valid until revoked.

## Exposure inventory and owner actions

- Tracked `server/clean_db.mjs`, `server/create_admin.cjs`, `server/seed_demo.cjs`: credential-bearing MongoDB fallbacks. Removed locally in this remediation; require explicit MONGO_URI and fail closed. Historical last modification reference `4c2e729`. Owner must rotate Atlas database credentials and review access logs; removing literals does not revoke historical copies.
- Ignored `scratch/process_user_tasks.cjs`, `server/check_hacks.cjs`, `server/clean_and_reset.cjs`, `server/force_open.cjs`, `server/update_hackathon_dates.mjs`, `test_otp_registration.cjs`: embedded MongoDB credential patterns. Preserved user files, do not execute. Owner should remove/secure after rotation.
- Ignored `server/serviceAccountKey.json` and `server/codesrijan-450d0-firebase-adminsdk-fbsvc-f970894c13.json`: private keys present. Owner must replace/revoke corresponding Google service-account keys and review permissions/access. Never upload these files.
- Git history for server/.env and server/serviceAccountKey.json includes refs 4c2e729, b72c956, f053314, a4220b6, 42bae9d, 6c206dd. Current ignore rules do not protect previous commits. No history rewritten.
- Tracked legacy/live browser scripts and ignored live-test scripts contain password literals; these may overlap reusable QA credentials. Rotate all previously shared platform/QA passwords and invalidate their sessions manually; do not assume test names make production accounts safe.
- Untracked playwright-report/data markdown files matched password-literal patterns: restrict sharing generated test artifacts and review before publication. Automated scan cannot clear binary screenshots. No artifact secrets copied into this report.
- Heuristic scanner also matches intentional local fixtures (test password strings, rejected URI cases, mock relay secrets). These are not evidence of a valid production secret. See artifacts/credential-scan-metadata.json for paths/type/state only.

## Verified source properties

No universal OTP code branch in active backend flow; bcrypt verification and atomic consumption control verification. Legacy session and Firebase paths require active verified stored users. Firebase-created users are students; privileged roles come from stored permissions. Password login denies identities without hashes; User JSON strips passwordHash. Admin payment receipt endpoint uses requireAuth and requireRole(['admin']). Reset API returns generic message, not tokens.

Found and patched password-reset Origin poisoning: requester-controlled Origin previously chose the emailed reset-link host. Host now comes exclusively from server FRONTEND_URL or canonical default. Added non-sending regression in server/test-security-atomic.js.

Socket privacy flaw patched locally: handshake reuses verified-account HTTP authentication, conversation subscriptions/typing require stored participant/team/admin authorization, and typing identities come from the server. Missing-auth socket regression passes. Browser authenticated chat remains to be verified; join/typing revalidate current session/account; existing subscribed sockets are not forcibly evicted upon later revocation. Global store socket now defers connection until authenticated and disconnects on logout/unmount. Existing legacy join_team/send_message events have no backend handlers; this flow is unsupported and is not claimed as passing.

## Validation and limits

Test output is captured in artifacts/final-security-escalated.txt. Initial sandbox run was blocked by local networking/MongoDB fassert; rerun explicitly approved outside sandbox against temporary MongoDB, mock email transports only. No real notification intentionally sent. Final counts must be read from completed output, not inferred from historical reports.

Lint launched to artifacts/final-lint.json. No mass-format applied. Historical baseline is 22,336; current count must come from completed machine-readable output. Compare modified file diagnostics to baseline before treating all findings as newly introduced.

No credential rotation, session revocation, published-history rewrite, production database cleanup, or deployment performed by this review.
Current lint: {"errors":21881,"warnings":21,"rules":{"prettier/prettier":21676,"@typescript-eslint/no-explicit-any":194,"no-empty":3,"react-refresh/only-export-components":8,"react-hooks/exhaustive-deps":13,"no-useless-escape":2,"prefer-const":6}}
Security rerun: 16 tests passed, 0 failed.

Completed current lint: 21,881 errors + 21 warnings. Rules: 21,676 Prettier formatting; 194 explicit-any; 3 no-empty; 8 React refresh; 13 hook dependencies; 2 escape; 6 prefer-const. Diagnostics in currently changed files were formatting-only in captured run. This is not proof that every baseline finding is safe. No mass formatting applied. Captured lint JSON source/fix/suggestions removed to avoid retaining credential-bearing original source. Historical aggregate22,336 differs; precise per-line baseline attribution unavailable without separately linting229510c in isolated checkout.
Security tests:16/16 passed before socket patch; socket/local suite7/7 passed after patch.

Final combined isolated run after socket/auth patches:18 tests passed,0 failed (artifacts/final-combined-security.txt). Includes successful member subscription, nonmember denial, server-owned typing identity, revoked-session denial, missing-token denial.
