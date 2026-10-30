# CODESRIJAN — COMPLETE HACKATHON LIFECYCLE ANALYSIS

**Audit Date:** October 30, 2026  
**Auditor:** Principal Hackathon Operations Architect & CTO  
**Methodology:** Comprehensive end-to-end tracing across 25 operational stages, mapping Route, Role, API Endpoint, Database Mutation, Downstream Dependencies, Failure Modes, and Implementation Gaps.  

---

## Complete 25-Stage Lifecycle Execution Trace

### Stage 1: Organizer Registration
* **Handling Page:** None (`/host-event` exists only as a static inquiry form).
* **Controlling Role:** None.
* **API Endpoint:** `POST /api/host-requests` (Stores lead inquiry).
* **Database Records Changed:** None in `User` collection.
* **Subsequent Features Dependent:** Organizer account creation, institutional onboarding.
* **What Happens When It Fails:** Lead is lost or dropped.
* **Current Gap:** **NOT IMPLEMENTED**. Organizers cannot register accounts.

---

### Stage 2: Organizer Verification
* **Handling Page:** None.
* **Controlling Role:** Admin (manual).
* **API Endpoint:** None.
* **Database Records Changed:** None.
* **Subsequent Features Dependent:** Hackathon creation authorization.
* **What Happens When It Fails:** N/A.
* **Current Gap:** **NOT IMPLEMENTED**. No KYC, college domain verification, or institution approval workflow exists.

---

### Stage 3: Hackathon Creation
* **Handling Page:** `/admin/hackathons/create` (`src/routes/admin.hackathons.create.tsx`).
* **Controlling Role:** Super-Admin (`admin`).
* **API Endpoint:** `POST /api/hackathons`.
* **Database Records Changed:** Inserts new document in `Hackathon` collection (`status: 'draft'`, `id: 'hck-...'`).
* **Subsequent Features Dependent:** Schedule configuration, fee rules, problem statement binding.
* **What Happens When It Fails:** Modal displays error toast; creation aborted.
* **Current Gap:** Only global super-admins can create events; external organizers cannot self-serve.

---

### Stage 4: Event Configuration
* **Handling Page:** `/admin/hackathons/$id` (`src/routes/admin.hackathons.$id.tsx`).
* **Controlling Role:** Super-Admin (`admin`).
* **API Endpoint:** `PUT /api/hackathons/:id`.
* **Database Records Changed:** Updates `Hackathon` fields (`theme`, `banner`, `fee`, `upiId`, `qrImageUrl`, `teamSizeMin`, `teamSizeMax`).
* **Subsequent Features Dependent:** Registration flow, UPI payment rendering, problem lock rules.
* **What Happens When It Fails:** Outdated rules or incorrect fee amounts persist.
* **Current Gap:** No preview mode for organizers to test the student registration experience before publishing.

---

### Stage 5: Registration Opening
* **Handling Page:** `/admin/operations` (`src/routes/admin.operations.tsx`) or `/admin/hackathons`.
* **Controlling Role:** Super-Admin (`admin`).
* **API Endpoint:** `PUT /api/hackathons/:id/status` (`status: 'registration_open'`).
* **Database Records Changed:** `Hackathon.status` becomes `'registration_open'`.
* **Subsequent Features Dependent:** Registration countdown timer on `/`, student enrollment buttons on `/hackathons`.
* **What Happens When It Fails:** Students navigating to register encounter "Registration Concluded" or disabled buttons.
* **Current Gap:** Fully implemented and functional.

---

### Stage 6: Participant Registration
* **Handling Page:** `/hackathons/$id/register` (`src/routes/hackathons.$id.register.tsx`).
* **Controlling Role:** Student (`student`).
* **API Endpoint:** `POST /api/registrations`.
* **Database Records Changed:** Inserts `Registration` (`status: 'registered'`, `paymentStatus: 'pending_proof'` if paid, `'not_required'` if free).
* **Subsequent Features Dependent:** Team creation eligibility, dashboard checklist progression.
* **What Happens When It Fails:** 409 conflict returned if `{ hackathonId, userId }` is already registered.
* **Current Gap:** Works smoothly. However, if a student is already registered, navigating back to this page does not cleanly offer a "View My Registration" redirect.

---

### Stage 7: Team Formation
* **Handling Page:** `/recruitment` (`src/routes/recruitment.tsx`) and `/team` (`src/routes/team.tsx`).
* **Controlling Role:** Student (`student`).
* **API Endpoint:** `POST /api/teams`, `POST /api/team-invitations`, `POST /api/team-join-requests`.
* **Database Records Changed:** Inserts `Team`, `TeamInvitation`, or `TeamJoinRequest`; updates `User.teamId`.
* **Subsequent Features Dependent:** Workspace HUD access, problem statement locking, payment verification.
* **What Happens When It Fails:** Prevents user from entering the workspace if maximum squad limit (4) is reached.
* **Current Gap:** Works well, but joining multiple teams across different hackathons causes state collisions in `User.teamId`.

---

### Stage 8: Eligibility Checking
* **Handling Page:** Background server validation on registration and team lock.
* **Controlling Role:** System.
* **API Endpoint:** Internal check in `server/server.js`.
* **Database Records Changed:** None.
* **Subsequent Features Dependent:** Registration acceptance.
* **What Happens When It Fails:** User registration rejected if outside `eligibleColleges`.
* **Current Gap:** Most eligibility rules in the current schema are advisory strings (`eligibilityRules: String`) rather than hard database-enforced college whitelists.

---

### Stage 9: Payment (Where Applicable)
* **Handling Page:** `/payment` (`src/routes/payment.tsx`).
* **Controlling Role:** Student (`student`).
* **API Endpoint:** `POST /api/registrations/payment-proof`.
* **Database Records Changed:** `Registration.paymentStatus` -> `'payment_under_review'`, `Registration.transactionReference`, GridFS storage upload.
* **Subsequent Features Dependent:** Administrative verification queue on `/admin/payments`.
* **What Happens When It Fails:** Upload error shown; student remains in `'pending_proof'` status.
* **Current Gap:** Relies on manual QR code scanning and UTR transcription; no automated gateway clearance.

---

### Stage 10: Registration Confirmation
* **Handling Page:** `/admin/payments` (`src/routes/admin.payments.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/admin/payments/:id/verify`.
* **Database Records Changed:** `Registration.paymentStatus` -> `'verified'`, `Registration.status` -> `'registered'`, `Registration.verifiedAt` set.
* **Subsequent Features Dependent:** Fee clearance check on `/dashboard`, project submission unlocking.
* **What Happens When It Fails:** If rejected, status changes to `'rejected'`, triggering an email notification with rejection reason.
* **Current Gap:** Functional. Lacks bulk approval and instant webhook automation.

---

### Stage 11: Event Announcements
* **Handling Page:** `/admin/announcements` (`src/routes/admin.announcements.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/announcements`.
* **Database Records Changed:** Inserts `Announcement` document; emits Socket.io broadcast.
* **Subsequent Features Dependent:** Live ticker on `/announcements`, unread badge in Navbar bell.
* **What Happens When It Fails:** Bulletin drops; students do not receive real-time push notification.
* **Current Gap:** Push notifications via Firebase Cloud Messaging are wired in the backend (`server/services/fcm.js`) but require service workers to be active in the client browser.

---

### Stage 12: Event Start
* **Handling Page:** `/admin/operations` (`src/routes/admin.operations.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `PUT /api/hackathons/:id/status` (`status: 'active'`).
* **Database Records Changed:** `Hackathon.status` -> `'active'`.
* **Subsequent Features Dependent:** Countdown clock switches from "Event Starts In" to "Submission Closes In".
* **What Happens When It Fails:** Dashboard remains in pre-event state.
* **Current Gap:** Automated scheduled cron to transition statuses at exact timestamps is missing; currently relies on manual admin button click or ad-hoc trigger.

---

### Stage 13: Problem Statement Release
* **Handling Page:** `/admin/problems` or `/admin/operations`.
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `PUT /api/hackathons/:id/reveal-problems`.
* **Database Records Changed:** `Hackathon.problemStatementsRevealed` -> `true`.
* **Subsequent Features Dependent:** Problem statements appear on `/problems` and homepage "Live Objective Matrices".
* **What Happens When It Fails:** Problems remain hidden as drafts.
* **Current Gap:** Fully functional with manual and scheduled release options.

---

### Stage 14: Participant Development
* **Handling Page:** `/workspace` (`src/routes/workspace.tsx`).
* **Controlling Role:** Squad Members.
* **API Endpoint:** `POST /api/tasks`, `PUT /api/tasks/:id`, `POST /api/mentor-requests`.
* **Database Records Changed:** `ProjectTask`, `MentorRequest`.
* **Subsequent Features Dependent:** Readiness score calculation (0-100%).
* **What Happens When It Fails:** Task cards fail to update.
* **Current Gap:** Tasks do not sync across team members via WebSockets in real time (requires manual refresh).

---

### Stage 15: Project Submission
* **Handling Page:** `/workspace` (Submission Modal) or `/dashboard`.
* **Controlling Role:** Squad Leader.
* **API Endpoint:** `POST /api/submissions`.
* **Database Records Changed:** Inserts `Submission` document; updates `Team.isSubmitted` -> `true`.
* **Subsequent Features Dependent:** Locks squad workspace; populates judge evaluation queue.
* **What Happens When It Fails:** Displays validation error (e.g. missing GitHub URL or unverified payment).
* **Current Gap:** Does not verify that the submitted GitHub repository is public or active.

---

### Stage 16: Submission Validation
* **Handling Page:** Background server validation.
* **Controlling Role:** System.
* **API Endpoint:** Validated inside `POST /api/submissions`.
* **Database Records Changed:** None.
* **Subsequent Features Dependent:** Acceptance of submission.
* **What Happens When It Fails:** Returns 400 Bad Request with field-specific errors.
* **Current Gap:** No automated plagiarism check, commit frequency verification, or build verification.

---

### Stage 17: Judge Assignment
* **Handling Page:** `/admin/judges` (`src/routes/admin.judges.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/admin/judges/assign`.
* **Database Records Changed:** Inserts/Updates `JudgeAssignment` records.
* **Subsequent Features Dependent:** Populates judge's personalized queue on `/evaluations`.
* **What Happens When It Fails:** Judges see an empty evaluation table.
* **Current Gap:** Lacks automated round-robin or category-based auto-distribution of submissions to judges.

---

### Stage 18: Evaluation
* **Handling Page:** `/evaluations` (`src/routes/evaluations.tsx`).
* **Controlling Role:** Judge (`judge`, `admin`).
* **API Endpoint:** `POST /api/evaluations`.
* **Database Records Changed:** Inserts `Evaluation` record with individual rubric criteria scores (0-100) and written comments.
* **Subsequent Features Dependent:** Leaderboard score recalculation.
* **What Happens When It Fails:** Judge loses unsaved slider input.
* **Current Gap:** No blind judging; judges see student colleges and identities.

---

### Stage 19: Score Calculation
* **Handling Page:** Background server aggregation.
* **Controlling Role:** System.
* **API Endpoint:** `GET /api/leaderboard`.
* **Database Records Changed:** Aggregates `Evaluation.totalScore` plus `Team.bonusPoints` minus `Team.penaltyPoints`.
* **Subsequent Features Dependent:** Leaderboard rankings on `/leaderboard`.
* **What Happens When It Fails:** Scores display as 0 or fail to sort.
* **Current Gap:** Naive arithmetic average; no score normalization across lenient vs strict judges.

---

### Stage 20: Result Approval
* **Handling Page:** `/admin/leaderboard` (`src/routes/admin.leaderboard.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/admin/leaderboard/freeze` or `/finalize`.
* **Database Records Changed:** `Hackathon.status` -> `'evaluation'` or updates freeze flag in `Setting`.
* **Subsequent Features Dependent:** Winner announcement release.
* **What Happens When It Fails:** Live leaderboard prematurely reflects unfinalized scores.
* **Current Gap:** Functional freeze switch, but lacks formal multi-sign-off approval workflow.

---

### Stage 21: Leaderboard Publication
* **Handling Page:** `/leaderboard` (`src/routes/leaderboard.tsx`).
* **Controlling Role:** Admin / System.
* **API Endpoint:** `GET /api/leaderboard`.
* **Database Records Changed:** None.
* **Subsequent Features Dependent:** Public view of ranks.
* **What Happens When It Fails:** Leaderboard displays cached or frozen state.
* **Current Gap:** Works well. Lacks tie-breaker badges.

---

### Stage 22: Winner Announcement
* **Handling Page:** `/announcements` and `/` (Hero Banner).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/announcements`.
* **Database Records Changed:** Broadcasts winner bulletin.
* **Subsequent Features Dependent:** Social highlights and certificate issuance.
* **What Happens When It Fails:** Announcement not dispatched.
* **Current Gap:** Manual broadcast; no automated winner podium email blast.

---

### Stage 23: Certificate Generation
* **Handling Page:** `/admin/certificates` (`src/routes/admin.certificates.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `POST /api/admin/certificates/issue-bulk`.
* **Database Records Changed:** Inserts `Certificate` records for verified participants and winners.
* **Subsequent Features Dependent:** Student certificate download on `/certificates`.
* **What Happens When It Fails:** Certificates missing from student vaults.
* **Current Gap:** Client-side canvas render; lacks public verification URLs and QR signatures.

---

### Stage 24: Participant Feedback
* **Handling Page:** None.
* **Controlling Role:** None.
* **API Endpoint:** None.
* **Database Records Changed:** None.
* **Subsequent Features Dependent:** Event retrospective analytics.
* **What Happens When It Fails:** N/A.
* **Current Gap:** **NOT IMPLEMENTED**. No post-event Net Promoter Score (NPS) or student feedback survey.

---

### Stage 25: Event Completion and Archive
* **Handling Page:** `/admin/hackathons` (`src/routes/admin.hackathons.tsx`).
* **Controlling Role:** Admin (`admin`).
* **API Endpoint:** `PUT /api/hackathons/:id/status` (`status: 'completed'` or `'archived'`).
* **Database Records Changed:** `Hackathon.status` -> `'completed'`, `Hackathon.isArchived` -> `true`.
* **Subsequent Features Dependent:** Moves event to "Past Hackathons" catalog; disables active submissions and chats.
* **What Happens When It Fails:** Event stays perpetually open in the active countdown.
* **Current Gap:** Functional.

---

*Verified from backend controllers in `server/server.js` and frontend TanStack routes.*
