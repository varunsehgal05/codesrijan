# QA record reconciliation

Eight QA events remain publicly listed. Their exact public IDs, titles and states are retained in `QA_PUBLIC_INVENTORY.json`; all eight are `registration_open`, four paid and four free. The historical paid event remains present.

No production record was changed. Public names do not prove that all related participants are disposable test accounts.

## Private relationship inspection

Status: **BLOCKED**. The browser admin session has not completed sign-in; the first payment-queue tab became unresponsive. A fresh login tab was opened for manual authentication. A separately approved read-only database attempt stopped at its intended-cluster guard before connecting: the legacy configuration did not match the explicitly named cluster. No alternative cluster was queried. The retained audit helper now requires explicit `MONGO_URI`, validates the intended hostname, and exposes only read operations and a sanitized report.

For each of the eight events, genuine-participant ownership, proof presence, review decisions/history, test-reference classification, paid metrics impact and cross-event lock dependencies remain **NOT VERIFIED**. Team `t-1791543889807` remains a lead rather than a proven current lock. Do not report zero participants or no payment from inaccessible private data.

## Metrics evidence from source

`GET /api/public/stats` counts all registrations without a QA exclusion. The admin payment summary counts all verified/pending/rejected registrations without a QA exclusion. Thus QA registrations can affect those metrics if retained in these collections; exact current contribution requires private record inspection. Public listing itself is directly verified.

## Safe record-level plan

1. Retrieve each event's registrations, roster snapshot, payment review history and team relationships through authorized access.
2. Compare every participant against designated QA identities and inspect other active registrations using the same team. Mark ambiguous ownership for approval.
3. Close only proven QA-only events through the supported administrative workflow. Verify directory behavior: the public listing currently does not itself prove a closed event is hidden.
4. Use an audited reversible cancellation/test-only mechanism before excluding fake payments from genuine counts. Current registration schema has no cancellation/test-only status; implement and test a supported mechanism rather than directly deleting records or guessing a status.
5. Release locks only after proving no genuine or other active registration needs them. Preserve review history and capture before/after state.

All eight events and the historical team remain untouched pending these checks. No hard deletion, fake approval or genuine-participant mutation was performed.

## Authenticated API follow-up — 2026-10-23

After fixing the admin login form and verifying the designated credentials, supported authenticated API reads succeeded. See QA_API_RECORD_INVENTORY.json for sanitized per-event findings. All eight events remain public/open. Six paid-queue registrations were found: four verified with proof and two pending proof. Four teams have active roster/team locks. The historical team t-1791543889807 exists; its registration reg-1792696746046 has a test reference, designated QA ownership, and review history under-review → rejected → under-review → verified. Other participants cannot be positively classified as designated QA, and free registrations/cross-event lock dependencies are not fully exposed by these APIs.

This supersedes the earlier statement that private inspection was entirely blocked, but does not establish complete ownership. Existing queue summary includes these four verified QA-event records. No production record was changed. Proposed cleanup remains subject to complete ownership/lock inspection and a supported audited test-only/cancellation mechanism; do not relabel test payments as revenue or delete history.
