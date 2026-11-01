# Phase3 executable tasks
<task type="auto" effort="high">
<name>Enforce assigned mentor and judge workflows</name>
<files>server/role-portals.js; server/server.js; server/models/index.js; server/models/tertiary.js; server/test-role-portals.js</files>
<action>Use stored role and assignment records for access. Support guidance history/private mentor notes, configured rubric score validation, draft/final evaluation locks and reasoned admin reopen. Remove duplicate legacy routes that bypass new enforcement. Deny cross-role/unassigned access; never create production role identities.</action>
<verify>node --test server/test-role-portals.js</verify>
<done>Actual temporary-database HTTP/socket tests pass, security report records count and limitations.</done>
</task>
<task type="auto" effort="high">
<name>Build separate role portals and route identities</name>
<files>src/components/role-portals/MentorPortal.tsx; src/components/role-portals/JudgePortal.tsx; src/routes/mentor-command-center.tsx; src/routes/judge-command-center.tsx; src/lib/role-home.ts; src/components/layout/Navbar.tsx; src/lib/store.tsx; src/routes/workspace.tsx</files>
<action>Render only authenticated intended-role APIs, real metrics and assignment lists. Expose loading/empty/error states, guidance actions and drafts/final scores. Reuse existing tokens, avoid global teams/private score exposure. Display mentor response history to authorized students.</action>
<verify>node node_modules/typescript/bin/tsc --noEmit; run role portal browser script documented in acceptance report</verify>
<done>Mentor/Judge/Student independent fresh-context local journeys have screenshots and API-backed pass/fail evidence.</done>
</task>
<task type="auto" effort="medium">
<name>Expose administrator assignment and rubric configuration</name>
<files>src/components/RoleAssignments.tsx; src/components/EventRubricEditor.tsx; src/routes/admin.mentors.tsx; src/routes/admin.judges.tsx; src/routes/admin.evaluations.tsx</files>
<action>Load actual staff/events/targets. Create/revoke assignments, configure event-specific criteria and present locked rubric errors. Reopen final evaluations only via backend audited admin endpoint with reason. Preserve legacy score interpretation.</action>
<verify>Run isolated admin browser script in ADMIN_EXECUTION.md; npm run build</verify>
<done>Admin browser evidence proves local configured assignments/rubric controls and reopen; no production settings mutated.</done>
</task>
