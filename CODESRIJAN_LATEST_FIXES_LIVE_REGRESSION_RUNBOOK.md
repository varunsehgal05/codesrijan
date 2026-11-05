# CODESRIJAN — LATEST FIXES LIVE REGRESSION RUNBOOK
**Execution Environment:** Production Live Site (`https://codesrijan-nine.vercel.app`) & Canonical Backend (`https://codesrijan-api-6tfr.onrender.com/api`)  
**Methodology:** Full-Context Live QA & GSD Verification Protocol  
**Authorized Test Identities:** Admin (`admin@codesrijan.com`), Judge (`judge@codesrijan.com`), Mentor (`mentor@codesrijan.com`), Squad Leader (`varunsehgal2005@gmail.com`), Student / Hacker (`student@codesrijan.com`, `hacker1-6@codesrijan.com`)

---

## 0. Mission & Operational Scope

- **Role:** Act as the GSD QA orchestrator. Continue from the latest supplied audit report and operational guide. Run live browser tests against the deployed CodeSrijan site, use authenticated test accounts provided by the project owner, retrieve actual backend data, compare UI state to API state, reproduce defects, and return concise evidence-backed results.
- **Objective:**
  1. Re-test every fix reported in the latest production QA document.
  2. Verify all buttons, fields, tabs, modals, state transitions, and listed API calls in the Judge and Mentor command centers.
  3. Verify the Admin assignment dropdowns and staff-assignment APIs.
  4. Verify registration handle sanitization, workspace squad resolution and final-submit locking, recruitment route rendering, and SrijanBot schedule intelligence.
  5. Read and report real, sanitized live data for Judge and Mentor dashboards.
  6. Verify the canonical deployed revisions and backend health.
  7. Update QA documentation with PASS / FAIL / BLOCKED / NOT RUN and evidence. Never claim a test passed if it was not executed.

---

## 1. Specialist Subagent Delegation Matrix

| Agent ID | Scope | Account Alias | Required Return |
| :--- | :--- | :--- | :--- |
| **SUB-DEPLOY** | Git branch/commit, Vercel & Render deployed revisions, build/deployment logs, API health | Anonymous | Commit/deployment evidence and service health |
| **SUB-REGISTRATION** | Handle typing, paste, auto-suggestion, validation, and backend persistence | Dedicated QA registration | Sanitized registration flow and validation results |
| **SUB-ADMIN-ASSIGNMENTS** | Judge/Mentor assignment pages, dropdown target population, GET/POST/DELETE, rubric config | Admin | Real target counts, selected test fixtures, endpoint matrix |
| **SUB-JUDGE-BROWSER** | Judge portal tabs, assigned work, evaluation sheet, draft and locking rules | Judge | Sanitized dashboard snapshot and all Judge test results |
| **SUB-MENTOR-BROWSER** | Mentor portal tabs, squads, guidance requests, dossier, and private-note workflow | Mentor | Sanitized dashboard snapshot and all Mentor test results |
| **SUB-WORKSPACE** | Squad resolution, Mission Readiness anchor, one final submit control, CAS/idempotency | Squad Leader & Student | Workspace snapshot and submission state checks |
| **SUB-RECRUITMENT** | Recruitment route runtime, search/filter/listing/invite UI, and error boundary | Student | Route and workflow results |
| **SUB-SRIJANBOT** | Deadline queries, plural wording, IST calculation, inline actions, factual platform answers | Student / Public | Prompt/response matrix and source data for answers |
| **SUB-API-SEC** | RBAC, ownership/assignment scoping, endpoint status/schema, private notes, evaluation locking | Role test identities | Sanitized HTTP status and authorization matrix |
| **SUB-EMAIL-INTEGRATIONS** | Nine documented transactional email trigger paths, delivery provider, and recipient routing | Test inboxes / sink | Trigger-to-recipient delivery matrix |
| **SUB-REGRESSION-ORCHESTRATOR**| Reproduce fixes, rerun full regression, reconcile results, and update docs | Serialized as needed | Final test report, defects, updated `STATE.md` |

---

## 2. Test Execution & Verification Catalog (200 Tests)

### Section 4: Deployment & Environment Verification (`DEP-001` - `DEP-010`)
- `DEP-001`: Git source of truth (clean working tree, record local and remote SHAs, verify latest commit).
- `DEP-002`: Commit conflict resolution (compare reported commits `29d36e0`, `deca35b`, `9d32260`, `625d3c5`, `e7abef2` with `origin/main` & `origin/master`).
- `DEP-003`: Vercel revision (verify production deployment ready on `https://codesrijan-nine.vercel.app`).
- `DEP-004`: Render revision (verify backend health on `https://codesrijan-api-6tfr.onrender.com/health`).
- `DEP-005`: Frontend health (anonymous access to public routes, protected routes redirect/guard).
- `DEP-006`: API health (`GET /api/system/status` or `/health` returning 200).
- `DEP-007`: Database readiness (MongoDB connection active, `readyState: 1`, name: `codesrijan`).
- `DEP-008`: Runtime errors (clean console, no uncaught exceptions).
- `DEP-009`: Build reproduction (`npm run build` succeeds cleanly in ~1s).
- `DEP-010`: `/rules` deployment (redirects to `/code-of-conduct` in production).

### Section 5: Registration Handle & Identity (`REG-001` - `REG-012`)
- `REG-001`: Normal handle typing (lowercase alphanumeric accepted).
- `REG-002`: Space key blocked (interception on `keydown` prevents spaces in handle).
- `REG-003`: Paste whitespace (whitespace stripped or sanitized).
- `REG-004`: Allowed separators (underscores/hyphens retained).
- `REG-005`: Invalid punctuation (disallowed symbols stripped).
- `REG-006`: Auto-suggest ("Auto-fill from name" generates clean handle).
- `REG-007`: Keyboard accessibility (Tab, arrows, backspace work).
- `REG-008`: Paste event edge cases (preserves intended insertion).
- `REG-009`: Empty/length boundaries (min 3, max 30 chars).
- `REG-010`: Duplicate handle collision (conflict handling).
- `REG-011`: Server-side bypass prevention (backend enforces regex).
- `REG-012`: Persisted identity (stored handle matches normalized format).

### Section 6: Admin Staff Assignments & Rubric (`ASG-001` - `ASG-020`)
- `ASG-001`: Judge assignment page (`/admin/judges` loads without error).
- `ASG-002`: Mentor assignment page (`/admin/mentors` loads without error).
- `ASG-003`: Judge assignment GET (`/api/admin/judge-assignments` returns assignments).
- `ASG-004`: Mentor assignment GET (`/api/admin/mentor-assignments` returns assignments).
- `ASG-005`: Submission targets (submitted projects populate dropdown).
- `ASG-006`: Team fallback (submitted squads appear even without separate project record).
- `ASG-007`: Target ID mapping (`projectId`, `id`, `teamId` mapped consistently).
- `ASG-008`: Duplicate target suppression (each target listed once).
- `ASG-009`: Empty targets handling (clear empty state, no false error).
- `ASG-010`: Assign judge (POST assignment persists).
- `ASG-011`: Assign mentor (POST assignment persists).
- `ASG-012`: Assignment reassignment (updating assignment updates scope).
- `ASG-013`: Delete assignment (DELETE revokes scope).
- `ASG-014`: POST/DELETE schema validation.
- `ASG-015`: Rubric GET (`/api/admin/hackathons/:id/rubric` returns criteria).
- `ASG-016`: Rubric update (validates weight totals 100%).
- `ASG-017`: Rubric immutability after evaluations begin.
- `ASG-018`: Wrong-role assignment API access denied (403 for students/mentors).
- `ASG-019`: Event ownership validation.
- `ASG-020`: UI/API state consistency.

### Section 7: Judge Command Center (`JUD-001` - `JUD-058`)
- `JUD-001` - `JUD-012`: Session shell, route guard, loading, retry, profile, settings, logout, cache wipe, tab switching.
- `JUD-013` - `JUD-034`: Overview metrics, 7 tabs, card fields, tech stack tags, SafeLinks (GitHub, Demo, Figma, Video), pending filter, saved drafts, submitted evaluations, history, notifications.
- `JUD-035` - `JUD-058`: Evaluation workspace, truthy evaluation matching (no `undefined === undefined` bug), 4-pillar rubric (Technical, Innovation, Impact, Presentation), min 0, max 30/30/20/20, weighted scores, private feedback, strengths, improvements, mandatory checkbox, save draft, submit final, post-submit lock, admin reopen requirement, IDOR checks.

### Section 8: Mentor Command Center (`MEN-001` - `MEN-046`)
- `MEN-001` - `MEN-020`: Shell, authentication guard, profile, settings, logout, overview metrics, assigned squads, squad dossier, milestone links, notifications.
- `MEN-021` - `MEN-036`: Guidance requests, triage queue, claim request, concurrent claim guard, respond to request, meeting link, resolve ticket, reopen ticket, WebSocket isolation.
- `MEN-037` - `MEN-046`: Squad dossier, roster, repository links, confidential notes history, save private note (5,000 char max), cross-squad note isolation, XSS escaping.

### Section 9: Squad Workspace (`WS-001` - `WS-010`)
- `WS-001`: Team resolution by current `teamId`.
- `WS-002`: Team resolution by `leaderId`.
- `WS-003`: Team resolution by `memberIds`.
- `WS-004`: Cross-team fallback prevented.
- `WS-005`: One authoritative submit button.
- `WS-006`: Anchor action scrolls to `#deliverable-matrix`.
- `WS-007`: Confirmation modal prevents accidental submission.
- `WS-008`: Submit lock / CAS guard.
- `WS-009`: Double-click / concurrent submit prevention.
- `WS-010`: Post-submit reload persists squad workspace.

### Section 10: Recruitment Route (`REC-001` - `REC-007`)
- `REC-001`: Direct route mount (no `useEffect is not defined` crash).
- `REC-002`: Refresh route hydrates smoothly.
- `REC-003`: Navigation from dashboard.
- `REC-004`: Search and filter capabilities.
- `REC-005`: Empty search state.
- `REC-006`: Create QA listing.
- `REC-007`: Invite flow.

### Section 11: SrijanBot Schedule Intelligence (`BOT-001` - `BOT-016`)
- `BOT-001` - `BOT-008`: Hackathon start/end queries, plural phrasing, submission deadline, exact IST formatting, expired event handling, missing data handling.
- `BOT-009` - `BOT-012`: Inline button formatting, Explore Hackathons, Help Desk, Show Stats.
- `BOT-013` - `BOT-016`: Knowledge accuracy, general programming Q&A, provider failover, prompt injection defense.

### Section 12: Transactional Emails (`MAIL-001` - `MAIL-009`)
- `MAIL-001`: Account verification OTP.
- `MAIL-002`: Welcome email.
- `MAIL-003`: Password reset token.
- `MAIL-004`: Admin payment review alert.
- `MAIL-005`: Payment approval / workspace unlock.
- `MAIL-006`: Payment rejection.
- `MAIL-007`: Teammate join notification.
- `MAIL-008`: Invitation acceptance.
- `MAIL-009`: Role elevation notification.

### Section 13: Security & Authorization (`SEC-001` - `SEC-012`)
- `SEC-001` - `SEC-012`: Token requirements, expired token rejection, cross-role API blocks, note isolation, judge evaluation ownership, admin-only reopen, IDOR prevention, WebSocket room auth, parameter tampering prevention, data minimization.
