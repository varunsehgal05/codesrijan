# CodeSrijan — End-to-End Student Journey Audit

**Audit Date:** 2026-10-23  
**Auditor:** Autonomous QA Engineering Team  
**Scope:** Brand-new visitor to fully active student, team leader, and teammate.  
**Tested Environments:**  
- Production Live: `https://codesrijan-nine.vercel.app`  
- Canonical API: `https://codesrijan-api-6tfr.onrender.com/api`  
- Isolated Automated In-Memory Harness: `server/test_audit_journeys.mjs`  

---

## 1. Journey Overview & Architecture

The CodeSrijan student journey spans 10 discrete workflow phases:
```
[Visitor Discovery] ──> [Registration & OTP] ──> [First Login & Profile]
                                                       │
                                                       ▼
[Workspace & Project] <── [Free/Paid Registration] <── [Team Creation & Invites]
          │
          ▼
[Chat & Support] ──> [Evaluations & Certificates] ──> [Logout & Session Seal]
```

All student mutations were tested against the canonical backend schema and isolated database to ensure zero production contamination while testing every control.

---

## 2. Step-by-Step Student Journey Audit

### Phase 1: Visitor Landing & Tournament Discovery
1. **Action:** Guest arrives at `https://codesrijan-nine.vercel.app/`.
2. **Observations:**
   - Hero section loads with high-contrast Neo-Brutalist typography ("CODESRIJAN").
   - Primary CTA reads "ENTER TOURNAMENT" with an energetic electric blue brutalist border.
   - Public statistics fetch live data from `GET /api/public/stats` (showing 25 hackers, 11 registrations across 10 institutions).
   - Zero test hackathons leak into the homepage carousel.
3. **Evidence:** Browser screenshot `homepage_desktop_1792720408295.png`.
4. **Verdict:** **PASS**.

---

### Phase 2: New-User Registration (`/register`)
1. **Action:** Navigate to `/register` as a new collegiate participant.
2. **Form Inspection:**
   - Required fields: Full Name, College Email, Password (min 8 chars), College Name, Branch, and Academic Year.
   - Client form includes helper indicators and validation tooltips.
3. **Execution & Bug Remediation (`BUG-AUTH-001`):**
   - *Discovery:* When testing malformed emails (e.g., `not-an-email`), the backend initially accepted the input because it lacked an email format regex validator.
   - *Fix Applied:* Implemented strict regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` in `server/server.js`.
   - *Retest:* Malformed emails are rejected with HTTP 400: `{"message":"Valid email address format is required."}`.
4. **Valid Submission:**
   - Account created with `accountStatus: 'pending_verification'`.
   - 6-digit verification passkey generated, hashed with bcrypt, and dispatched via Google Apps Script MailApp relay.
5. **Verdict:** **PASS (Remediated locally)**.

---

### Phase 3: Email Verification (`/auth/otp`)
1. **Action:** Redirected to `/auth/otp?userId=usr-...`.
2. **UX Inspection:**
   - 6 individual OTP input boxes with automatic cursor advance.
   - 60-second resend cooldown timer actively counts down.
   - Invalid OTP attempts increment the failed attempts counter.
   - 5 consecutive invalid attempts trigger a 10-minute lockout (HTTP 429).
3. **Verification:**
   - Submitting the valid code delivered to the user inbox returns HTTP 200: `{"message":"Identity matrix verified successfully."}`.
   - Replay protection verified: reusing the consumed code immediately returns HTTP 400.
4. **Verdict:** **PASS**.

---

### Phase 4: First Login & Dashboard Onboarding
1. **Action:** Student logs in at `/login`.
2. **Authentication Flow:**
   - Backend checks password hash and confirms `emailVerified === true` and `accountStatus === 'active'`.
   - JWT issued with 7-day expiry; stored in `localStorage` under key `codesrijan_auth_token`.
3. **Dashboard (`/dashboard`):**
   - Welcomes the student with customized badge.
   - Displays clean empty states: "NO SQUADS CURRENTLY ALIGNED", "NO ACTIVE TOURNAMENT REGISTRATIONS".
   - Directs user with primary action buttons: "FORM A SQUAD" and "DISCOVER TOURNAMENTS".
4. **Verdict:** **PASS**.

---

### Phase 5: Profile Completion & Settings
1. **Action:** Open `/profile` and update developer credentials.
2. **Fields Updated:**
   - Bio: "Competitive Full-Stack Operative"
   - Skills: `["React", "TypeScript", "Node.js", "Solidity"]`
   - GitHub: `https://github.com/student-a`
3. **Verification:**
   - Saved via `PUT /api/users/profile`.
   - `GET /api/auth/me` returns updated profile fields.
   - Role tampering test confirmed: sending `{ role: "admin" }` in the profile payload is ignored; role strictly remains `student`.
4. **Verdict:** **PASS**.

---

### Phase 6: Squad Formation & Invitations (`/team`)
1. **Action:** Student A creates squad "Alpha Squad" for tournament.
2. **Execution:**
   - Squad created with Student A as leader.
   - Status is `isLocked: false`.
3. **Invitation Flow:**
   - Student A enters Student B's identifier to dispatch an invitation.
   - Invitation created with status `pending`.
   - Student B receives in-app notification: *"You have been invited to join the squad (Alpha Squad)."*
   - Student B accepts invitation via `POST /api/teams/accept-invite/:inviteId`.
   - Student B is added to `team.memberIds`.
4. **Verdict:** **PASS**.

---

### Phase 7: Free Hackathon Tournament Registration
1. **Action:** Student registers for a free event (`entryType: "free"`).
2. **Execution:**
   - Submits solo or team registration to `POST /api/hackathons/:id/register`.
   - Backend sets `feeAmount: 0`, `paymentStatus: "not_required"`, and `status: "registered"`.
   - Verified immediately; tournament appears on `/dashboard` with green "REGISTERED" badge.
   - Duplicate registration returns HTTP 409: `{"message":"Duplicate record: This operative is already registered for this event."}`.
3. **Verdict:** **PASS**.

---

### Phase 8: Paid Hackathon & Payment Verification Lifecycle
1. **Action:** Squad leader registers Alpha Squad for paid tournament (₹150/participant).
2. **Backend Fee Calculation:**
   - Leader attempts to send `feeAmount: 1`.
   - Authoritative backend fee calculation overrides client value: `2 operatives * ₹150 = ₹300`.
   - Registration created with `status: "awaiting_payment_proof"` and `paymentStatus: "pending_proof"`.
   - Squad roster is locked (`isLocked: true`, `lockedForHackathonId: tournamentId`).
3. **Solo Registration Dependency Check (`BUG-TEAM-001` Remediation):**
   - *Discovery:* Inviting a teammate required them to register solo first, which previously left a ₹150 solo registration active beside the ₹300 team registration (total ₹450 demanded).
   - *Fix Applied:* Backend now automatically deletes/supersedes unverified placeholder solo registrations of roster members upon tournament registration.
   - *Retest Result:* Database confirms exactly 1 clean registration record for ₹300.
4. **Payment Proof Submission:**
   - Leader submits UTR `UTR-AUDIT-998877` and receipt screenshot.
   - Status updates to `payment_under_review`.
   - Rejection and retry tested: admin rejects with "Blurred screenshot", leader retries with fresh UTR, and admin approves.
   - Final status: `status: "registered"`, `paymentStatus: "verified"`.
5. **Verdict:** **PASS (Remediated locally)**.

---

### Phase 9: Workspace, Challenge & Deliverables (`/workspace`)
1. **Action:** Open `/workspace` for registered tournament.
2. **Interactions:**
   - Leader browses published problem statements and selects "Decentralized Identity Verification".
   - Squad creates milestone tasks (e.g. "Design UI Wireframes", "Build Smart Contracts").
   - Task completion toggles update workspace progress bars.
   - External links (GitHub repository URL and Live Demo URL) validated and saved.
3. **Verdict:** **PASS**.

---

### Phase 10: Communications, Support & Exit
1. **Real-Time Direct & Team Chat (`/chat`):**
   - Direct messaging between teammates verified.
   - Blank message validation tested: sending whitespace-only messages is rejected with HTTP 400 (`BUG-CHAT-001` fixed).
   - Cross-team room protection verified: students cannot join chat rooms of other squads.
2. **Support HQ (`/support`):**
   - Student creates support ticket: "WebSocket Reconnection issue".
   - Ticket persisted with matching conversation ID.
   - `BUG-SUPPORT-001` verified fixed: default priority no longer crashes on schema enum mismatch.
3. **AI Assistant (`/ai-assistant`):**
   - Student asks SrijanBot for submission rules; contextual assistance returned.
4. **Logout & Session Termination:**
   - Logout clears `localStorage` token.
   - Browser Back button attempts bounce back to `/login`.
5. **Verdict:** **PASS**.

---

## 3. Summary of Remediated Defects in Student Journey

| Bug ID | Component | Symptom | Fix Applied | Retest Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-AUTH-001** | `/api/auth/register` | Malformed emails accepted without regex validation | Added `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` check | **PASS** |
| **BUG-TEAM-001** | `/api/hackathons/:id/register` | Placeholder solo registrations left active beside team registrations | Added automatic cleanup of member solo placeholders | **PASS** |
| **BUG-CHAT-001** | `/api/conversations/:id/messages` | Blank whitespace messages accepted by server | Added string trim validation returning HTTP 400 | **PASS** |
| **BUG-SUPPORT-001** | `/api/support` | Fallback priority `'medium'` violated schema enum | Added `description` to schema & normalized priority | **PASS** |
