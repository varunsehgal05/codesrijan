# Confirmed defect log — 2026-11-02
Initial source HEAD35afbef. Evidence scopes are explicit; new work is local.

## QA-LOCAL-001 — Support form references missing submit handler
Severity P1. Environment source/local. Route /support. Alias isolated student. Preconditions support form rendered. Reproduction open form or run strict tsc. Expected submit uses existing support handler. Actual undefined handleCreateTicket referenced; existing handler named handleSubmit. Evidence baseline typecheck.txt. Files src/routes/support.tsx. Fix wired existing handler. Status FIXED LOCALLY; browser regression pending. Cleanup none. Original267 ID mapping pending attachment.

## QA-LOCAL-002 — Admin upload notifications call missing toast import
Severity P2. Environment source/local. Route /admin/hackathons. Alias isolated admin. Reproduction upload oversized cover/spec/QR or run tsc. Expected visible validation toast. Actual toast undefined. Files src/routes/admin.hackathons.tsx. Fix import existing react-hot-toast. Status FIXED LOCALLY; affected browser regression pending. Cleanup none.

## QA-LOCAL-003 — Mentor view requests global squads
Severity P1. Environment source. Route /mentor-command-center and legacy mentor APIs. Expected assignment-only access. Actual global /teams fetch and globally exposed request workflows. Evidence inspected route/server at initial HEAD. Fix delegated backend+role portals; status IN PROGRESS; isolation regression mandatory. No production promotion.

## QA-LIVE-001 — Rules route404
Severity P2. Environment production Chrome. Route /rules. Alias guest. Expected source-defined route renders. Actual HTTP404 per public independent browser run. Source/deploy mismatch unresolved; no change deployed. Evidence PUBLIC_EXECUTION report pending. Status OPEN.

## QA-LOCAL-004 — Credential-bearing database fallbacks
Severity P1. Environment tracked source. Expected explicit environment config and tests local-only. Actual reusable URI literals in server and legacy AI provider test. No values retained in report. Backend fallback removal delegated; provider test now requires explicit localhost URI, syntax check passed. Owner must rotate exposed credentials manually. Status source FIX IN PROGRESS, rotation BLOCKED owner action.

QA-LIVE-001 follow-up: src/routes/rules.tsx absent at initial HEAD. Added local beforeLoad redirect to existing /code-of-conduct; avoids inventing new policy. Status FIXED LOCALLY, browser evidence pending; not deployed.
