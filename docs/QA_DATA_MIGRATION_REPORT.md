# CodeSrijan — QA Data Isolation & Migration Safety Audit

**Audit Date:** 2026-10-23  
**Lead DevOps & Database Engineer:** Antigravity Data Integrity Specialist  
**Script Under Review:** `server/migrate-qa-data.mjs`  
**Regression Test Suite:** `server/test-qa-data-isolation.mjs`  
**Production Cluster Target:** `codesrijan-cluster.mrckx43.mongodb.net`  
**Production Keyspace Target:** `codesrijan`  
**Execution Decision:** **DRY-RUN SAFEGUARDED — PRODUCTION MIGRATION NOT EXECUTED**  

---

## 1. Executive Summary & Production Safety Constraint

To prevent early development and staging QA hackathons, dummy registrations, and test scores from contaminating genuine platform metrics and public leaderboards, an automated data isolation architecture was developed in commit `4c3851c`.

**MANDATORY SAFETY RULE ENFORCED:**  
Under no circumstances was the production migration executed during this QA mission. The migration script was verified solely through dry-run mode and isolated unit tests (`test-qa-data-isolation.mjs`) on temporary in-memory databases. The live MongoDB Atlas cluster remains completely untouched.

---

## 2. Hardened Multi-Factor Target Guards in `migrate-qa-data.mjs`

The migration script features three redundant layers of automated safeguards to prevent accidental execution against the wrong cluster or unexpected data shapes:

```
[Execution Command]
       │
       ▼
[Dual Confirmation Guard] ──> Does --confirm-target === 'codesrijan'?
       │                  ──> Does --confirm-cluster === 'codesrijan-cluster.mrckx43.mongodb.net'?
       ▼ (Pass)
[Rogue Hackathon Check]   ──> Does DB contain any unverified QA event outside exact allowlist?
       │                      If YES ──> ABORT IMMEDIATELY
       ▼ (Pass)
[Census Limit Guard]      ──> Does registration count exceed expected census (> 6)?
       │                      If YES ──> ABORT IMMEDIATELY
       ▼ (Pass)
[Dry-Run by Default]      ──> Is --apply flag absent?
       │                      If YES ──> Log dry-run diff and EXIT WITHOUT WRITING
       ▼ (Apply only if explicit)
[Atomic Updates]          ──> Update isTest: true on exact records; SKIP ambiguous team
```

### 2.1 Guard 1: Dual Confirmation Flags
Execution with `--apply` fails closed unless both confirmation flags are passed:
```bash
node server/migrate-qa-data.mjs --apply --confirm-target=codesrijan --confirm-cluster=codesrijan-cluster.mrckx43.mongodb.net
```
If either flag is omitted or mismatches the actual connected host/database, execution terminates with exit code 1.

### 2.2 Guard 2: Rogue QA Event Detection
The script verifies that all QA tournaments in the database strictly match the documented allowlist:
- `hack-demo-2`
- `hack-qa-isolated-1`
- `hack-1791258138536`
If any unrecognized event with `qa-` prefix exists, the script halts immediately to prevent misclassifying genuine tournaments.

### 2.3 Guard 3: Strict Census Boundary (< 6 Registrations)
The migration is designed exclusively for the initial historical dataset. If the database contains more than 6 registrations, execution aborts immediately to protect growing production data.

---

## 3. Special Protection: Historical Squad `t-1791543889807`

### 3.1 Ambiguity Analysis
Historical team `t-1791543889807` was created during early Phase 1 manual and automated staging tests. Because its roster contains user references from mixed sessions, setting `isTest: true` directly on the squad document could cause unintended data anomalies.

### 3.2 Implemented Safeguard
1. **Script Skip:** `server/migrate-qa-data.mjs` explicitly checks for `team.id === 't-1791543889807'` and marks it `UNRESOLVED_AMBIGUOUS`, skipping any database write.
2. **Runtime Filtering:** In `server/server.js`, `GET /api/leaderboard` excludes teams associated with test tournaments at the query level without mutating the underlying team document.
3. **No Unlocking:** The squad remains locked and unmodified in the database.

---

## 4. Empirical Test Verification (`server/test-qa-data-isolation.mjs`)

All 7 isolation test cases were executed and verified passing:
1. `Public stats excludes QA registrations and QA active countdown` (862.9ms) — **PASS**
2. `Public leaderboard edge cases: genuine, QA, ambiguous, legacy, and multi-event teams` (109.2ms) — **PASS**
3. `Admin payments queue retains QA records with visible isTest tag and separated summary` (78.5ms) — **PASS**
4. `Migration script enforces dual confirmation guards and protects team t-1791543889807` (139.1ms) — **PASS**
5. `Duplicate UTR protection and payment review permissions` (203.5ms) — **PASS**
6. `Migration aborts if rogue unverified QA hackathon is detected` (17.6ms) — **PASS**
7. `Migration aborts if registrations count exceeds expected census (>6)` (49.8ms) — **PASS**

---

## 5. Owner Decision & Pre-Launch Recommendations

1. **Keep Live Database Unmodified:** Do not run `--apply` on production until the owner reviews the migration report and confirms all 6 historical registrations.
2. **Runtime Isolation is Already Live:** Commit `4c3851c` deployed on Render and Vercel already filters out QA data at runtime via `server/server.js` queries, ensuring the public site is completely clean today without running the database migration.
