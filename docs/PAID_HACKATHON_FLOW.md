# Paid hackathon flow

Source assessment: 2026-10-23. These are observed code paths and proposed checks; live registration, payment, approval, rejection and notification delivery are **NOT TESTED** here. No money was transferred and no production records were changed.

## Student and admin journey

1. Admin configures an event with `entryType=paid`, positive fee, `feeBasis` (`per_team` or `per_participant`), currency, payee/UPI/QR information, registration window, team bounds and publication status. Directory: `/hackathons`; enrollment: `/hackathons/$id/register`.
2. A verified active student submits `POST /api/hackathons/:id/register`. For a team, the caller must be the leader; the server resolves their team, checks team size, queries member activation/verification and snapshots the roster. It locks the team before saving the registration.
3. The server calculates the fee: one event fee per team, or fee multiplied by leader-plus-member count. Solo costs one fee. Paid positive-fee entries start at registration `awaiting_payment_proof` and payment `pending_proof`; free/zero-fee entries start `registered`/`not_required`.
4. Enrollment redirects paid entries to `/payment?hackathonId=<id>`. Explicit event selection matters: without a query parameter, the page chooses a registration from the owner's list, then falls back to a demo ID. A roster member may not appear in the owner's-only list even though event-specific `my-registration` recognizes them.
5. The student transfers money outside the app and submits UTR plus receipt using `POST /api/hackathons/:id/payment-proof`. The endpoint accepts registration owner OR snapshotted roster member, validates UTR length/characters and image-data/HTTP URL prefix, checks another registration's UTR, and moves both states to `payment_under_review` with a history entry. Proof submission is a claim awaiting human review; it does not independently verify settlement.
6. Admin opens `/admin/payments`; `GET /api/admin/payments?status=...` returns enriched registration data and counts. Receipt metadata is also available at admin-only `GET /api/admin/payments/:registrationId/receipt`.
7. Admin calls `POST /api/admin/payments/:registrationId/review` with `decision=approve|reject` and optional approval reason / required rejection reason. Approval sets `verified`/`registered`, verification/reviewer timestamps and history. Rejection sets both to `rejected` and retains the reason/history.
8. The registration owner can call `POST /api/hackathons/:id/retry-payment` after rejection, restoring `pending_proof`/`awaiting_payment_proof`. The receipt/UTR/review fields are not cleared by this reset. Proof can then be submitted again. Check the refreshed page and admin queue after each transition.

## State transitions represented in code

```text
paid registration -> awaiting_payment_proof / pending_proof
proof accepted    -> payment_under_review / payment_under_review
admin approves    -> registered / verified
admin rejects     -> rejected / rejected
owner retries     -> awaiting_payment_proof / pending_proof
free registration -> registered / not_required
```

The first value is registration status; the second is payment status. Schema-only values such as `draft` and `roster_locked` do not establish an exposed transition.

## Validation and integrity checks still required

- Anonymous calls: 401; wrong role: 403. Verify object ownership and cross-team access separately for each endpoint.
- Closed/not-yet-open/expired events, unverified users, duplicate owner enrollment, undersized/oversized teams and non-leader team enrollment must fail. A demo event has a special registration-window/status bypass in source.
- Missing member documents are not explicitly rejected: only returned users are checked. Validate duplicate roster IDs, leader/member representation, participation-type restrictions, capacity and eligibility enforcement independently; configuration fields alone do not prove enforcement.
- A unique index prevents duplicate event+owner records. UTR uniqueness is an application lookup rather than a unique index, so concurrent submissions need a race test. Case normalization and cross-event reuse need a documented policy.
- Default `express.json()` limits may reject receipt data far below the handler's advertised attachment limit. Check real browser uploads near the claimed maximum, and validate MIME/content, URL handling and receipt privacy.
- Review code accepts any existing registration with a valid decision and does not first require `payment_under_review`. Test repeated approval, reversal and simultaneous review; record whether these should be allowed.
- Roster locking blocks direct join, invitation send/accept and kick in inspected handlers. Leave/transfer/join-request approval and deletion need consistency checks. The `/teams/:id/lock` endpoint toggles `recruitmentOpen`, not the registration's `isLocked` flag.
- Payment approval is not proof that submission/workspace access is enforced. Inspect and test downstream project/team submission handlers for verified-payment gating; duplicate handlers can hide later checks.
- Owner-only registration listing/retry contrasts with roster-member proof and event-specific lookup. Test leader and teammate independently across refresh/login.
- A payment review notification helper exists in the email service. Verify its call site, configured admin destination/frontend link, relay acceptance and real inbox delivery separately; do not count helper existence as delivery evidence.

## Repeatable isolated test record

Use one explicitly named paid test event, a leader and two verified members, and a separate solo user in a disposable database. Record event/team/registration IDs and each response status/state; exercise approval and rejection with separate registrations. Re-fetch after reload to distinguish persisted state from optimistic UI. No production account credentials or receipt images belong in this document. Cleanup limits are documented in `CODEBASE_ARCHITECTURE.md`.

## Integrated fixes and verified boundaries

Current source deduplicates the leader in roster fee calculation, rejects missing roster accounts, blocks leave/delete/transfer of locked teams, atomically claims proof submission and payment review states, and records administrator email outcomes. Real notification inbox delivery is verified using disposable local registration data and the production relay; no fake production payment was approved. The broader receipt/UTR race/event-specific lock questions above remain follow-up checks, not passing claims.
