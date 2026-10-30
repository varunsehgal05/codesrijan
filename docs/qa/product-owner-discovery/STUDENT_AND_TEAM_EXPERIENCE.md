# CODESRIJAN — STUDENT AND TEAM EXPERIENCE AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal UX Architect & Product Manager  
**Scope:** Complete journey of a student hacker from initial discovery to certificate download, identifying user friction, multi-page fragmentation, and cognitive blockers.  

---

## 1. End-to-End Competitor Journey Walkthrough

```
[Discovery] -> [Registration & OTP] -> [Profile Setup] -> [Event Enrollment] -> [Squad Formation]
       │
       ▼
[Payment & Proof Upload] -> [Track Selection] -> [Kanban HUD] -> [Mentor SOS] -> [Submission] -> [Results]
```

### 1.1 Discovery & First-Time Onboarding
* **Flow:** A student visits `https://codesrijan-nine.vercel.app`, views the active hackathon ticker, reads the problem highlights under "Live Objective Matrices", and clicks "Start Building".
* **Friction Points:**
  - If the student registers via `/register`, they are asked for College, Branch, and Graduation Year upfront before their email is even verified.
  - The 6-digit OTP verification screen (`/auth/otp`) requires checking their email inbox. If their college spam filter delays the Google Apps Script email relay, the student waits up to 60-90 seconds.
* **Positive UX:** Once verified, the student is automatically authenticated and smoothly redirected to `/dashboard`.

---

### 1.2 Squad Formation & The "Multi-Page Disconnection" Problem
* **Critical Finding: Operational Fragmentation Across 4 Different Pages.**
  To complete a standard squad formation, a student is currently forced to navigate between four disconnected routes:
  1. `/dashboard`: Informs them they are in "LONE WOLF" status with an amber/red alert.
  2. `/recruitment`: Used to browse other solo hackers and find squad listings.
  3. `/team`: Used to manage internal team settings (name, leader transfer, member roster).
  4. `/workspace`: Used to access the actual Kanban tasks, track lock, and submission buttons.
* **User Confusion:** Students frequently ask: *"Why can I invite members on `/recruitment`, but I have to kick members on `/team`, and I have to view the roster on `/workspace`?"*
* **Architecture Fix Needed:** Consolidate Squad Management into a unified modal or cohesive tab inside `/workspace` or `/dashboard`.

---

### 1.3 Team Captain Permissions & Squad Governance
* **Squad Cap:** Enforced strictly at 4 members (`userTeam.members.length >= 4`).
* **Role Hierarchy:**
  - **Squad Leader (Captain):** Holds exclusive permission to:
    - Lock the squad's problem statement.
    - Accept or reject incoming join requests.
    - Kick members.
    - Submit the final project payload.
    - Dissolve the squad.
  - **Operatives (Members):** Can view the workspace, create/move Kanban tasks, and chat in the squad channel. They cannot lock tracks or submit payloads.
* **Missing Safety Mechanism:** If a squad leader goes AFK (inactive) during a 24-hour hackathon, there is **no automatic or member-driven vote to reassign leadership**. The remaining 3 members are blocked from submitting their final project payload unless they abandon the squad or contact a super-admin.

---

### 1.4 Solo vs Squad Participation Friction
* **Current UI Behavior:** When a solo participant registers for a hackathon supporting both solo and team formats, the dashboard immediately triggers a prominent red alert:
  > `LONE WOLF DETECTED: You have not joined a squad yet. You cannot access the project workspace or submit to the hackathon without a team.`
* **Cognitive Issue:** If an event permits solo participation (`participationType: 'both'`), treating a solo builder as an error state creates severe anxiety. Solo builders should be greeted with: *"Operating Solo: Ready to Deploy or Recruit"*.

---

### 1.5 Problem Selection & Track Locking
* **Workflow:** Leader visits `/problems`, filters by domain, opens a problem card, and clicks "Lock Track for Squad".
* **Guardrails:**
  - Once locked, the problem statement is bound to `Team.problemStatementId`.
  - The squad workspace reflects this choice with a green `LOCKED` badge.
  - Before final submission, the leader can switch tracks if they pivot.
  - After submission (`isSubmitted === true`), tracks are permanently frozen.
* **UX Friction:** If another squad locks the exact same track, there is no real-time notification or warning about competition density.

---

### 1.6 Final Project Submission Workflow
* **Submission Form:**
  1. Project Title & Short Description.
  2. Public GitHub Repository URL (Mandatory).
  3. Live Hosted Demo URL (Vercel, Netlify, Render, etc.).
  4. Video Demo Link (YouTube, Loom, Google Drive).
  5. Figma / Design Prototype URL (Optional).
  6. Presentation Deck / Slide URL (Google Slides, Pitch).
  7. AI Usage Disclosure & Future Scope notes.
* **Readiness Meter Sync:** The workspace includes a "Mission Readiness Meter" that increments from 0% to 100% as the squad completes tasks:
  - Squad Allocation: 25%
  - Track Locked: 25%
  - Payment Verified: 25%
  - Final Payload Delivered: 25%
* **Submission Friction:** If a team attempts to submit at 11:59 PM and their payment is still marked `payment_under_review`, the submission modal displays an error: *"Payment must be verified by admin prior to payload lock"*. If an admin is asleep or delayed, the student is unfairly blocked at the deadline!

---

### 1.7 Post-Submission, Results & Certificates
* **Deliberation Phase:** The squad workspace shows `PAYLOAD DELIVERED // SYSTEMS LOCKED`.
* **Results:** The live leaderboard publishes aggregate scores.
* **Certificate Vault:** Awarded certificates populate under `/certificates`. Students can download their certificate as an image.
* **Missing Closure:** There is no post-event retrospective page, no judge qualitative feedback summary presented to students (judge comments are hidden in `/evaluations` and not exposed to the student dashboard), and no feedback survey.

---

*Verified from student user testing and route inspections.*
