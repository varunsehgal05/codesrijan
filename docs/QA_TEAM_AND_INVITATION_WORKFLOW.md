# CodeSrijan — Team & Invitation Workflow Deep-Dive Audit

**Execution Date:** 2026-10-23  
**Auditor:** Lead QA Automation & Data Integrity Team  
**Focus Area:** Squad Formation, Member Lifecycle, Roster Locks, Data Consistency & Historical Artifacts  

---

## 1. Team Data Models & Architecture

CodeSrijan's collaborative architecture relies on three primary Mongoose collections defined in `server/models/index.js`:

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│             Team               │       │         TeamInvitation         │
├────────────────────────────────┤       ├────────────────────────────────┤
│ id: String (unique)            │◀──────│ id: String (unique)            │
│ name: String                   │       │ teamId: String                 │
│ leaderId: String               │       │ senderId: String               │
│ memberIds: [String]            │       │ receiverId: String             │
│ hackathonId: String            │       │ status: pending/accepted/...   │
│ isLocked: Boolean              │       └────────────────────────────────┘
│ lockedForHackathonId: String   │
│ isTest: Boolean                │       ┌────────────────────────────────┐
│ problemId: String              │       │        TeamJoinRequest         │
│ isSubmitted: Boolean           │       ├────────────────────────────────┤
└────────────────────────────────┘       │ id: String (unique)            │
                 ▲                       │ teamId: String                 │
                 │                       │ userId: String                 │
                 │                       │ status: pending/accepted/...   │
┌────────────────────────────────┐       └────────────────────────────────┘
│          Registration          │
├────────────────────────────────┤
│ type: 'team' | 'solo'          │
│ teamId: String                 │
│ rosterMembers: [RosterMember]  │
│ feeAmount: Number              │
└────────────────────────────────┘
```

---

## 2. Team Lifecycle & Invitation Workflow

### 2.1 Squad Creation (`POST /api/teams`)
- **Controller:** `server/server.js:1214`
- **Required Fields:** `name: String`, `hackathonId: String` (optional).
- **Rules:**
  - Authenticated student only (`requireAuth`, `requireRole(['student'])`).
  - Creator is assigned as `leaderId`.
  - Initial `memberIds` array initialized with `[leaderId]`.
  - `isLocked: false` by default.

### 2.2 Member Invitation (`POST /api/teams/:id/invite`)
- **Controller:** `server/server.js:1425`
- **Authorization:** Only current `leaderId` can transmit invitations.
- **Pre-Conditions Enforced by Backend:**
  1. Team must not be locked (`!team.isLocked`).
  2. Team capacity limit not exceeded (`memberIds.length < maxAllowed`, default 4, max 6).
  3. Receiver must exist in system and have no active team (`!receiver.teamId`).
  4. Receiver must be registered for the event (`Registration.findOne({ userId: receiverId, hackathonId: team.hackathonId })`).
  5. No pending duplicate invite exists for this receiver.
- **Dispatch:** Creates `TeamInvitation` with status `pending` and dispatches in-app `Notification`.

### 2.3 Invitation Acceptance (`POST /api/teams/accept-invite/:inviteId`)
- **Controller:** `server/server.js:1475`
- **Actions Executed:**
  1. Atomic roster update: `Team.findOneAndUpdate({ id }, { $push: { memberIds: req.user.id } })`.
  2. Student alignment: `User.findOneAndUpdate({ id: req.user.id }, { teamId })`.
  3. Invitation marked `status: 'accepted'`.
- **Roster Lock Guard:** If squad was locked in the interim, acceptance is rejected with HTTP 403.

---

## 3. High-Priority Defect Analysis: `BUG-TEAM-001` (Test Case `TEAM-008`)

### 3.1 The Problem Statement
During milestone testing, an architectural dependency conflict was identified:
To invite Student B into a squad for an upcoming tournament, Student B was forced to register for that tournament first. Since Student B was not yet on a team, Student B had to register as `type: 'solo'`.
When Leader Student A subsequently registered the entire squad for the tournament as `type: 'team'`, a new team registration record was created containing both Student A and Student B in `rosterMembers`.

### 3.2 Observed Defect (Before Fix)
In isolated test execution (`test_audit_journeys.mjs`), inspecting the database revealed:
```
Tournament ID: hack-1792721080680 (Paid, ₹150 per participant)
Records in Registration Collection:
1. Reg reg-001: type='solo', userId=studentB, feeAmount=150, status='awaiting_payment_proof'
2. Reg reg-002: type='team', teamId=teamAlpha, roster=[studentA, studentB], feeAmount=300

Consequences:
- Total fee demanded across database: ₹450 (should be ₹300).
- Student B was counted twice in tournament metrics.
- Student B's dashboard retained a zombie solo registration alongside the team registration.
- In payment admin queue, two separate payment requests existed for the same participant.
```

### 3.3 The Local Remediation
In `server/server.js` within `POST /api/hackathons/:id/register` (when `type === 'team'`), an automated reconciliation step was introduced before saving the tournament registration:

```javascript
// Clean up placeholder solo registrations of squad members so they are not double-counted or double-billed
await Registration.deleteMany({
    hackathonId,
    userId: { $in: targetTeam.memberIds || [] },
    type: 'solo',
    paymentStatus: { $in: ['pending_proof', 'not_required'] }
});
await targetTeam.save();
```

### 3.4 Retest Verification
After applying the patch, running `server/test_audit_journeys.mjs`:
```
Total registration records for teamHackId: 1
 - Reg reg-team: type=team, fee=300, roster=[studentA, studentB]
soloRecordRemains: false
totalRegistrations: 1
Status: PASS
```
The zombie solo record was cleanly eliminated, and exactly one authoritative team registration was retained with the correct fee total.

---

## 4. Team Locking Mechanisms

### 4.1 When Team Roster Locks
A squad's roster is permanently locked under either of two conditions:
1. **Tournament Registration:** When the leader submits `POST /api/hackathons/:id/register` for a free or paid tournament, `targetTeam.isLocked = true` and `targetTeam.lockedForHackathonId = hackathonId` are written to the database.
2. **Administrative Override:** An administrator can manually lock a squad via `POST /api/admin/teams/:id/lock`.

### 4.2 Prohibited Actions on Locked Squads
Once locked, the backend enforces the following server-side rejections:
- `POST /api/teams/:id/invite` -> HTTP 403 Forbidden (*"Squad roster is locked for an active hackathon registration."*)
- `POST /api/teams/accept-invite/:id` -> HTTP 403 Forbidden
- `POST /api/teams/leave` -> HTTP 403 Forbidden (*"Squad roster is locked for an active hackathon registration. Transfer leadership or contact administration."*)
- `POST /api/teams/:id/kick` -> HTTP 403 Forbidden
- `POST /api/teams/:id/transfer` -> HTTP 403 Forbidden
- `DELETE /api/teams/:id` -> HTTP 403 Forbidden

All prohibitions are verified in regression suite `server/test-security-local.mjs` (test case *"locked roster blocks leave, dissolve and transfer"*).

---

## 5. Historical Squad Artifact: `t-1791543889807`

### 5.1 Artifact Context
In the live production MongoDB Atlas cluster (`codesrijan-cluster.mrckx43.mongodb.net`), a historical team document with ID `t-1791543889807` was created during early Phase 1 automated staging tests. It is associated with event `hack-demo-2` and has roster members from early testing.

### 5.2 Mandatory Safety Protocol
1. **Never Mutate or Unlock:** The team document must NEVER be modified, deleted, unlocked, or have its `isTest` flag edited in the live database.
2. **Leaderboard Filtering Without Mutation:** In `server/server.js`, `GET /api/leaderboard` applies relationship-based filtering:
   ```javascript
   const testHackathons = await Hackathon.find({ isTest: true }).select('id');
   const testHackIds = new Set(testHackathons.map(h => h.id));
   // Team scores from QA hackathons are filtered at runtime without altering team records
   ```
3. **Migration Target Guard:** In `server/migrate-qa-data.mjs`, `t-1791543889807` is explicitly whitelisted as `UNRESOLVED_AMBIGUOUS` and skipped during any migration run.

---

## 6. Admin Visibility & Synchronization

On `/admin/teams`:
- Administrators see real-time synchronization of all squad rosters.
- Displays: Squad ID, Name, Leader, Member Count, Linked Hackathon, Locked Status, Disqualification Status.
- Actions available: View Details, Lock/Unlock, Disqualify, Undo-Disqualification.
- Tested and confirmed matching the student-facing view across all states.
