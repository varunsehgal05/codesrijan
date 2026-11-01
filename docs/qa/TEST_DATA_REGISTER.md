# Test data register
Date: 2026-11-02
Production mutation policy: no financial actions, role promotions, public announcements, real record deletions, OTP/reset email sends or load tests.
Local suites use their own temporary MongoDB databases and mock mail transports. Role identities are isolated aliases, not production promotions. Record actual fixture run outcomes in SECURITY_EXECUTION.md and role acceptance reports.
Live public/auth QA uses supplied account aliases, private fresh contexts, no cookie sharing and no persisted plaintext credentials.

Student browser created a separate QA-2026-11-02-STUDENT identity in the disposable local API5012 database via its local admin. Password generated only in runtime; no production account or existing fixture team changed. Admin rubric/assignment fixtures also isolated and coordinated to avoid judge tests.
