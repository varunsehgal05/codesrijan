# CodeSrijan repository architecture

Assessment date: 2026-10-23 (Asia/Calcutta). Evidence: local source inspection. Runtime, cloud configuration and production behavior are **NOT TESTED** by this document's author. Paths below are relative to the application root, `interactive-showcase-main/` inside the outer workspace.

## Application boundaries

- Frontend: React 19, TypeScript, TanStack Start/Router, Vite, Tailwind 4, Radix components. `src/router.tsx` consumes generated `src/routeTree.gen.ts`; `src/routes/__root.tsx` provides the shared shell, store, query provider and error/not-found views. `src/server.ts` is the configured SSR entry.
- State/API: `src/lib/store.tsx` keeps user/team/event/project state, installs an Axios bearer-token interceptor and refreshes multiple API resources. Tokens live under `codesrijan_auth_token` in local storage. Several routes also make their own Axios calls and independently calculate the API base.
- API: `server/server.js` is a single Express application and HTTP/Socket.IO server. `server/package.json` starts it directly. Swagger UI is mounted at `/api-docs`; its declared JWT security scheme does not establish actual authentication behavior.
- Persistence: Mongoose models under `server/models/`; relationships use application string IDs rather than enforced MongoDB foreign keys. Most entities have timestamps and unique `id` fields.
- Authentication: `server/middleware/auth.js` first tries Firebase Admin token verification when configured, then SHA-256 lookup of opaque session tokens in `Session`. `requireRole` checks the MongoDB user's role. `models/auth.js` also defines OTP verification, password reset and security-event records.
- Email: `server/services/email.js` supports an authenticated Google Apps Script relay and Nodemailer SMTP. Test transport/dispatcher injection is available. Relay deployment and mail delivery need separate verification; never assume a success response proves inbox arrival.
- Realtime: backend conversation rooms use `conversation:join`, `conversation:leave`, `typing:start`, `typing:stop`, and `message:new`. The shared store also contains legacy `join_team`/`receive_message` event usage. Check the actual chat screen's implementation before treating these as compatible.

## Data relationships

- `User.teamId` points to `Team.id`; a team separately stores `leaderId`, `memberIds`, `hackathonId`, `problemStatementId`, project links and lock/submission flags.
- `Hackathon` contains dates, publication status, eligibility descriptions, team limits, participation type, capacity and payment configuration.
- `Registration` joins event to registering user; a team registration additionally snapshots `rosterMembers`, `teamId`, fees, payment/proof fields and review history. A unique compound index exists on `(hackathonId, userId)`; this is not a unique constraint on every snapshot participant or team.
- `Project` and `Submission` reference event/team/problem; `Evaluation` references team/judge/assignment and stores criteria scores. `Certificate` references event/user/team.
- Recruitment profiles, invitations and join requests link users/teams/events. Tasks are team-based in the primary schema. Mentor requests link mentor/requester/team/event.
- Conversations store participant IDs and optional event/team IDs; messages reference a conversation and sender. Support tickets can reference a conversation. Announcements, sponsors, timeline events, gallery and FAQ records carry optional event associations.
- Auth models: `Session`, `EmailVerification`, `PasswordResetToken`, `SecurityEvent`. Secondary models also define bookmarks, announcements, calendar events, sponsors, logs and settings; tertiary models define project metadata, judge/mentor assignment structures, gallery and FAQ.

## Deployment/configuration evidence

`render.yaml` describes a free Node backend built in `server/`, plus an alternative Node frontend build. The supplied live frontend is on Vercel; this blueprint alone cannot prove the deployed Vercel configuration. `VITE_API_URL` is normalized to include `/api`; the source fallback host is the older Render alias. The user's supplied primary API host therefore needs a deployed-build check. Environment variable names and service configuration should be recorded without copying secrets.

`vercel.json` currently opts into a TanStack vulnerability deployment override. Its presence is configuration evidence, not proof of a particular exploit or installed patch status.

## Structural risks found by inspection

1. `server.js` registers several identical method/path pairs more than once (including users, problems, evaluations, team submission/links, admin submissions/settings/support/logs/analytics, announcements and sponsors). Express visits handlers in registration order; a response from an earlier handler normally makes later handlers unreachable. Review the first matching implementation before modifying a later copy.
2. Primary and secondary model modules both declare `Conversation`, `Message`, `Notification`, `Certificate`, and `SupportTicket`; primary and tertiary both declare `ProjectTask`. The `mongoose.models.Name || mongoose.model(...)` pattern reuses whichever schema registered first. Importing a secondary symbol does not guarantee its nearby schema is active. This can silently discard fields under strict schema handling.
3. Server startup connects to a production-capable fallback database and performs seed/account updates, including privileged account password resets. Starting it is a database mutation, not a safe read-only smoke check. Use an explicitly isolated database and disable/contain startup seeds before local backend verification.
4. Registration/payment/team updates are separate saves without a transaction. Failure between saves can leave a locked team without its registration. Roster lock enforcement is inconsistent across membership operations; see the paid-flow document.
5. Entity deletion is not generally cascading. User deletion clears user/session/verification records, but does not comprehensively remove reset tokens, registrations, team leadership/membership, messages or projects. The attempted Firebase deletion imports an unexported binding and must not be assumed successful.
6. Shared-store request failures can become empty arrays. Empty UI state is therefore not proof of an empty database or healthy API.

## QA cleanup: supported entry points and limits

No QA cleanup or production deletion was performed for this assessment. Keep the real verified account and seeded/shared identities outside any cleanup scope unless explicitly requested.

For a dedicated test registration, the authenticated owner can call `DELETE /api/hackathons/:id/registration`; this removes only that owner's registration and does not unlock the team or clean payment history elsewhere. Team dissolution uses `DELETE /api/teams/:id` for leader/admin; it clears member user pointers but does not explicitly clear a separate leader pointer or cascade registrations/projects. Admin user deletion uses `DELETE /api/admin/users/:id`; it is incomplete cross-entity cleanup, as described above. Event/problem/support/announcement/sponsor deletion routes also exist, but are not universal cleanup tools.

Before any authorized cleanup, enumerate exact test IDs and their references, retain real registrations/payment records, and use a dry-run manifest. After supported deletes, check remaining references and report residuals instead of claiming a complete purge. Prefer an isolated disposable test database for repeatable QA; do not run seed, ignition or historical test scripts against live services without reading their mutations first.

## Final implementation addendum

The inventory above describes the assessment baseline. The working release removes hardcoded MongoDB fallbacks, startup password resets and email-prefix administrator creation; requires explicit database configuration; adds atomic OTP/resend/payment review safeguards and administrator payment notifications; fixes roster duplication/missing-account checks and lock mutation gaps. Public API fallbacks now target the provider-verified codesrijan-api-6tfr service. See PRODUCTION_READINESS_REPORT.md and SECURITY_AUDIT.md for current evidence rather than interpreting baseline findings as unchanged code.
