Codesrijan Full Cross Role and Every Control Qa Mission
CODESRIJAN — FULL CROSS-ROLE, EVERY-CONTROL & REPEAT-UNTIL-GREEN QA MISSION

Purpose: Close every remaining testing gap by exercising every discovered interactive control and every permitted/denied interaction between two real test identities. This is an executable Antigravity/GSD mission, not a claim that the tests have already run.

Execution target: Live production for read-only inspection and approved QA-owned records; isolated staging/test database for destructive, irreversible, concurrency, email and state-transition testing.

Working rule: Discover → test → capture evidence → reproduce → fix → add regression → rerun affected suite → rerun full regression → update STATE.md. Repeat until every in-scope case is PASS or explicitly BLOCKED with a documented owner/action. Never hide failures or relabel unrun checks as passed.

0. Mission and release objective
<role> Act as the GSD orchestrator, senior QA lead, browser automation lead, API/security tester and release auditor for CodeSrijan. Delegate independent workstreams to fresh-context Antigravity subagents. Use real browser interaction and actual API responses. Test the deployed application and the corresponding repository revision. Treat all supplied audit reports as claims to verify, not as evidence of current behavior by themselves. </role><objective> 1. Verify the actual production frontend/backend revision before testing. 2. Discover every current route, tab, button, link, icon-button, menu item, input, select, checkbox, modal, form, upload, drag/drop control, keyboard action, notification action and backend operation. 3. Execute every discovered control at least once in the correct role and state; execute negative, repeated, stale-session, network-failure and authorization variants where applicable. 4. Test user-to-user and role-to-role workflows, including Student↔Student, Student↔Mentor, Student↔Judge, Student↔Admin, Mentor↔Mentor, Mentor↔Admin, Judge↔Judge, Judge↔Admin, Mentor↔Judge and Admin↔Admin. 5. Test the same workflow from both sides: initiating actor and receiving actor. Verify what each can see, do, edit, withdraw, resolve, reopen or not access. 6. Test API authorization independently of UI visibility, including direct URL, object-ID substitution, replay, concurrency and WebSocket access. 7. Fix confirmed defects, write automated regression tests and repeat the test cycle until all applicable checks pass or a genuine blocker is documented. 8. Deliver evidence-backed live snapshots, a full control inventory, role-interaction matrix, defect log and final release decision. </objective>

<success_criteria>

The actual deployed commit is identified and matches the repository commit intended for release.
Every discovered route has a route-level smoke test.
Every discovered interactive control appears in CONTROL_INVENTORY.csv and has a recorded outcome, including intentionally disabled controls and conditional controls.
Each applicable role-pair matrix below has been exercised in both directions using separate browser profiles/accounts.
All state-changing tests use isolated QA fixtures or explicitly approved QA-owned production records.
Unauthorized paths are denied by the server, not merely hidden in the UI.
Every failed test has a defect ID, reproduction steps, evidence and regression test.
The original 267 test IDs, previously reported 200 regression cases, latest 43 fix checks, historical assertion suites and this new interaction/control suite are reconciled without double-counting.
No production payment, real participant record, final evaluation, public broadcast or account role is changed without explicit owner approval.
All tests are PASS, NOT APPLICABLE with a reason, or BLOCKED with exact blocker/owner. No unexplained NOT RUN cases remain at sign-off.
</success_criteria>
1. Current project references and source-of-truth rules

Read before execution:

GSD-STYLE.md
.gemini/GEMINI.md
STATE.md
docs/qa/FINAL_RELEASE_ACCEPTANCE_AUDIT.md
docs/qa/CODESRIJAN_MASTER_ALL_IN_ONE_QA_DELIVERABLES.md
CODESRIJAN_GSD_MASTER_QA_AND_ROLE_DASHBOARDS.md
CODESRIJAN_LATEST_FIXES_LIVE_REGRESSION_RUNBOOK.md
CODESRIJAN_JUDGE_MENTOR_LIVE_QA_MASTER_PLAN.md
JUDGE_AND_MENTOR_COMMAND_CENTERS_COMPLETE_GUIDE.md
ROLE_PORTALS_AND_EMAIL_AUDIT.md
Current source code, route tree, API routers, models, middleware, test scripts, CI and deployment configuration.
1.1 Environment and revision discrepancies to resolve first

Previously supplied reports mention multiple revisions and frontend assets, including 000761e, 0dbc204, 905c91c, 29d36e0, 9d32260, and different Vercel bundle names. Do not assume all refer to the same deployment.

Before testing:

Read local git rev-parse HEAD, branch, clean/dirty status and git status.
Read git rev-parse origin/main and origin/master (fetch first if authorized).
Record deployment provider's deployed commit/build ID for Vercel and Render.
Confirm the live frontend bundle hash/build marker and backend health/build marker if exposed.
Confirm frontend API base URL points to the intended canonical backend.
Confirm backend reports successful MongoDB connection without returning connection strings or secrets.
Record the canonical release revision in docs/qa/FINAL_RUN_ENVIRONMENT.md.
If frontend and backend revisions are incompatible or cannot be confirmed, stop write testing and mark the release-verification workstream BLOCKED.

Known production URLs from the latest reports:

Frontend: https://codesrijan-nine.vercel.app
Backend API: https://codesrijan-api-6tfr.onrender.com/api

Configuration naming: Previous reports mention both MONGO_URI and MONGODB_URI. Inspect actual server configuration and deployment environment variable names. Record variable names only, never values. Never print credentials.

1.2 Authority order
Actual currently deployed frontend/backend behavior and matching source commit.
Current source implementation and server-side authorization.
Latest product policy in STATE.md and current accepted specifications.
Historical QA reports and screenshots.
This plan, which adds testing coverage but does not silently change product policy.

Where two documents conflict, create docs/qa/CROSS_ROLE_POLICY_DECISIONS.md; do not infer permissions from a visual button or older API table.

2. Accounts, roles and test identity setup
2.1 Account aliases

Use the test identities supplied by the owner in the conversation/secure credential vault. This file intentionally contains no passwords.

Alias	Role	Usage
QA-ADMIN-A	Admin	Primary admin test identity
QA-ADMIN-B	Admin	Required for admin-to-admin, race and audit tests; provision in staging if absent
QA-STUDENT-A	Student / squad leader	Create QA squad and initiate workflows
QA-STUDENT-B	Student / squad member	Accept invite, communicate, receive actions
QA-STUDENT-C	Student / independent user	Wrong-owner and cross-squad denial tests
QA-STUDENT-D	Student / second squad leader	Independent squad and concurrency tests
QA-STUDENT-E	Student	Additional notifications and marketplace interactions
QA-STUDENT-F	Student	Additional negative and parallel tests
QA-MENTOR-A	Mentor	Primary mentor workflow
QA-MENTOR-B	Mentor	Mentor-to-mentor and conflicting claim tests; provision in staging if absent
QA-JUDGE-A	Judge	Primary evaluation workflow
QA-JUDGE-B	Judge	Judge-to-judge, assignment and concurrent review tests; provision in staging if absent
QA-ANON	Anonymous	Public route and unauthenticated control tests
2.2 Credential security
Retrieve credentials only from the original owner-provided secure context or approved secret store.
Never reproduce passwords in this plan, source, Git, screenshots, Playwright traces, console logs, defect tickets or result files.
Prefer local untracked .env.qa / browser credential vault. Confirm it is ignored by Git.
Never place account passwords or tokens into STATE.md or persistent QA artifacts.
The owner has shared credentials in conversation. Treat them as exposed: recommend rotating any real account password after the QA campaign, especially personal mailbox credentials.
Do not use the same account simultaneously in multiple browser workers. Each worker gets an isolated profile.
2.3 Minimum data topology

In staging or isolated fixture DB, prepare:

Two students in Squad A (leader + member).
Two students in Squad B (different leader + member).
One unassigned student.
Two mentors with different assignment scopes.
Two judges with different assigned submissions.
Two administrators for concurrent and audit tests.
One event with registration open, one closed/completed event, and one event with configured judging rubric.
One hidden/manual-release problem, one published problem.
One QA submission eligible for draft, one QA submission eligible for final submission, one already-finalized evaluation fixture.
Guidance requests in pending, accepted, resolved and cancelled states if supported.
Notification fixtures for each role.
Email capture inbox/provider test adapter.

Use deterministic IDs prefixed QA-<run-id>-. Do not fabricate live dashboard data. Seed fixtures only in isolated test environments. If the required topology is unavailable in production, do not mutate production to manufacture it; mark those writes BLOCKED and run in staging.

3. Mandatory subagent orchestration

Use Antigravity's actual supported subagent mechanism (invoke_subagent or its equivalent). Do not merely write that agents are active. Start them, capture returned task IDs, verify they are running, and collect result blocks.

3.1 Agents to launch
Agent	Scope	Suggested parallelism
SUB-ENV-DEPLOY	Git revision, Vercel/Render build identity, DB health, environment integrity	Read-only first
SUB-UI-INVENTORY	Crawl every route and inventory every control for every role/state	Read-only
SUB-STUDENT-STUDENT	Student↔student and student squad workflows	QA fixtures
SUB-STUDENT-MENTOR	Student↔mentor guidance, messages, notes privacy	QA fixtures
SUB-STUDENT-JUDGE	Student↔judge submission/result/feedback boundaries	Mostly read-only
SUB-STUDENT-ADMIN	Student↔admin payments, support, announcements, moderation	QA fixtures
SUB-MENTOR-ADMIN	Mentor↔admin assignments, revocations, escalation, audit	QA fixtures
SUB-JUDGE-ADMIN	Judge↔admin assignment, rubric, evaluation reopen and audit	QA fixtures
SUB-MENTOR-JUDGE	Separation and explicitly shared information	Read-only/denial tests
SUB-ADMIN-ADMIN	Two-admin concurrency, session, audit and conflict tests	QA fixtures
SUB-CHAT-NOTIFY-EMAIL	Direct messages, room ACL, notifications, transactional emails	Captured QA recipients
SUB-API-SEC-IDOR	API inventory, object scope, replay, role spoofing and data exposure	Staging/read-only production
SUB-JUDGE-PORTAL	All judge buttons, forms, tabs, score lifecycle	QA submission only
SUB-MENTOR-PORTAL	All mentor buttons, forms, tabs and request lifecycle	QA request only
SUB-ADMIN-PORTAL	All admin interactive controls and state changes	Serialized admin account
SUB-NFR-ACCESSIBILITY	Keyboard, accessible names, responsive, browser console, loading/error states	Read-only
SUB-REGRESSION	Re-run repaired defects and full regression	After fixes
SUB-ORCHESTRATOR	Reconcile evidence, deduplicate test counts, release verdict	Coordinates all

If available subagent capacity is lower, run read-only agents in parallel and serialize stateful admin/payment/evaluation operations. Do not share one admin session across agents.

3.2 Fresh-context instructions for each agent
Plain text
You are [AGENT_ID], a focused CodeSrijan QA subagent.
Read this exact file: CODESRIJAN_FULL_CROSS_ROLE_AND_EVERY_CONTROL_QA_MISSION.md
Read GSD-STYLE.md, .gemini/GEMINI.md, STATE.md and your assigned current source files.
Use a fresh context and isolated browser profile. Test only your assigned scope.
Use owner-supplied account aliases; retrieve passwords securely at runtime only.
Do not expose passwords, OTPs, tokens, cookies, private notes, personal data or payment proof.
Confirm frontend/backend deployed revision before browser testing.
Use QA-owned fixtures for all state-changing operations.
Test actual browser controls and verify the resulting backend state.
Return the structured result format in Section 12.
Do not claim any test passed without an assertion and evidence path.
Do not commit code unless the orchestrator explicitly assigns a fix task.
4. Discover and test every button, link, field, tab and modal

This is mandatory and dynamic. The exact number of controls is unknown until the live DOM is inventoried. Do not invent a fixed button count.

4.1 Route/role/state coverage crawl

For each route and each applicable role:

Open by direct URL.
Open through the in-app navigation.
Refresh the page.
Test browser back/forward.
Test route with no session.
Test correct role.
Test a wrong role.
Test expired/revoked session.
Capture loading, empty, populated and error states where the data allows.
Inspect browser console and failed network requests.
Inspect mobile 320/360/390px, tablet 768px, desktop 1280/1440px.
4.2 Control inventory file

Create docs/qa/CONTROL_INVENTORY.csv with at least these columns:

csv
control_id,route,portal,role,state,control_type,accessible_name,selector_or_testid,precondition,action,expected_navigation,expected_api,expected_state_change,destructive,keyboard_action,positive_test,negative_test,double_click_test,retry_test,network_failure_test,refresh_persistence_test,wrong_role_test,evidence_path,actual_result,status,defect_id

Inventory all:

Buttons and icon-only buttons.
Text links and external links.
Sidebar tabs and segmented controls.
Dropdowns, menus, context menus and command palettes.
Text, number, email, URL, password and search inputs.
Textareas, checkboxes, radio groups, switches and selects.
File uploads, drag/drop zones, image crop/preview controls.
Modals, drawers, accordions and expandable rows.
Pagination, sorting, filters and table actions.
Copy, download, print, QR and certificate actions.
Chat send, attachment, typing, room join/leave and read actions.
Refresh, retry, dismiss, close, cancel and back controls.
All CTAs and floating widgets such as SrijanBot.
Conditional controls shown only for a given status/role.
Disabled controls and controls hidden by policy (record why).
4.3 Standard test set for each interactive control

For every control, execute the applicable checks:

CTRL-01: visible when expected and has a meaningful accessible name.
CTRL-02: primary click performs exactly the advertised action.
CTRL-03: keyboard activation works (Enter/Space; Escape for dismissible UI).
CTRL-04: correct route/target and URL parameters.
CTRL-05: correct API method/path/body and expected success status.
CTRL-06: resulting backend record/state is persisted and matches UI.
CTRL-07: double-click does not duplicate destructive or transactional action.
CTRL-08: repeated click/retry behaves idempotently or shows an intentional state.
CTRL-09: invalid/missing input is rejected on the server.
CTRL-10: wrong role/owner is denied server-side.
CTRL-11: slow/offline/5xx response produces clear recoverable state.
CTRL-12: refresh/back/relogin preserves committed data and discards uncommitted data correctly.
CTRL-13: stale data/conflicting update is handled without silent overwrite.
CTRL-14: mobile/touch/focus behavior is usable.
CTRL-15: no console error, unhandled promise, sensitive-data leak or duplicate notification.

Skip only genuinely inapplicable checks and state the reason. Do not click a real destructive control on production just to demonstrate it; use staging/QA-owned records.

4.4 Form-field checks

For every field test: empty; whitespace-only; minimum; maximum; below minimum; above maximum; Unicode; emoji; leading/trailing whitespace; pasted content; special characters; HTML/script-like input; malformed URL; invalid file type; oversized file; duplicate submission; browser autofill; refresh during edit; server rejection; and accessible validation message. Respect the field's actual schema and do not assume every field accepts every character.

5. Two-account and role-to-role interaction matrix

Every scenario must be tested from both sides. For a message/invite/assignment/action, record actor-side UI, recipient-side UI, server-side record and unauthorized third-party outcome.

5.1 Role-pair matrix (required)
Pair	Valid scenarios to test	Mandatory denial/isolation scenarios
Student A ↔ Student B	Team invite, join request, acceptance, roster, permitted direct/squad chat, task collaboration, recruitment invitation, notification	Uninvited student cannot join; non-leader cannot remove/promote/disband; other squad cannot read private messages or drafts
Student ↔ Mentor	Student creates guidance request; mentor sees assigned request; claim, response, meeting link, resolve, reopen; student receives response and status update	Student cannot read mentor-private notes; mentor cannot see unassigned squad; student cannot claim/resolve as mentor; other mentor cannot read private notes unless policy explicitly grants it
Student ↔ Judge	Student submits project; assigned judge sees it; judge draft/final states; only intentionally published result/feedback is visible to student	Student cannot see private draft, internal evaluator notes or other projects; judge cannot edit student submission or score unassigned project
Student ↔ Admin	Support ticket, payment proof review notification, registration status, disqualification notice, published announcements, authorized profile/account actions	Student cannot call admin APIs, view private audit logs/receipt review, change own role, alter payment state or modify other students
Mentor A ↔ Mentor B	Separate squad assignments; request ownership; allowed handoff/reassignment; notification and audit	Mentor B cannot access A's private notes or unassigned squad/request; claim race has one winner; no duplicate responses
Mentor ↔ Admin	Admin assigns/reassigns/revokes mentor; mentor sees new scope; admin handles escalation; audit history	Mentor cannot grant own assignments, elevate role, inspect global user/payment/admin logs; revoked mentor immediately loses access
Judge A ↔ Judge B	Separate assignments, multi-judge evaluation if configured, independent drafts, aggregate score behavior, assignment changes	Judge B cannot read A's private draft unless policy explicitly permits; one judge cannot alter another's score; revoked assignment blocks reads/writes
Judge ↔ Admin	Admin assigns judge, configures rubric before grading, reviews final result, reopens evaluation with reason, notifies judge	Judge cannot use admin reopen endpoint, edit rubric, assign self/others, modify final score without authorized reopen
Mentor ↔ Judge	Only event/project data intentionally shared; permitted public submission facts; independent workflows	Mentor cannot read private judge drafts/scores; judge cannot read confidential mentor notes or guidance history beyond authorized shared context
Admin A ↔ Admin B	Two administrators sign in separately; concurrent assignment/settings changes; audit actor accuracy; independent sessions; review another admin's action if permitted	One admin's logout/revocation does not corrupt another's session; stale writes do not silently overwrite; no secret/session leakage; enforce any super-admin restrictions actually defined
Anonymous ↔ each role	Public content, login/signup, public schedules/leaderboard/certificate verification	Direct protected URLs/APIs, hidden problem statements, private messages, private certificates, admin/mentor/judge data denied
5.2 Student-to-student test cases — PAIR-SS-001 to PAIR-SS-020
Student A sends invite to Student B; B sees exactly one invitation.
B accepts; both see the same updated roster after refresh.
B rejects/declines; A sees correct status and cannot accept the declined token.
Expired/revoked invite cannot be accepted.
Student C, not invited, cannot use B's invite token if token is recipient-bound.
Duplicate accept/replay does not create duplicate membership.
Team capacity boundary is enforced by server.
Student B submits join request; leader sees it and accepts/rejects once.
Non-leader cannot accept/reject another join request.
Leader promotes a permitted co-leader; both accounts see updated role.
Ordinary member cannot promote themselves or another member.
Leader removes B; B immediately loses private team access.
Member leaves; roster and assigned permissions update.
Leader leaves; leadership transfer follows product policy and no orphan team occurs.
Leader disbands QA team; all member access is revoked and history is preserved per policy.
A and B collaborate on a task; edits persist and concurrent edits are conflict-safe.
A sends permitted direct message to B; B receives one copy and sender sees delivery/read state if supported.
Student C cannot access A↔B conversation or squad channel by guessing ID.
Recruitment post/invite reaches intended student only; recipient can accept/decline.
Blocked/banned/disabled user cannot continue sending invites or messages.
5.3 Student-to-mentor test cases — PAIR-SM-001 to PAIR-SM-020
Assigned student creates SOS/guidance request with valid topic, description and priority.
Assigned Mentor A receives one notification and sees the request.
Unassigned Mentor B does not see the request.
Mentor A claims request; one claim succeeds.
Mentor B races to claim; exactly one owner is recorded.
Mentor sends response; student sees it once, with timestamp and sender.
Mentor sends approved meeting URL; student can open a safe external link.
Invalid javascript: or unsafe URL is rejected/not linked.
Student replies; assigned mentor sees the reply and no unrelated mentor does.
Mentor resolves request; student sees resolved state.
Student reopens if the product policy allows; request returns to the defined active state.
Mentor reopens according to workflow; state and audit history remain correct.
Student cannot mark a request accepted/resolved using mentor API.
Student cannot read confidential Mentor notes through UI or API.
Mentor A cannot read another assigned mentor's private note unless explicit policy permits.
Mentor can read notes only for assigned team(s); changing team ID is denied.
Removing/revoking Mentor assignment blocks subsequent reads/writes.
Student receives notification when mentor responds/resolves/reopens; no duplicate delivery.
Mentor notification read action changes only Mentor A's read state.
Student sees only permitted guidance history, never internal note fields or admin-only details.
5.4 Student-to-judge test cases — PAIR-SJ-001 to PAIR-SJ-015
Student submits a QA project before deadline; assigned Judge sees the submission.
Student edits allowed draft deliverables; Judge sees updated version where policy allows.
After final lock, Student cannot modify submission unless admin reopens it.
Judge saves a draft; Student cannot see score or draft feedback.
Judge submits final evaluation; Student sees result only when publication policy allows.
Student cannot call judge dashboard/detail/draft endpoints.
Judge cannot access a different unassigned student's submission.
Judge cannot modify student's project payload.
Student cannot infer private judge identity/notes from API errors or response metadata.
Student receives public feedback only; private evaluation feedback remains restricted.
Changing submission/team/project ID does not expose another team.
Student cannot change rubric or scores through request payload.
A later submission version is handled according to locked-submission policy.
Judge assignment revocation immediately blocks Judge's access.
Public leaderboard/result shows only intentionally published fields.
5.5 Student-to-admin test cases — PAIR-SA-001 to PAIR-SA-020
Student opens support ticket; Admin sees correct ticket and student ownership.
Admin responds; only ticket owner and authorized staff see reply.
Student attempts to read another student's ticket; denied.
Student submits payment proof on a QA paid event; Admin review queue receives it.
Admin verifies QA proof; Student receives one status notification/email in capture inbox.
Admin rejects QA proof with reason; Student sees allowed reason/status.
Student cannot directly set payment status to verified.
Student cannot access payment receipt/proof object belonging to another squad.
Admin publishes targeted announcement; only intended audience receives it.
Student cannot create/edit/delete admin announcement.
Admin disqualifies QA squad with mandatory reason; Student sees permitted status/notice.
Student cannot reverse disqualification or adjust points.
Admin bans QA account; next request/session is denied according to policy.
Re-enabled test account restores only the intended access.
Student requests password reset; Admin cannot see reset token or plaintext password.
Admin changes role only through authorized process; Student cannot self-promote.
Admin action is reflected in Student profile/workspace where appropriate.
Student cannot access /admin/* by direct route or API.
Student cannot forge isAdmin, role, ownerId, reviewedBy or verifiedAt fields.
Deletion/export/privacy request is routed according to actual policy and does not delete records without approval.
5.6 Mentor-to-mentor test cases — PAIR-MM-001 to PAIR-MM-012
Mentor A and B log in using separate browser profiles.
Each sees only their assigned squads/requests.
Mentor A cannot open B's dossier by URL or API.
Mentor A cannot read B's confidential notes.
Two mentors race to claim one request; one winner only.
Assigned mentor handoff/reassignment follows authorized policy.
Old mentor loses access after revocation/reassignment.
New mentor gains access only to newly assigned scope.
Responses are attributed to the correct mentor identity.
Mentor A cannot impersonate B by changing request payload.
Notifications are sent only to relevant assigned mentors.
Audit log records claim, reassignment, response and resolution actors accurately.
5.7 Mentor-to-admin test cases — PAIR-MA-001 to PAIR-MA-012
Admin assigns Mentor A to Squad A.
Mentor A sees Squad A after refresh/relogin.
Admin removes assignment; access is revoked on next API request.
Mentor cannot create or elevate own assignment.
Mentor cannot edit global schedule or hackathon settings.
Mentor escalates a support/guidance issue to Admin using approved path.
Admin responds; Mentor sees only authorized reply.
Mentor cannot read payment proofs, UTRs or admin receipt modal.
Admin can review assignment metadata and audit events according to policy.
Mentor-private note access follows documented policy; no silent broad Admin access.
Admin assignment change emits expected in-app/email notification once.
Concurrent Admin assignment changes cannot leave duplicate/conflicting mentors unless multiple assignment is intended.
5.8 Judge-to-judge test cases — PAIR-JJ-001 to PAIR-JJ-012
Judge A and Judge B log in independently.
Each sees only assigned submissions.
Judge A cannot open Judge B's unassigned submission.
Judge B cannot read Judge A's private draft.
Multi-judge scoring uses separate records per judge where configured.
Aggregated total is correct and does not treat missing score as zero unless policy says so.
One judge's draft does not overwrite another's draft.
Concurrent final submissions are handled according to multi-judge policy.
Judge A cannot change Judge B's evaluation ID/author fields.
Assignment removal blocks the revoked Judge's access.
Evaluation history shows correct judge attribution.
Judge notifications for assignment changes reach only the intended Judge.
5.9 Judge-to-admin test cases — PAIR-JA-001 to PAIR-JA-015
Admin assigns Judge A to a QA submission.
Judge A sees assignment and correct rubric.
Admin changes assignment; Judge access follows the revocation policy.
Judge cannot assign self or another Judge.
Judge cannot change event rubric weights.
Judge cannot call Admin evaluation-reopen endpoint.
Admin reopens a finalized evaluation with a required reason.
Judge receives correct reopen notification and can edit only that evaluation.
Admin can review score/audit history without changing the Judge's attribution.
Judge submits final scores; Admin sees persisted server-calculated total.
Client-supplied totalScore tampering is rejected/ignored; server recalculates.
Judge cannot access payments, account bans or global settings.
Judge cannot read Mentor confidential notes.
Admin announces rubric/deadline update; assigned Judges see it once.
All assignment/reopen actions have correct audit actor, target, time and reason.
5.10 Mentor-to-judge isolation tests — PAIR-MJ-001 to PAIR-MJ-012
Mentor and Judge open the same event/project only where event policy allows shared project facts.
Mentor cannot see Judge draft scores.
Judge cannot see Mentor confidential notes.
Mentor cannot submit or modify evaluations.
Judge cannot claim or resolve Mentor guidance tickets.
Mentor cannot change Judge assignment.
Judge cannot change Mentor assignment.
Both roles may see published event schedule if public/shared.
Shared announcements reach both only when audience includes both roles.
WebSocket room ACL prevents joining the other role's private channel.
API IDs cannot be substituted to cross the role boundary.
Admin-mediated shared workflow creates correct audit trail without exposing private fields.
5.11 Admin-to-admin test cases — PAIR-AA-001 to PAIR-AA-015
Admin A and Admin B authenticate in separate browser contexts.
A's logout does not invalidate B's unrelated session unless global revocation policy says so.
Admin A updates a QA event; Admin B sees persisted data after refresh.
Admin A and B edit the same event concurrently; stale update conflict/version policy is enforced.
Concurrent role assignment does not create duplicate or contradictory assignment records.
Concurrent payment review allows only one valid state transition.
Concurrent point adjustments are atomic and have separate audit entries.
Admin A changes maintenance setting; Admin B sees current setting and warning state.
Admin A cannot see Admin B's password, token, OTP or session secret.
Each action records the actual acting Admin, not a shared hardcoded identity.
Admin A's session revocation does not accidentally grant/deny B.
Unauthorized or disabled Admin is rejected even if client cache says admin.
Admin cannot assign a higher privilege than policy permits; test super-admin rules if they exist.
Audit log records actor, target, before/after values, timestamp and reason.
Simultaneous repeated clicks/retries do not duplicate emails, payments, assignments or notices.
5.12 Anonymous-to-role tests — PAIR-ANON-001 to PAIR-ANON-012
Anonymous user opens all public routes.
Anonymous user is redirected/denied on protected pages.
Anonymous user cannot call private APIs directly.
Anonymous user cannot read hidden problem statement payloads.
Anonymous user cannot access private team chats or invitation details beyond intended invite preview.
Anonymous user cannot read private certificates/receipts.
Anonymous user cannot view unpublished evaluations.
Anonymous user cannot view Mentor private notes or guidance request details.
Anonymous user cannot view Admin metrics/logs.
Public leaderboard contains only publishable data.
Public certificate verification exposes only intended verification fields.
Session acquired after login routes to correct role portal and does not reveal cached data from a prior user.
6. Every Judge Command Center control

Use the complete pin-to-pin manual as the baseline. Discover additional live controls rather than assuming the list is exhaustive.

6.1 Judge shell and session
JDG-001: Judge portal opens with Judge role badge and verified account name.
JDG-002: Loading spinner appears while session is verified; no stale protected content flashes.
JDG-003: Retry Connection reloads/retries safely after simulated cold start.
JDG-004: Sign In Again routes to login on expired session.
JDG-005: Each sidebar tab switches to correct content and clears stale detail selection.
JDG-006: Profile link routes correctly and preserves account identity.
JDG-007: Settings link routes correctly.
JDG-008: Logout disconnects socket and clears auth token, cached profile, session storage and private portal state.
JDG-009: Browser back after logout cannot expose cached evaluation data.
JDG-010: Direct route and refresh enforce Judge role on server and client.
6.2 Judge Overview tab
JDG-011: Total Assigned count matches API data.
JDG-012: Pending count matches actual assignment/evaluation state definition.
JDG-013: Draft count matches saved drafts for current Judge.
JDG-014: Submitted count matches finalized evaluations for current Judge.
JDG-015: Open assigned submissions button switches to Assigned Submissions tab.
JDG-016: Refresh assigned data refetches from backend and displays loading state.
JDG-017: Refresh failure preserves safe prior data and shows retry/error state.
JDG-018: Empty overview displays zero state without fabricated metrics.
6.3 Assigned Submissions tab
JDG-019: Assigned submission card fields match API payload.
JDG-020: Hackathon, deadline and team identification are accurate.
JDG-021: Tech-stack badges render safely for empty, long and malformed arrays.
JDG-022: GitHub link opens correct HTTPS target with safe target/rel attributes.
JDG-023: Live Demo link validates URL and opens correct target.
JDG-024: Figma link opens correct target.
JDG-025: Pitch video link opens correct target.
JDG-026: Missing links show no broken placeholder action.
JDG-027: Open evaluation sheet opens the selected submission only.
JDG-028: Rapid double-click does not create duplicate evaluation.
JDG-029: Unassigned submission ID entered in URL is denied.
6.4 Pending Evaluations tab
JDG-030: Only submissions with no evaluation record appear, according to actual data model.
JDG-031: Evaluate project opens the correct evaluation sheet.
JDG-032: Existing draft is not incorrectly classified as never evaluated.
JDG-033: Existing submitted evaluation is not editable as pending.
JDG-034: Refresh and data changes update the pending filter correctly.
6.5 Saved Drafts tab
JDG-035: Only current Judge's eligible draft evaluations appear.
JDG-036: Resume draft loads persisted scores.
JDG-037: Resume draft loads private feedback/strengths/improvements allowed to that Judge.
JDG-038: Save, leave, refresh, login and resume preserve saved draft exactly.
JDG-039: Draft is not visible to unassigned Judge/student/mentor.
6.6 Submitted Evaluations and History
JDG-040: Submitted tab shows correct finalized records.
JDG-041: Review evaluation opens read-only locked view.
JDG-042: Judge cannot self-unlock finalized score.
JDG-043: Evaluation history sorted by actual timestamps and stable ordering.
JDG-044: Historical score sheet uses immutable historical values, not current edited rubric.
JDG-045: Admin reopen with reason produces audited draft state and notification.
6.7 Judge Notifications
JDG-046: Assignment notification appears once.
JDG-047: Announcement targeting Judge audience appears.
JDG-048: Mark read invokes correct API and persists after reload.
JDG-049: Judge A cannot mark Judge B's notification read.
JDG-050: Notification deep link opens the intended assignment/event.
6.8 Evaluation workspace fields and actions
JDG-051: Back to assigned submissions returns without losing a backend-saved draft.
JDG-052: Project title, description, team, event and deliverables match source.
JDG-053: Technical Execution & Architecture score accepts 0–30 only if that is the actual configured rubric.
JDG-054: Innovation & Creativity score accepts configured range (commonly 0–30).
JDG-055: Practical Impact & Usability score accepts configured range (commonly 0–20).
JDG-056: Presentation & Delivery score accepts configured range (commonly 0–20).
JDG-057: Below-minimum values rejected by UI and backend.
JDG-058: Above-maximum values rejected by UI and backend.
JDG-059: Nonnumeric, NaN, Infinity, blank and malformed numbers handled correctly.
JDG-060: Weighted total recalculated from server-authoritative rubric.
JDG-061: Client tampering with totalScore does not alter server calculation.
JDG-062: Private evaluation feedback validated according to event mandatoryFeedback policy.
JDG-063: Strengths text saves and reloads.
JDG-064: Areas for improvement saves and reloads.
JDG-065: Confirmation checkbox is required for final submission.
JDG-066: Save draft persists status draft, does not lock and does not publish score.
JDG-067: Save draft twice is idempotent and preserves latest content.
JDG-068: Submit final evaluation requires valid rubric and required feedback.
JDG-069: Submit final evaluation persists submitted and locks all Judge write routes.
JDG-070: Replay/double-click final submit creates only one final record/side effect.
JDG-071: Later save returns expected conflict (e.g. 409) after final lock.
JDG-072: Judge cannot call Admin reopen route directly.
JDG-073: Admin reopen requires reason, actor, permission and audit entry.
JDG-074: Reopened evaluation becomes editable only for authorized assigned Judge.
JDG-075: Final score aggregation/leaderboard behavior follows configured event policy.
7. Every Mentor Command Center control
7.1 Mentor shell and session
MNT-001: Mentor portal opens only for verified Mentor or explicitly permitted Admin view.
MNT-002: Role badge/title/name match authenticated Mentor.
MNT-003: Loading spinner does not expose cached prior-user data.
MNT-004: Retry Connection recovers from backend cold start.
MNT-005: Sign In Again works on expired session.
MNT-006: Sidebar tabs work and reset stale dossier/request selection.
MNT-007: Profile route opens correctly.
MNT-008: Settings route opens correctly.
MNT-009: Logout disconnects socket and clears all authentication/profile keys.
MNT-010: Back button after logout cannot reveal notes or squad information.
7.2 Mentor Overview
MNT-011: Assigned squad count equals mentor's assigned squads.
MNT-012: Open request count matches pending + accepted according to policy.
MNT-013: Pending request count matches unclaimed records.
MNT-014: Resolved request count matches resolved records.
MNT-015: Upcoming milestone count uses actual due dates/timezone.
MNT-016: Unread message metric matches current Mentor only.
MNT-017: Recent activity displays latest five eligible requests.
MNT-018: View guidance requests navigates to correct tab.
MNT-019: Refresh assigned data refreshes all dashboard resources.
MNT-020: Partial endpoint failure yields clear degraded state without leaking global data.
7.3 Assigned Squads and Squad Dossier
MNT-021: Only assigned squads appear.
MNT-022: Squad card title, ID, event, project status and milestone match backend.
MNT-023: View squad details opens correct dossier.
MNT-024: Squad roster and visible fields match allowed projection.
MNT-025: Repository/demo links use safe URL handling.
MNT-026: Open squad guidance tickets filters by selected squad.
MNT-027: Back to assigned squads returns to list.
MNT-028: Guessing another team ID returns 403/404 without data leakage.
MNT-029: Revoked assignment blocks dossier access immediately.
MNT-030: Empty assignment state displays honestly.
7.4 Confidential Field Notes
MNT-031: Load notes only for assigned squad and authenticated Mentor.
MNT-032: New private note accepts valid text up to 5,000 characters.
MNT-033: Note rejects >5,000 characters server-side.
MNT-034: Empty/whitespace-only note rejected or handled per policy.
MNT-035: Save private note persists one note and displays it in history.
MNT-036: Retry/double-click does not duplicate notes.
MNT-037: Refresh restores note history.
MNT-038: Student cannot read note through UI/API.
MNT-039: Judge cannot read note through UI/API.
MNT-040: Another Mentor cannot read note unless explicit policy permits.
MNT-041: Mentor cannot write notes to an unassigned squad.
MNT-042: HTML/script-like note content is safely rendered.
7.5 Guidance Requests and Communications
MNT-043: Request card topic, ID, squad, priority, status and description match API.
MNT-044: Pending request displays Claim action.
MNT-045: Claim action changes status/owner atomically.
MNT-046: Two mentors claim concurrently; exactly one succeeds.
MNT-047: Accepted request displays Resolve action.
MNT-048: Resolve updates status, actor and resolved timestamp.
MNT-049: Resolved request displays Reopen only where policy permits.
MNT-050: Reopen transitions to correct active state and preserves history.
MNT-051: Response textarea accepts text and approved code snippets safely.
MNT-052: Send response appends one response with correct actor/time.
MNT-053: Response reaches correct squad and creates one notification.
MNT-054: Empty response rejected.
MNT-055: Oversized response rejected by server.
MNT-056: Invalid meeting URL rejected or rendered as plain text.
MNT-057: Response history order and author labels correct.
MNT-058: Mentor cannot respond to unassigned request.
MNT-059: Student cannot invoke Mentor claim/resolve endpoints.
MNT-060: Request cancelled/closed status hides actions appropriately.
7.6 Milestones, sessions and notifications
MNT-061: Milestone list includes only assigned squads.
MNT-062: Milestone title, squad, due date and status match source.
MNT-063: todo, in_progress, completed states render correctly where supported.
MNT-064: Date/time calculations respect event timezone and expired milestones.
MNT-065: Join scheduled session link opens correct safe destination.
MNT-066: Missing session link shows disabled/empty state, not broken link.
MNT-067: Assignment/guidance notifications appear once.
MNT-068: Mark read persists after refresh.
MNT-069: Mentor cannot mark another user's notification read.
MNT-070: Notification deep link targets correct squad/request.
8. Admin, Student and shared controls

Inventory all current routes; do not assume this list is exhaustive.

8.1 Admin controls — test every visible action
Dashboard refresh, analytics filters, activity log open/detail.
Hackathon create, edit, view, archive/delete (QA only), status transitions, registration open/close, mode selector, fee selector, date pickers, team-size bounds, banner/spec/QR upload, preview/remove/replace.
Problem statement create/edit/delete (QA only), attach event, publish/unpublish, immediate/manual/at-start reveal, hide/reveal confirmation.
User search, filters, pagination, view details, activate/deactivate/ban/unban, role assignment, reset action, bulk actions with confirmation.
Team search/filter, dossier, submission detail, verify, disqualify, restore, point adjustment, bonus marks, note/reason inputs.
Judge assignment dropdown, add/remove/reassign, target selection, event selection, save, confirmation and refresh.
Mentor assignment dropdown, add/remove/reassign, target selection, event/squad selection, save, confirmation and refresh.
Rubric editor: add/edit/remove criterion, weight total, min/max score, mandatory feedback and lock after grading starts.
Evaluation review, admin reopen with mandatory reason, audit detail.
Payment tabs, search, view proof, verify, decline, re-audit, edit note, receipt download. Use fixtures only; never real UPI.
Leaderboard visibility, manual override, tie-breaker and finalization controls.
Announcements create/edit/archive, audience selector, priority, send confirmation.
Certificates template upload, preview, batch generate, download, verify and QR.
Support queue search/filter, assign, reply, resolve/reopen.
Logs filters, detail view, export if supported; ensure no secrets displayed.
Settings toggles, maintenance enable/disable and admin bypass.

For every control: positive, negative, double click, network failure, permission, persistence, audit and responsive tests as applicable.

8.2 Student controls
Dashboard cards and all quick links.
Hackathon search/filter/detail/register.
Eligibility, team limits and closed-event blocks.
Problem search/filter/detail/select and manual reveal guard.
Team create/invite/accept/decline/promote/remove/leave/disband.
Recruitment create/edit/close/filter/search/invite/join.
Workspace squad resolution, task create/edit/move/delete, comments if present, deliverables, URL validation, upload, save and final submit.
Single authoritative submit control; no duplicate submit entry point.
Confirmation modal, disabled/loading state, repeated-click guard and backend CAS.
Payment fee calculation, QR display, UTR validation and proof upload using test provider/fixtures only.
Chat channels, room join/leave, send/edit/delete if supported, typing, delivery/read receipts.
SrijanBot open/close, prompt buttons, send, retry, history, copy, suggested actions, links, streaming stop/regenerate if present.
Notifications list/mark read/deep link.
Support create/view/reply/close if supported.
Profile edit/save/cancel/avatar/upload and settings toggles.
Certificates list, view/download/public verification.
8.3 Shared controls and navigation
Logo/home link.
Header navigation, hamburger/mobile menu, sidebar collapse/expand.
Search fields and clear buttons.
Pagination and page-size selectors.
Sort controls and filter chips.
Modal close, cancel, confirm, outside-click and Escape behavior.
Toast close/action links.
External SafeLink behavior.
Copy-to-clipboard, download, print, QR scan/verification.
Floating SrijanBot button and all suggested prompts/actions.
Retry/refresh/loading/error boundary actions.
9. Authentication, session and account-switching matrix

Test account transitions in separate browser profiles:

Anonymous → Student A login → student dashboard.
Student A logout → Student B login → no A data remains.
Student A login → open Judge URL → denied.
Student A login → open Mentor URL → denied.
Student A login → open Admin URL/API → denied.
Mentor A login → Judge/Admin endpoints denied.
Judge A login → Mentor/Admin endpoints denied except explicitly authorized shared/admin routes.
Admin A login → authorized portals and management routes.
Admin A logout → cached admin pages/API unavailable.
Expired session → retry/sign-in path works and no protected content flashes.
Revoked session/account disabled → next API/WebSocket request rejected.
Account role changed by Admin → old role permissions removed; new route applied after fresh session/revalidation.
LocalStorage token tampering → server rejects.
Client-supplied role/user/team/assignment fields → ignored or rejected.
Login in two browser profiles → session policy and logout behavior are consistent.
Change account in same browser → query cache, local storage, session storage, WebSocket rooms and rendered data are reset.
Back/forward cache after logout/role switch → no prior user's private content visible.
OTP and password reset links/codes are single-use/expiry-limited and never logged.
Rate limits and lockout thresholds work without account enumeration.
Cookies/localStorage, CORS, CSRF and transport settings match actual auth design. Record current architecture; do not assume HttpOnly cookies if app uses bearer localStorage.
10. Chat, notifications and transactional email cross-role matrix
10.1 Chat and realtime

For all currently supported channels (global, squad-private, mentor hotline, direct messages, admin support and any new channel discovered):

Connect as each role and test handshake auth.
Attempt room join as authorized and unauthorized user.
Attempt guessed conversation/room IDs.
Send valid, empty, huge and script-like messages.
Verify sender identity is server-derived, not client-supplied.
Verify message appears once to recipient and sender.
Verify typing indicator only in correct room.
Verify delivery/read indicators where supported.
Verify reconnect reauthenticates and does not duplicate messages.
Verify revoked assignment/team membership blocks the next room action.
Verify role switch/logout removes prior rooms.
10.2 Notifications

For every trigger, verify: event creation → exactly one recipient notification → unread count → mark read → persistence after refresh → unauthorized user cannot read/mark it → deep link correct.

Trigger coverage:

Team invite sent/accepted/declined.
Join request accepted/rejected.
Mentor assigned/reassigned/revoked.
Guidance request created/claimed/responded/resolved/reopened.
Judge assigned/reassigned/revoked.
Evaluation reopened/submitted/published as policy permits.
Payment proof submitted/verified/rejected/re-audited.
Submission received/returned/reopened where supported.
Announcement published to role-specific audience.
Support ticket response/resolution.
10.3 Nine transactional email scenarios

Use a capture inbox/test provider. No unsolicited live email.

Account verification.
Welcome email.
Password reset.
Admin payment-review dispatch.
Payment approval/workspace unlock.
Payment rejection.
Teammate join alert.
Squad leader membership update.
Clearance/role elevation.

For each: correct recipient, correct template/data, correct event ID, one email per action, no secrets or private notes, failure/retry handling, provider outage behavior and no duplicate send on API replay.

11. API, database, security and resilience checks

Discover the actual endpoint set from Express router registrations, mount paths, middleware and OpenAPI/tests. Reconcile the reported 194 registrations; distinguish route registrations from unique method/path endpoints.

For every endpoint:

Correct method/path and authenticated role.
Missing/invalid/expired/revoked auth.
Wrong role.
Wrong owner/assignment/object ID.
Client role/owner/admin flag spoofing.
Unexpected fields/mass assignment.
Schema boundary/malformed JSON/large payload.
Duplicate/replay/double submit.
Concurrent updates/race behavior.
Correct 2xx/4xx/5xx status and stable response schema.
No password hash, OTP, token, secret, private note, UTR or protected receipt leakage.
Correct database before/after state and audit record.

Additional attack classes in isolated staging only:

NoSQL injection, XSS stored/reflected, path traversal, unsafe URL schemes, MIME spoofing, file magic-byte validation, oversized uploads, CORS, CSRF, open redirect, IDOR/BOLA, broken function-level authorization, rate limit bypass, pagination abuse, cache poisoning, WebSocket room bypass and sensitive error disclosure.

Database checks:

Unique email/handle/token/UTR constraints where required.
Referential integrity for user/team/event/submission/evaluation/assignment.
Indexes and TTL behavior for sessions/OTP/reset tokens.
Atomic compare-and-set for claim, final submit, payment review and duplicate submission.
Transaction rollback/partial failure behavior.
Orphan upload cleanup and storage quota accuracy.
QA fixture backup/restore in isolated DB.

Resilience checks in staging:

MongoDB unavailable/reconnect.
Render cold start/slow response.
Email provider unavailable.
Groq primary and fallback unavailable.
GridFS upload failure/stream interruption.
Socket server restart.
Frontend API timeout/500/invalid JSON.
Partial dashboard endpoint failure.
12. Repeat-until-green workflow and evidence standards
12.1 Required iterative loop

For each discovered failure:

Save the failing test ID, sanitized trace, screenshot, API request/response metadata and commit.
Reproduce once in the same environment.
Reproduce locally or in staging without touching real production records.
Identify root cause and exact source files.
Create one atomic GSD task with exact files, action, verify command and measurable done criteria.
Implement the smallest safe fix.
Add a regression test that fails before the fix and passes after it.
Run the focused test.
Run all tests in the affected subsystem.
Run cross-role/security regression.
Run full build, typecheck/lint and full automated suite.
Deploy through the approved pipeline if production change is necessary.
Verify the new deployed revision and rerun the live failing test plus smoke tests.
Update defect, execution report and STATE.md.

Repeat for every failure. Do not loop endlessly: if a defect cannot be fixed after three focused repair/verification rounds, record it as BLOCKED with root cause, attempts, owner action and risk. A P0/P1 BLOCKED defect prevents general release approval.

12.2 Test repetition variants

Every stateful workflow is tested at least:

Once as the valid initiating actor.
Once as the intended recipient.
Once as an unrelated same-role user.
Once as a wrong-role user.
Once via direct API instead of UI.
Once after refresh/relogin.
Once with double-click/replay.
Once under slow/failing network where meaningful.
Once concurrently when two actors can race.
12.3 Evidence capture

Create docs/qa/evidence/<run-id>/ with sanitized evidence. Each evidence item must name its test ID.

Capture:

Screenshots before/after each significant action.
Playwright trace/video only if it does not contain secrets; sanitize before retaining.
Console logs and failed requests without tokens/cookies.
API method/path/status/timing and redacted response fields.
Database before/after records with personal/sensitive data redacted.
Browser/device/viewport, date/time IST, deployment commit and bundle identifier.
Email capture IDs and sanitized headers, not private contents/secrets.

Do not screenshot passwords, OTPs, auth tokens, private payment receipts, personal contact details or private mentor notes. Evidence that contains such data must be discarded and recaptured safely.

12.4 Required result format per test
Plain text
Test ID:
Title:
Environment:
Frontend commit/build:
Backend revision:
Browser/device/viewport:
Actor alias/role:
Recipient alias/role:
Preconditions/fixture IDs:
Steps:
Expected result:
Actual result:
UI evidence paths:
API method/path/status:
Database before/after verification:
Security/permission assertion:
Cleanup/restoration:
Status: PASS / FAIL / BLOCKED / NOT RUN / NOT APPLICABLE
Defect ID:
13. Defect severity, stop conditions and production safety
Severity
P0/Critical: auth bypass, cross-user private data exposure, admin compromise, data corruption/loss, real payment risk or production outage.
P1/High: core role workflow unusable, assignment isolation failure, evaluation/payment state corruption, sensitive private-note exposure or privilege escalation.
P2/Medium: important feature degradation with workaround or inconsistent noncritical state.
P3/Low: visual/copy/polish issue without security or workflow impact.
Production safety
Confirm production vs staging before every write.
Never create synthetic users/teams/evaluations/payments in production unless they are explicitly QA-owned and owner-approved.
Do not final-submit real Judge evaluations.
Do not create/resolve/reopen real participant support or mentor tickets.
Do not send real broadcast announcements or unsolicited mail.
Do not initiate UPI/bank transactions.
Do not ban/promote real users or alter real roles.
Do not delete real data or modify production settings during public use.
Do not run destructive fuzzing/load tests on production.
For live production, prioritize read-only account inspection and harmless controls. Use staging for all destructive, repeat, concurrency and failure-injection cases.
Keep a test data register and verify cleanup.
Stop immediately if
The live commit is unknown/mismatched.
A production record would be modified unintentionally.
A credential/token/secret is exposed.
A test causes unexpected email/payment/public broadcast.
A test appears to access another real user's private data.
A P0 security defect is found; preserve evidence and stop the affected pathway.
14. Required QA artifacts

Create or update in repository:

docs/qa/FINAL_RUN_ENVIRONMENT.md
docs/qa/ROUTE_INVENTORY.md
docs/qa/API_INVENTORY.md
docs/qa/DATA_INVENTORY.md
docs/qa/INTEGRATION_INVENTORY.md
docs/qa/CONTROL_INVENTORY.csv
docs/qa/CROSS_ROLE_INTERACTION_MATRIX.md
docs/qa/CROSS_ROLE_TEST_EXECUTION.md
docs/qa/JUDGE_BUTTON_BY_BUTTON_EXECUTION.md
docs/qa/MENTOR_BUTTON_BY_BUTTON_EXECUTION.md
docs/qa/ADMIN_BUTTON_BY_BUTTON_EXECUTION.md
docs/qa/STUDENT_BUTTON_BY_BUTTON_EXECUTION.md
docs/qa/CHAT_NOTIFICATION_EMAIL_EXECUTION.md
docs/qa/API_SECURITY_EXECUTION.md
docs/qa/CONTROL_FAILURE_AND_RETRY_MATRIX.md
docs/qa/DEFECT_LOG.md
docs/qa/TEST_DATA_REGISTER.md
docs/qa/EVIDENCE_INDEX.md
docs/qa/FINAL_REGRESSION_REPORT.md
docs/qa/FINAL_RELEASE_READINESS.md
Updated STATE.md
Automated unit/component/API/E2E tests for every critical finding.

Do not overwrite useful prior reports; preserve old runs in dated subfolders and link the newest report from the master index.

15. Acceptance criteria for sign-off

CodeSrijan may be declared fully verified for general release only when:

Actual live deployment revisions are identified and consistent.
Every current route is inventoried and has a route smoke result.
Every discovered control is in CONTROL_INVENTORY.csv; all applicable standard control checks have outcomes.
All role-pair scenarios have been executed in both directions.
Same-role multi-account interactions are verified (student/student, mentor/mentor, judge/judge, admin/admin).
Every Mentor and Judge tab, button, field, modal and state transition is verified.
Admin and Student controls are also covered, not only role portals.
Every protected API endpoint has authentication, authorization and object-level access tests.
Private mentor notes, judge drafts, payment proofs and admin logs have been tested for isolation.
Chat, notification, email, payment-fixture, upload, AI and certificate workflows are verified.
Duplicate/replay/concurrency tests pass where an operation can be repeated or raced.
All P0/P1 defects are closed and regression-tested.
All P2/P3 defects are fixed or accepted/documented by the owner.
No unexplained BLOCKED/NOT RUN test remains in the release-critical scope.
QA-created records are cleaned up or explicitly retained with owner approval.
Test totals are reconciled by unique test ID; assertions are not double-counted.
STATE.md and the release report cite exact evidence and commit.

Do not promise 100% in an absolute mathematical sense. State exactly what scope was discovered and verified, what is not applicable, and what remains outside scope.

16. Start execution now
Read GSD instructions and all relevant project QA reports.
Confirm repository and deployment commits before testing.
Build the actual route and control inventory from the live app/source.
Provision the minimum role topology safely in staging.
Launch the subagents in Section 3 with fresh contexts.
Begin with read-only discovery and role boundary tests.
Execute every applicable test in Sections 5–11.
Complete the control inventory for every role and route.
Run the repeat-until-green loop in Section 12.
Re-run full regression after each merged fix and after final deployment.
Clean up QA records and sessions.
Publish the final evidence index and release decision.

Do the actual browser/API/database verification. Do not just create more test documentation. Use the supplied test accounts securely. Use subagents. Test both sides of every interaction. Test every discovered button. Repeat after every fix. Report truthfully.