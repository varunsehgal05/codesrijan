# Backend role workflow execution — 2026-11-02

Scope: master QA Phase 3 backend implementation and focused Phase 5 security regression. Current source is authoritative. This report does not claim full-platform or 267-case coverage; the referenced numbered 267-case catalogue was not provided as a separate executable/specification file.

## Changes

- Consolidated all duplicate legacy evaluation routes into `server/role-portals.js`. Legacy POST paths use the same assignment, rubric, validation and locking checks as the dedicated Judge API.
- Added assigned Mentor/Judge dashboard APIs, event-scoped assignments, guidance claim/respond/resolve/reopen with response history and notifications, mentor-owned private notes, rubric-based drafts/finals and administrator reopening with audit records.
- Scores are calculated on the server from configured event criteria. No event rubric or dashboard metric is invented. Unconfigured/invalid rubrics fail with 409. Evaluation status remains the existing draft/submitted enum; submitted means locked.
- Added administrator assignment and rubric configuration APIs. Existing submitted legacy evaluations without assignmentId remain visible to their assigned judge and cannot bypass final locking.
- Removed the embedded database URI/fallback from the running server. MONGO_URI must be explicitly configured. Previously exposed credentials require owner rotation; deleting a source literal does not rotate it or remove historical exposure.
- Closed conversation metadata disclosure and guessed-support-conversation auto-enrollment. Removed hardcoded cross-account ticket ownership and description-text access rules.
- Maintenance bypass now checks a current authenticated administrator, including session expiry/revocation and account status.
- Student submission persistence now retains the event and existing project identifiers required for Judge assignment resolution.

## Exact owned files

`server/server.js`, `server/role-portals.js`, `server/models/index.js`, `server/models/tertiary.js`, `server/test-role-portals.js`, `server/qa-role-fixture.js`, `docs/qa/SECURITY_EXECUTION.md`.

Existing modified product-owner discovery documents and other agents' frontend files were not included in this workstream's changes or staging.

## Empirical results

Command: `node --test server/test-role-portals.js`

Actual final runner summary: **22 tests, 22 pass, 0 fail, 0 skipped**, duration 17034.496 ms. Real HTTP requests and Socket.IO connections were made to the actual Express server on a loopback ephemeral port. MongoMemoryServer used a disposable database named codesrijan_test_roles; users, assignments, submissions, requests, notes and evaluations were local fixtures. Email dispatch and transporter were mocked. No production credentials, role changes, payments, data deletion, or external mail were used.

Executed checks:

1. Missing and invalid authentication on role APIs.
2. Wrong-role dashboard and private-score denial.
3. Assigned Mentor squads and roster-field minimization.
4. Guidance input, membership, notification scope and mass-assignment resistance.
5. Guidance history/claim assignment isolation and meeting URL validation.
6. Concurrent guidance claims: one winner.
7. Response history, resolution and student reopening.
8. Private-note role/assignment isolation.
9. Conversation metadata and support auto-heal ownership.
10. WebSocket authentication and private-room denial.
11. Assigned Judge submission queues and details.
12. Assignment checks on every legacy evaluation write path.
13. Score bounds/type/duplicate criterion and final-feedback validation.
14. Persisted/resumable draft and server-computed 68-point weighted total.
15. Concurrent final submissions: one winner; all save routes locked.
16. Administrator-only reopening, required reason and audit record.
17. Legacy final evaluation compatibility and locking.
18. Administrator assignment role/target validation.
19. Event rubric permissions, weights, configuration and post-grading immutability.
20. Immediate HTTP denial after assignment revocation.
21. Expired/revoked sessions and disabled accounts.
22. Attacker-origin CORS exclusion and maintenance enforcement, including expired administrator sessions.

Command: `node --test server/test-security-local.mjs`

Actual final runner summary: **8 tests, 8 pass, 0 fail, 0 skipped**, duration 5197.1922 ms. This existing suite mocks database/integration calls and checks WebSocket membership/typing identity/revocation, URI safety, password-hash redaction, missing-password login denial, disabled/unverified sessions, locked rosters and protected receipts.

Commands: `node --check server/server.js` and `node --check server/role-portals.js`: both exit 0.

The first restricted-environment attempts failed before meaningful verification: mongod fassert on startup and localhost EACCES. The successful runs used the approved process permission path. Those failed infrastructure attempts are not counted as passing test runs.

## Browser fixture and limits

`node server/qa-role-fixture.js` starts a separate disposable MongoDB and loopback API on port 5012. It creates only local role identities and writes their session material into a temporary `.local.json` file; never log or commit that file. Delivery is mocked. The runner handles SIGINT/SIGTERM by stopping the server/database and removing that temporary file. The frontend workstream received the private path for independent browser contexts.

Browser journeys and screenshots belong to the frontend execution report. Exhaustive API/model inventories, live database collection counts, production readiness, integration deliveries and complete numbered catalogue coverage are not established by these 30 focused tests and require the respective workstream evidence. No production mutation was performed here.

Remaining limitations: role dashboards currently load all assigned records without pagination; rubric replacement spans multiple MongoDB writes and is not a transaction; previously joined Socket.IO rooms rely on existing per-event authorization and do not proactively eject every socket after later account/assignment changes. The added test proves unauthorized room admission is denied, not proactive ejection of an already joined room.
