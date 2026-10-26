# SUBAGENT E — HACKATHON, SQUAD, LEADERBOARD & ADMIN AUDIT
**Platform Release:** CodeSrijan 1.0  
**Audit Date:** 2026-10-26  
**Auditor:** Subagent E (Hackathon, Squad, Leaderboard and Admin Workflows)  

---

## 1. Hackathon Catalog & Tournament Lifecycle

### 1.1 Discovery & Visibility
- Public catalog (`/hackathons`) displays active and upcoming tournaments with details, start/end dates, entry fees, and registration deadlines.
- **Problem Statement Privacy:** Tracks remain strictly classified and hidden from participants until an administrator executes the reveal directive (`PATCH /api/admin/hackathons/:id/reveal-problems`).
- Problem tracks are locked immediately upon hackathon creation and unlocked only upon authorized admin release.

### 1.2 Phase & Deadline Calculations
Tournament phases are calculated server-side using server time to prevent client-clock manipulation:
- `upcoming`: Current time is before `startDate`.
- `registration_open`: Current time is within registration boundaries.
- `registration_closed`: Current time is past `registrationDeadline` but before `startDate`.
- `hacking`: Current time is between `startDate` and `submissionDeadline`.
- `evaluating`: Current time is past `submissionDeadline` and evaluations are ongoing.
- `concluded`: Current time is past `endDate`.

---

## 2. Squad Management & Governance

### 2.1 Roster Rules
- Squad capacity: 1 to 4 operatives.
- Roster locking: Squads become locked once registration payment is verified or a final project payload is delivered, preventing squad switching during active competition.
- Kick operative, leave squad, and dissolve squad actions are properly authorized on the server.

### 2.2 Administrator Governance & Squad Moderation
- **Disqualification:** Admin provides a mandatory reason via `POST /api/admin/teams/:id/disqualify`. Squad status changes to `disqualified`, in-app notifications are dispatched to all members, and an immutable audit log is generated.
- **Reinstatement:** Admin can restore a disqualified squad via `POST /api/admin/teams/:id/undo-disqualify`.
- **Ban:** Permanent tournament exclusion via `POST /api/admin/teams/:id/ban`.
- **Audit Verification:** All squad moderation calls record `DISQUALIFY_TEAM`, `REINSTATE_TEAM`, or `BAN_TEAM` in `ActivityLog`.

---

## 3. Leaderboard & Evaluation Integrity

### 3.1 Tournament Filtering
- `/leaderboard` includes an event dropdown allowing operatives and judges to view rankings specific to each hackathon tournament.

### 3.2 Authentic Evaluation Scores
- **No Mock or Fabricated Scores:** Squads that have not yet been evaluated by authorized judges remain explicitly marked as *Awaiting Evaluation* or unranked.
- Graded projects display verified criteria scores (Technical Complexity, Innovation, UI/UX, Feasibility) directly from the `Evaluation` collection.

---

## 4. Hackathon Operations Dashboard (Feature 2)

- Accessible to administrators at `/admin/operations`.
- Provides unified operations oversight:
  - Realtime registration counts and verified paid counts.
  - Backlog counter of pending payment reviews with direct shortcut to `/admin/payments`.
  - Active vs disqualified squad metrics.
  - Project submission counts.
  - One-click RFC 4180 compliant CSV roster export (`GET /api/admin/hackathons/:id/export-csv`) with formula injection sanitization.
