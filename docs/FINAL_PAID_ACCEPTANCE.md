# Final paid acceptance — 2026-10-23

Actual backend HTTP integration: **1 passed, 0 failed** (`node --test server/test_final_paid_acceptance.mjs`). This is one sequential acceptance scenario, not a browser suite or dozens of independently counted tests.

Isolation: ephemeral MongoMemoryServer; explicit test database `isolated_paid_acceptance`; URI guard permits only the generated localhost URI; actual connection host/database asserted before fixture writes. No production mutations. All email dispatches mocked. The server's literal `Connected to keyspace codesrijan` log is misleading: actual database name is asserted separately. Runtime needed permission to launch the local MongoDB process. An automatic review initially rejected a rerun because it interpreted this literal log as a production connection; source inspection and connection guards resolved that concern and the rerun was approved.

Verified through actual application endpoints:

- Student registration; pending account login denied; captured mock verification codes submitted to the real verification endpoint; student and seeded trusted administrator password login.
- Administrator creates draft paid event and opens registration, solely in isolated storage.
- Member registers solo (required by current invite endpoint), leader creates squad, sends invitation, member accepts.
- Leader registers a two-person squad; server overrides forged fee with INR 200 (INR 100 per participant), snapshots two members, and locks roster.
- Duplicate event registration rejected (409).
- Proof persisted; repeated submission rejected (400); another registration reusing the UTR rejected (409).
- Admin queue reports one pending proof; authorized admin receipt retrieval succeeds.
- Outsider receipt/review denied (403); anonymous receipt denied (401).
- Administrator rejection with reason; leader retry; fresh proof; administrator approval; repeat review rejected (409).
- Persisted final status is registered, with four audit entries (two submissions and two reviews).
- Exactly two mocked administrator notifications, one per accepted proof submission.

Limitations: no browser, production payment, bank settlement, real email, paid financial transaction, deployment or inbox verification claimed. Invitation currently requires prior event registration for the invitee, producing a separate solo registration before squad enrollment; this scenario documents the supported workflow and does not assert registration-count reconciliation. Event is draft when created, then registration is opened in isolated storage; no claim of private production staging. Hydration-blocked browser staging must be resolved independently. Mentor/judge journeys, locks after event closure, and revenue/leaderboard reconciliation are outside this test.
