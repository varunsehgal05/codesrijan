# CODESRIJAN — PAGE-BY-PAGE GAP ANALYSIS & FUNCTIONAL AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal Software Architect & QA Lead  
**Scope:** Complete inspection of all primary client-side routes across Public, Student, Judge, Mentor, and Admin workflows.  

---

## 1. Public & Marketing Pages

### 1.1 Homepage
* **URL:** `/` (`src/routes/index.tsx`)
* **Intended Users:** All public visitors, students, prospective partners.
* **Current Functionality:** Hero section with neo-brutalist typography, dynamic countdown timer for the active hackathon, dynamic telemetry statistics (Hackers, Projects, Registrations, Colleges), and the "Live Objective Matrices" preview featuring the top 3 problem statements.
* **Important Controls & Actions:** "Start Building" (routes to `/register` or `/dashboard`), "View Schedule" (`/about`), "All Directives" (`/problems`), "Explore Parameters" problem links, Top navigation bar, Footer links.
* **Backend API Dependencies:** `GET /api/public/stats`, `GET /api/hackathons/active`, `GET /api/hackathons/:id/problems`.
* **Database Dependencies:** `Hackathon`, `ProblemStatement`, `Registration`, `User`.
* **Missing Features:** No past hackathon archive links directly from the hero; no live sponsor ticker; no multi-event selector if multiple hackathons run concurrently.
* **Broken or Incomplete Behavior:** If no active hackathon is marked in MongoDB, the countdown displays `00:00:00:00` or `--:--:--` without an informative "No upcoming events scheduled" placeholder.
* **Recommended Improvements:** Add an interactive event carousel when multiple events exist; surface top sponsor logos on the hero banner.

---

### 1.2 Explore Hackathons Directory
* **URL:** `/hackathons` (`src/routes/hackathons.index.tsx`)
* **Intended Users:** Competitors seeking events to join.
* **Current Functionality:** Displays hackathon cards categorized into "Active", "Upcoming", and "Past", with search by name/theme and category pills (AI, Web3, Open Innovation).
* **Important Controls & Actions:** Search bar, category filter buttons, "Enroll Now" / "View Details" buttons.
* **Backend API Dependencies:** `GET /api/hackathons`.
* **Database Dependencies:** `Hackathon`.
* **Missing Features:** No filtering by fee type (Free vs Paid); no filtering by format (Online vs In-Person); no college/region filter.
* **Broken or Incomplete Behavior:** If a hackathon is in `draft` status, it relies purely on backend filtering; if the backend returns draft events, unauthenticated users see unpublished drafts.
* **Recommended Improvements:** Add explicit multi-facet filters (Entry Fee: Free/Paid, Mode: Virtual/Physical/Hybrid, Team Size: Solo/Squad).

---

### 1.3 Problem Statements Catalog
* **URL:** `/problems` (`src/routes/problems.tsx`)
* **Intended Users:** Competitors researching challenge tracks.
* **Current Functionality:** Comprehensive directory of published problem statements. Allows search, domain filtering (AI, Web3, Cloud, Fintech), difficulty filtering, expandable problem brief drawer, and squad track locking.
* **Important Controls & Actions:** Search input, domain tabs, "Lock Track for Squad" button (for squad leaders), PDF rubric download link.
* **Backend API Dependencies:** `GET /api/problems`, `POST /api/teams/:id/lock-problem`.
* **Database Dependencies:** `ProblemStatement`, `Team`.
* **Missing Features:** No track quota caps (e.g., maximum 50 teams per track to prevent clustering); no track-specific mentor list.
* **Broken or Incomplete Behavior:** Non-leader squad members see the "Lock Track" button disabled without an explanatory tooltip indicating "Only squad leader can lock track".
* **Recommended Improvements:** Implement live slot indicators (e.g., "24/50 Squads Locked") to encourage even distribution across domains.

---

### 1.4 Global Leaderboard
* **URL:** `/leaderboard` (`src/routes/leaderboard.tsx`)
* **Intended Users:** All public visitors, judges, sponsors, competitors.
* **Current Functionality:** Real-time leaderboard table showing Rank, Squad Name, Project Title, Track, Criteria Breakdown, and Total Aggregated Score. Features animated podium for top 3 teams.
* **Important Controls & Actions:** Search by squad name, track filter, criteria score toggle drawer.
* **Backend API Dependencies:** `GET /api/leaderboard`, `GET /api/hackathons/active`.
* **Database Dependencies:** `Team`, `Evaluation`, `Project`, `Hackathon`.
* **Missing Features:** No historical leaderboard selector for past hackathons; no tie-breaking visual indicators; no export to CSV for judges.
* **Broken or Incomplete Behavior:** If scores are tied, the sorting defaults to database insertion order rather than an explicit tie-breaking rule (e.g. earliest submission timestamp or highest innovation criterion score).
* **Recommended Improvements:** Introduce frozen leaderboard status during final judge deliberation so winners are revealed simultaneously.

---

## 2. Student & Competitor Pages

### 2.1 Student Dashboard
* **URL:** `/dashboard` (`src/routes/dashboard.tsx`)
* **Intended Users:** Authenticated students and team leaders.
* **Current Functionality:** Central operative mission deck. Renders:
  1. Top countdown clock & fee clearance banner (for student role).
  2. Mission readiness checklist (Profile -> Squad -> Track -> Payment -> Payload).
  3. Squad status box: Operative roster, problem lock status, payload delivery status.
  4. Global Live Rank card.
  5. Secure Comm Links (Workspace HUD, Profile, Certificates, Support).
* **Important Controls & Actions:** "Complete Payment (₹100)", "Enter Kanban Workspace", "Access Recruitment Marketplace", "Abandon Squad", "Dissolve Squad", "Accept/Reject Join Signatures".
* **Backend API Dependencies:** `GET /api/auth/me`, `GET /api/teams/my-team`, `GET /api/registrations/my-registration`, `POST /api/teams/:id/leave`, `POST /api/teams/:id/dissolve`.
* **Database Dependencies:** `User`, `Team`, `Registration`, `ProblemStatement`.
* **Missing Features:** No quick switch between multiple registered hackathons; no activity log stream of what teammates completed.
* **Broken or Incomplete Behavior:** If a user is registered for multiple events, the dashboard strictly binds to `currentUser.teamId` without hackathon scoping.
* **Recommended Improvements:** Add a top event selector tabs bar: "My Active Missions: [CodeSrijan 2026] [AI Sprint 2026]".

---

### 2.2 Squad Operative Workspace (HUD)
* **URL:** `/workspace` (`src/routes/workspace.tsx`)
* **Intended Users:** Formed squad members and leaders.
* **Current Functionality:** Interactive project HUD:
  1. Overview cards: Locked Track, Connected Operatives (X/4), Mission Readiness Meter (0-100%).
  2. Kanban task board: Todo, In-Progress, Review, Completed tasks.
  3. Milestone tracker and repository links.
  4. "Request Mentor" SOS ticket trigger.
* **Important Controls & Actions:** "Create Task", drag/move task status, "Request Mentor (SOS)", "Deliver Final Payload" (links to submission modal).
* **Backend API Dependencies:** `GET /api/teams/my-team`, `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `POST /api/mentor-requests`.
* **Database Dependencies:** `Team`, `ProjectTask`, `MentorRequest`, `ProblemStatement`.
* **Missing Features:** No real-time task sync via WebSockets (updates require page refresh or poll); no GitHub webhook integration to auto-move tasks on pull request merge.
* **Broken or Incomplete Behavior:** If readiness score reaches 100%, submission is unlocked, but there is no warning if the submission deadline has already passed.
* **Recommended Improvements:** Implement live WebSocket broadcast for task movements; add a synchronized countdown timer directly inside the HUD.

---

### 2.3 Squad Recruitment Marketplace
* **URL:** `/recruitment` (`src/routes/recruitment.tsx`)
* **Intended Users:** Solo hackers looking for squads; squad leaders looking for operatives.
* **Current Functionality:** Public recruitment bazaar:
  1. "Operatives Seeking Squads" directory with skills, tech stack, and role tags.
  2. "Squads Seeking Operatives" directory with open positions (e.g. Backend, Frontend, UI/UX).
  3. "Post My Recruitment Profile" modal.
  4. "Invite to Squad" / "Request to Join Squad" actions.
* **Important Controls & Actions:** Search input, filter by skill (React, Python, Solidity, ML), "Send Invite", "Request to Join", "Create Squad" shortcut.
* **Backend API Dependencies:** `GET /api/recruitment`, `POST /api/recruitment`, `POST /api/team-invitations`, `POST /api/team-join-requests`.
* **Database Dependencies:** `RecruitmentProfile`, `Team`, `TeamInvitation`, `TeamJoinRequest`, `User`.
* **Missing Features:** No in-app chat button directly from profile card (must navigate to `/chat`); no filter for verified vs unverified college students.
* **Broken or Incomplete Behavior:** If a user already belongs to a full team (4/4 members), the UI still allows them to click "Request to Join", which fails only at the backend validation layer.
* **Recommended Improvements:** Hide or disable "Request to Join" dynamically if the student is already in a full squad; add an instant "Message Operative" CTA.

---

### 2.4 Payment & Fee Proof Submission
* **URL:** `/payment` (`src/routes/payment.tsx`)
* **Intended Users:** Registered competitors in paid-entry hackathons.
* **Current Functionality:** Renders organizer's configured UPI ID, payee name, and dynamic UPI QR code. Allows user to input 12-digit UPI UTR / Transaction Reference Number, drag-and-drop payment proof screenshot, upload image via GridFS, and view live review state (`payment_under_review`, `verified`, `rejected`).
* **Important Controls & Actions:** File upload drag-and-drop, UTR text field, "Submit Payment Proof" button, "Re-upload Proof" (if rejected).
* **Backend API Dependencies:** `POST /api/registrations/payment-proof`, `GET /api/registrations/my-registration`.
* **Database Dependencies:** `Registration` (specifically `transactionReference`, `paymentProofUrl`, `paymentStatus`, `reviewReason`).
* **Missing Features:** No automated payment gateway (Razorpay / Cashfree / Stripe); no automatic instant webhook verification; no invoice/receipt PDF download.
* **Broken or Incomplete Behavior:** If a user enters a transaction reference already submitted by another user, the backend returns a 409 conflict, but the error message is not rendered clearly on the input field.
* **Recommended Improvements:** Integrate a verified UPI payment gateway webhook for instant clearance while keeping manual QR upload as a zero-fee fallback.

---

### 2.5 Real-Time Comms Command Hub (Chat)
* **URL:** `/chat` (`src/routes/chat.tsx`)
* **Intended Users:** Students, Mentors, Admins.
* **Current Functionality:** Unified messaging interface:
  1. Channels: Squad Private Channel, Direct Messages with friends/mentors, General Broadcast Channel.
  2. Real-time message exchange via Socket.io.
  3. Unread badges and message history.
* **Important Controls & Actions:** Conversation selector, message input field, send button, emoji selector, user search.
* **Backend API Dependencies:** `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`, Socket.io `chat_message`.
* **Database Dependencies:** `Conversation`, `Message`, `User`.
* **Missing Features:** No file attachments (e.g. sharing code snippets, logs, screenshots); no voice channel or video call integration.
* **Broken or Incomplete Behavior:** If Socket.io reconnects after a network drop, unread message state is occasionally out of sync with MongoDB until a full refresh.
* **Recommended Improvements:** Add rich markdown formatting, syntax-highlighted code blocks, and an audio call room link.

---

### 2.6 Digital Certificates Vault
* **URL:** `/certificates` (`src/routes/certificates.tsx`)
* **Intended Users:** Event participants, winners, runner-ups.
* **Current Functionality:** Lists all certificates awarded to the logged-in student. Shows certificate preview with student name, hackathon title, achievement type (`participation`, `winner`), issue date, and "Download Certificate" action.
* **Important Controls & Actions:** "Download PNG / PDF", "Share to LinkedIn" button.
* **Backend API Dependencies:** `GET /api/certificates/my-certificates`, `GET /api/certificates/:id/download`.
* **Database Dependencies:** `Certificate`, `User`, `Hackathon`.
* **Missing Features:** No public verification URL (e.g., `/verify/CERT-12345`) allowing employers to verify authenticity without logging in.
* **Broken or Incomplete Behavior:** The download button generates a client-side Canvas render rather than a cryptographically signed PDF with a QR code.
* **Recommended Improvements:** Generate an immutable public certificate verification route with a signed cryptographic hash and QR code on the certificate.

---

## 3. Judge & Mentor Pages

### 3.1 Judge Evaluation Portal
* **URL:** `/evaluations` (`src/routes/evaluations.tsx`)
* **Intended Users:** Assigned judges (`role: 'judge'`, `admin`).
* **Current Functionality:** Lists submissions assigned to the judge. Displays project title, GitHub repository, live demo link, and video presentation. Renders scoring sliders/inputs for each configured criteria (e.g., Technical Complexity, Innovation, UI/UX, Completeness) from 0 to 100.
* **Important Controls & Actions:** Criteria scoring sliders, "Qualitative Feedback" text area, "Submit Evaluation" button, "Save Draft" button.
* **Backend API Dependencies:** `GET /api/evaluations/assigned`, `POST /api/evaluations`.
* **Database Dependencies:** `Evaluation`, `Submission`, `Team`, `EvaluationCriteria`.
* **Missing Features:** No blind judging mode (judge sees squad name, college, and member identities, introducing potential bias); no tie-breaking guidance.
* **Broken or Incomplete Behavior:** Once submitted, judges cannot edit their scores even if an accidental slider error occurred, unless an administrator manually intervenes in the database.
* **Recommended Improvements:** Add a "Blind Judging" toggle hiding college and team names during grading; allow judges to revise scores until the administrator locks evaluations.

---

### 3.2 Mentor SOS Command Desk
* **URL:** `/mentor` (`src/routes/mentor.tsx`)
* **Intended Users:** Event mentors (`role: 'mentor'`, `admin`).
* **Current Functionality:** Live queue of incoming squad SOS distress calls. Mentors view team name, problem statement, technical blocker description, and category.
* **Important Controls & Actions:** "Accept Request", "Attach Google Meet Link", "Mark Resolved", "Decline Request".
* **Backend API Dependencies:** `GET /api/mentor-requests/queue`, `PUT /api/mentor-requests/:id/accept`, `PUT /api/mentor-requests/:id/resolve`.
* **Database Dependencies:** `MentorRequest`, `Team`, `User`.
* **Missing Features:** No automated Google Meet link generation via Google Calendar API (mentors must manually paste a link); no rating system for mentor helpfulness.
* **Broken or Incomplete Behavior:** If multiple mentors click "Accept" simultaneously on the same ticket, a race condition can cause both mentors to believe they own the session.
* **Recommended Improvements:** Implement atomic MongoDB `findOneAndUpdate` with `{ status: 'pending' }` guard to prevent duplicate claims; integrate Google Meet automatic provisioning.

---

## 4. Administrative & Operations Pages

### 4.1 Executive Admin Dashboard
* **URL:** `/admin` (`src/routes/admin.index.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** High-level platform health deck: total registered hackers, total squads, revenue settled (₹), pending payment audit count, quick jump links to management modules.
* **Important Controls & Actions:** Quick links to Payments, Hackathons, Teams, Users, Logs, Operations.
* **Backend API Dependencies:** `GET /api/admin/metrics`, `GET /api/admin/health`.
* **Database Dependencies:** Aggregations on `User`, `Team`, `Registration`, `Submission`.
* **Missing Features:** No date range selector (e.g. Last 24 Hours, Last 7 Days); no multi-hackathon comparison.
* **Broken or Incomplete Behavior:** Large database scans on unindexed fields can introduce latency on Render Free tier if registrations exceed 5,000.
* **Recommended Improvements:** Cache administrative metrics in memory with a 60-second TTL.

---

### 4.2 Hackathon Wizard & Lifecycle Manager
* **URL:** `/admin/hackathons` & `/admin/hackathons/create` (`src/routes/admin.hackathons.tsx`, `src/routes/admin.hackathons.create.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** 5-step wizard to create events (Basic Info, Schedule Dates, Registration & Fee Settings, Problem Reveal Mode, Amenities). Lifecycle status transitions: `draft` -> `registration_open` -> `registration_closed` -> `active` -> `submission_open` -> `evaluation` -> `completed` -> `archived`.
* **Important Controls & Actions:** Status transition dropdown, date-time pickers, fee amount input, QR image upload, "Reveal Problems Immediately" button.
* **Backend API Dependencies:** `GET /api/hackathons`, `POST /api/hackathons`, `PUT /api/hackathons/:id`.
* **Database Dependencies:** `Hackathon`.
* **Missing Features:** No event duplication feature (cloning last year's event as a template); no multi-organizer assignment.
* **Broken or Incomplete Behavior:** Changing dates does not automatically recalculate submission phase gates unless manually synced via `/admin/operations`.
* **Recommended Improvements:** Add "Clone Hackathon" CTA; enforce strict date chronology validation on the frontend (End Date cannot precede Start Date).

---

### 4.3 Payment Audits & Financial Verification
* **URL:** `/admin/payments` (`src/routes/admin.payments.tsx`)
* **Intended Users:** Super-Administrators, Finance Leads.
* **Current Functionality:** Detailed payment audit table: displays student name, email, squad name, fee amount, transaction reference, uploaded slip thumbnail, and review actions.
* **Important Controls & Actions:** Slip image modal viewer, "Verify & Clear Payment" button, "Reject Payment" button with mandatory rejection reason modal, search by UTR, filter by status (`pending_proof`, `payment_under_review`, `verified`, `rejected`).
* **Backend API Dependencies:** `GET /api/admin/payments`, `POST /api/admin/payments/:id/verify`, `POST /api/admin/payments/:id/reject`.
* **Database Dependencies:** `Registration`, `User`, `Team`.
* **Missing Features:** No bulk approval action (must click verify one-by-one); no export to Excel/CSV for bank statement reconciliation; no refund execution ledger.
* **Broken or Incomplete Behavior:** Rejection triggers an email notification, but if the Google Apps Script relay is rate-limited, the UI reports success while the email silently drops.
* **Recommended Improvements:** Add bulk-action checkboxes ("Approve Selected (10)"); provide 1-click CSV export with transaction timestamps and reviewer names.

---

### 4.4 Squad & Team Governance Center
* **URL:** `/admin/teams` (`src/routes/admin.teams.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** Registry of all formed teams across hackathons. Displays Team Code, Leader, Member Count, Problem Statement, Submission Status, Bonus/Penalty points, and Disqualification state.
* **Important Controls & Actions:** Search by squad code, "Disqualify Squad" (DIQ), "Reinstate Squad", "Assign Bonus Points", "Assign Penalty Points", "Lock Team".
* **Backend API Dependencies:** `GET /api/admin/teams`, `PUT /api/admin/teams/:id/disqualify`, `PUT /api/admin/teams/:id/score-adjust`.
* **Database Dependencies:** `Team`, `User`, `ProblemStatement`.
* **Missing Features:** No mechanism to reassign a leader if a team leader abandons the squad; no squad merge tool for solo hackers.
* **Broken or Incomplete Behavior:** Disqualifying a squad marks `status: 'disqualified'`, but members still retain access to the chat room unless manually removed.
* **Recommended Improvements:** Automatically lock squad chat and workspace upon disqualification.

---

### 4.5 Problem Statement Management
* **URL:** `/admin/problems` (`src/routes/admin.problems.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** Catalog management: publish/unpublish problems, assign tracks (AI, Web3, Systems), configure difficulty (Beginner, Intermediate, Advanced), upload problem statement PDF or rubric.
* **Important Controls & Actions:** "Add Problem Statement", "Edit", "Toggle Publish", "Delete", "Upload PDF".
* **Backend API Dependencies:** `GET /api/admin/problems`, `POST /api/admin/problems`, `PUT /api/admin/problems/:id`, `DELETE /api/admin/problems/:id`.
* **Database Dependencies:** `ProblemStatement`, `Hackathon`.
* **Missing Features:** No track capacity limiter; no automated PDF text indexing for SrijanBot vector search.
* **Broken or Incomplete Behavior:** Unpublishing a problem does not alert teams that have already locked that track, leaving them in an undefined state.
* **Recommended Improvements:** If an admin unpublishes a problem, prompt them to broadcast a relocation notification to all affected teams.

---

### 4.6 Submissions Depository & Code Archive
* **URL:** `/admin/submissions` (`src/routes/admin.submissions.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** Central repository of all finalized student project deliverables: GitHub URLs, live deployment links, demo videos, slide decks, and project architecture summaries.
* **Important Controls & Actions:** Filter by track, filter by submission status (`submitted`, `locked`), "Inspect Payload", "Export All Submissions (JSON/CSV)".
* **Backend API Dependencies:** `GET /api/admin/submissions`.
* **Database Dependencies:** `Submission`, `Team`, `Project`.
* **Missing Features:** No automated repository clone / zip archiver; no automated GitHub commit check (e.g. verifying commits occurred during hackathon hours); no automated AI plagiarism detection.
* **Broken or Incomplete Behavior:** If a student inputs a private GitHub link without granting access, the submission displays as submitted, but judges cannot view the code.
* **Recommended Improvements:** Add a lightweight GitHub API check verifying repository visibility (public vs private) at the moment of submission.

---

### 4.7 Judge Roster & Rubric Scoring Management
* **URL:** `/admin/judges` & `/admin/evaluations` (`src/routes/admin.judges.tsx`, `src/routes/admin.evaluations.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** Assigns judges to specific hackathons, tracks, or teams. In `/admin/evaluations`, administrators can view aggregate scores, inspect each judge's individual score, check grading progress (e.g. "Judge Smith: 12/15 evaluated"), and export grades.
* **Important Controls & Actions:** "Assign Judge to Track", "Configure Rubric Criteria", "Inspect Individual Scorecard", "Export Grade Sheet".
* **Backend API Dependencies:** `GET /api/admin/judges`, `POST /api/admin/judges/assign`, `GET /api/admin/evaluations`.
* **Database Dependencies:** `User`, `Judge`, `JudgeAssignment`, `EvaluationCriteria`, `Evaluation`.
* **Missing Features:** No normalization formula (standardizing standard deviations between harsh and generous judges); no tie-breaking algorithm.
* **Broken or Incomplete Behavior:** If two judges grade the same team, their scores are averaged naively without weights.
* **Recommended Improvements:** Introduce z-score or min-max score normalization across judge panels.

---

### 4.8 Certificate Studio & Bulk Issuance
* **URL:** `/admin/certificates` (`src/routes/admin.certificates.tsx`)
* **Intended Users:** Super-Administrators.
* **Current Functionality:** Certificate issuance center. Allows administrators to upload a background certificate template image, position dynamic text variables (`{name}`, `{hackathon}`, `{date}`, `{type}`), generate certificates for all eligible participants, and issue them in bulk.
* **Important Controls & Actions:** Template image upload, variable positioning drag-and-drop, "Issue to All Verified Participants", "Issue Winner Certificates", "Revoke Certificate".
* **Backend API Dependencies:** `GET /api/admin/certificates`, `POST /api/admin/certificates/issue-bulk`, `DELETE /api/admin/certificates/:id`.
* **Database Dependencies:** `Certificate`, `Registration`, `User`.
* **Missing Features:** No automated generation of unique cryptographic QR codes on certificates; no bulk email dispatch with attached certificate PDFs.
* **Broken or Incomplete Behavior:** If a student changes their name in `/profile` after issuance, their certificate retains the old name unless manually regenerated.
* **Recommended Improvements:** Add a unique certificate verification serial number (e.g. `CS-2026-WIN-042`) and embed a verification QR code.

---

### 4.9 System Health Telemetry & Operations
* **URL:** `/admin/health` & `/admin/operations` (`src/routes/admin.health.tsx`, `src/routes/admin.operations.tsx`)
* **Intended Users:** Super-Administrators, DevOps Engineers.
* **Current Functionality:**
  1. `/admin/health`: Live telemetry of Node.js engine, heap memory, RSS memory, MongoDB readyState, GridFS storage committed bytes, Render uptime.
  2. `/admin/operations`: Phase-gate controls (Registration Deadline countdown, Submission Deadline countdown, Emergency Freeze button, Track Reveal switch).
* **Important Controls & Actions:** "Manual Sync Deadlines", "Emergency Freeze Submission Gate", "Reveal Problems Now".
* **Backend API Dependencies:** `GET /api/admin/health`, `POST /api/admin/operations/sync-deadlines`.
* **Database Dependencies:** `Setting`, `Hackathon`.
* **Missing Features:** No automated alert webhook (e.g. Discord or Telegram alert if Render crashes or MongoDB exceeds connection limits).
* **Broken or Incomplete Behavior:** Live telemetry relies on client-side polling every 10 seconds, which adds unnecessary requests to Render Free tier.
* **Recommended Improvements:** Change polling to 30-second interval with an exponential backoff on idle tabs.

---

## 5. Non-Existent Pages (Explicitly Audited)

The following expected hackathon platform pages **DO NOT EXIST** in the current repository:
1. `Organizer Registration Page` (e.g., `/organizer/signup`): **DOES NOT EXIST**.
2. `Independent Organizer Dashboard` (e.g., `/organizer/dashboard`): **DOES NOT EXIST**.
3. `Volunteer / Check-In QR Scanner` (e.g., `/checkin` or `/volunteer`): **DOES NOT EXIST**.
4. `Sponsor Representative Portal` (e.g., `/sponsor-portal`): **DOES NOT EXIST**.
5. `Public Certificate Verification Page` (e.g., `/verify/:certificateId`): **DOES NOT EXIST**.
6. `Dispute & Appeal Filing Portal` (e.g., `/appeals`): **DOES NOT EXIST**.
7. `Financial Ledger & Payout Settlement Console`: **DOES NOT EXIST**.

---

*Verified through direct route file analysis in `src/routes/`.*
