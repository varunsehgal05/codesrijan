# CODESRIJAN — FULL SITE ARCHITECTURE, USER GUIDE & POINT-TO-POINT SYSTEM SPECIFICATION

**Live Web App**: [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Live Backend API**: [https://codesrijan-api.onrender.com/api](https://codesrijan-api.onrender.com/api)  
**Database**: MongoDB Atlas Cluster (`codesrijan`)  
**Design Aesthetic**: Neo-Brutalist High-Contrast Cyber Matrix (Stark Black `#000000`, Pure White `#FFFFFF`, Electric Blue `#0055FF`, Warning Amber `#FFB703`, Signal Red `#FF0055`, Neon Emerald `#00E676`)

---

## 1. Executive Summary & Core Platform Capabilities

CodeSrijan is a full-lifecycle hackathon operating platform and virtual matrix engineered for collegiate and open-source tech hackathons. The system supports both **Free** and **Paid Tournaments**, **Offline (In-Person)**, **Online (Virtual)**, and **Hybrid** arenas.

### Key Innovations Implemented:
1. **Interactive Hackathon Hosting Studio (`/host-event`)**:
   - Allows institutions, student chapters, and corporate sponsors to submit hackathons directly.
   - Built-in choice between **Free Entry** and **Paid Tournament** (custom fee in INR, fee basis per-squad or per-participant, official UPI ID, Payee Name, and UPI QR code attachment).
   - **Mode Selection**: Offline (In-Person), Online (Virtual), or Hybrid.
   - **Amenities & Perks Matrix**:
     - *Offline*: Free Meals & Midnight Fuel, Overnight Stay & Resting Dorms, Gigabit WiFi & LAN Drops, 24x7 Power Backup & Dedicated Workstations, Hardware & IoT Lab Access, Official Swag Kits, Unlimited Coffee & Energy Drinks, Physical Certificates & Trophies.
     - *Online*: Cloud Compute Credits ($500+ AWS/GCP/Azure), API Keys & Dev Licenses, 24/7 Discord/Slack Mentorship Mesh, Live Masterclasses & Workshops, Verifiable Digital Badges, Software Sponsor Perks & SaaS Licenses, Virtual Demo Day with VCs.
   - **Integrated Problem Statement Creator & Reveal Policy**:
     - Direct addition of challenges during hosting (Title, Domain Track, Difficulty, Description, Deliverables).
     - Reveal Modes: `Immediate`, `Manual Admin Broadcast`, or `At Competition Start`.
2. **Classified Problem Statement Release Protocol (`/problems` & `/admin/hackathons`)**:
   - When set to `Manual`, problem statements remain cryptographically hidden from participants until the Admin clicks **[REVEAL PS]**.
   - Students see a Neo-Brutal Level 5 Classified Security Protocol notice with animated radar grid.
   - Admins can reveal or re-hide problem statements at any time with one click, triggering automated real-time participant broadcast notifications.
3. **Universal Payment Audit & Re-Audit Engine (`/admin/payments`)**:
   - Solves the fixed-action limitation on payment cards and the Protected Payment Receipt Modal.
   - Admins can verify pending payments, reverse previous verifications into declines with a custom audit reason, clear previously declined payments, and edit audit notes at any time.
   - All state transitions automatically dispatch transactional emails via Gmail SMTP and push in-app notifications to team leaders.
4. **Targeted Maintenance Lockdown with Zero-Friction Admin Bypass (`/admin/settings`)**:
   - The System Button ("ENABLE MAINTENANCE LOCKDOWN" / "DISENGAGE LOCKDOWN") in Admin Settings puts the public site into lockdown.
   - **Normal Users & Public Visitors**: Intercepted by a Neo-Brutal Level 5 Maintenance Lockdown barrier explaining scheduled maintenance with a direct link to the Admin Login portal.
   - **Admins**: Granted complete, unrestricted access across all client pages and backend API routes, accompanied by a top neon warning bar indicating maintenance mode is active.

---

## 2. Point-to-Point Page Breakdown: How Every Page Works

### A. Public & Discovery Pages

#### 1. Home / Landing Page (`/`)
- **Audience**: Public, Students, Mentors, Sponsors.
- **How It Works**:
  - Displays high-impact Neo-Brutal hero banner with dynamic tagline and active hackathon status ticker.
  - Live countdown timer tracking the next impending hackathon deadline.
  - Active Hackathons Carousel displaying dates, total prize pools, registration modes (`ONLINE` / `OFFLINE`), and entry fee badges.
  - Corporate sponsor marquee featuring verified partners (HDFC, GitHub, AWS, Polygon, etc.).
  - Quick action buttons: `[JOIN HACKATHON]`, `[HOST AN EVENT]`, `[FIND SQUAD]`.

#### 2. Hackathons Directory (`/hackathons`)
- **Audience**: All users.
- **How It Works**:
  - Lists all upcoming, live, and completed hackathons.
  - **Badges**:
    - Mode: `ONLINE ARENA`, `OFFLINE ARENA`, or `HYBRID ARENA`.
    - Fee: `FREE ENTRY` (Green) or `PAID ₹XXX` (Amber).
    - Status: `REGISTRATIONS OPEN`, `HACKING IN PROGRESS`, or `CONCLUDED`.
  - **Amenities Preview**: Displays pill tags indicating provided perks (e.g. `Free Meals`, `Overnight Stay`, `Cloud Credits`).
  - **Problem Reveal Status**: Displays whether problem statements are already public or locked under classified protocol.
  - Direct link to enroll or view hackathon workspace.

#### 3. Hackathon Hosting Studio (`/host-event`)
- **Audience**: Organizers, Student Leads, Faculty Coordinators.
- **How It Works**:
  - Comprehensive Neo-Brutal hosting wizard with live preview.
  - **Event Core Details**: Event Name, Tagline, Host Institution/Chapter, Coordinator Email & Phone, Tentative Dates, Max Team Size.
  - **Format Mode Selector**: Switch between Offline, Online, and Hybrid. Entering an offline venue address is automatically prompted when offline/hybrid is selected.
  - **Amenities Tick Boxes**:
    - Automatically filters relevant amenities based on the selected mode (meals, dorms, WiFi, hardware lab for offline; cloud credits, API licenses, virtual demo day for online).
  - **Entry Model Selection**:
    - *Free Entry*: Zero-barrier registration.
    - *Paid Tournament*: Prompts for Fee (₹), Fee Basis (`Per Squad` or `Per Participant`), Official UPI ID, Payee Name, and UPI QR Code URL.
  - **Problem Statements Studio**:
    - Add multiple problem statements directly (Title, Track, Difficulty, Description, Requirements).
    - **Reveal Policy Selector**: Choose between `Immediate` (auto-publish upon creation), `Manual Admin Broadcast` (classified until admin triggers reveal), or `At Competition Start`.
  - On submission: Stores the hackathon in MongoDB, creates associated problem statements, sends in-app notifications to admins, and generates confirmation receipts.

#### 4. Problem Statement Matrix (`/problems`)
- **Audience**: Registered participants, Public.
- **How It Works**:
  - Searchable problem statement catalog filterable by Domain Track (AI/ML, Web3, FinTech, HealthTech, CyberSecurity, Open Innovation) and Difficulty (Beginner, Intermediate, Advanced).
  - **Classified Reveal Guard**: If a hackathon's problem statements have `problemRevealMode: 'manual'` and are not yet authorized by the Admin, the problems are withheld. The page renders the **Classified Security Protocol Notice**:
    - Animated radar grid with `🔒 PROBLEM STATEMENTS CLASSIFIED BY COMMAND`.
    - Real-time countdown to the organizer's target reveal schedule.
    - Operatives are advised to finalize team formation and workspace environment while waiting for command authorization.
  - Once revealed: Full title, description, constraints, and submission criteria are displayed with a `[SELECT FOR SQUAD]` button.

#### 5. Challenge Deep-Dive (`/challenge`)
- **Audience**: Participants.
- **How It Works**:
  - Detailed view of a specific selected problem statement.
  - Displays evaluation rubrics, judging criteria weightages (Innovation 30%, Tech Execution 30%, Impact 20%, Presentation 20%), reference architectures, sample datasets, and mentor contact points.

#### 6. Squad Recruitment Marketplace (`/recruitment`)
- **Audience**: Students looking for teammates or squads looking for members.
- **How It Works**:
  - Filter hackers by tech stack (React, Node, Python, Solidity, PyTorch, Figma, Rust, Flutter).
  - Filter by college, academic year, and preferred domain track.
  - One-click `[SEND SQUAD INVITE]` button triggering in-app and email notifications.
  - Squad creation modal allowing solo operatives to initialize a new squad and post an open recruitment listing.

#### 7. Timeline & Schedules (`/timeline`)
- **Audience**: All users.
- **How It Works**:
  - Chronological vertical milestone tracker showing current phase (Registration -> Team Formation -> Opening Ceremony -> Checkpoint 1 Mentoring -> Submission Deadline -> Pitch Round -> Grand Finale).

#### 8. Rules & Code of Conduct (`/rules`, `/code-of-conduct`)
- **Audience**: All users.
- **How It Works**:
  - Official rulebook: originality requirements, open-source licensing, anti-plagiarism guidelines, disqualification grounds, and harassment policies.

#### 9. Sponsors & Partners (`/sponsors`)
- **Audience**: Sponsors, Attendees.
- **How It Works**:
  - Tiered display of Title, Platinum, Gold, and Community sponsors with perks, job board links, and API documentation portals.

#### 10. Community & Gallery (`/community`, `/gallery`, `/highlights`)
- **Audience**: Public, Alumni.
- **How It Works**:
  - Photo reels, winning project archives, and community Discord/Telegram join links.

---

### B. Authentication & Onboarding

#### 11. Student Registration (`/register`)
- **How It Works**:
  - Form capturing: Full Name, Email, Password, University/College, Branch, Graduation Year, GitHub Profile, and LinkedIn.
  - On submit: Hashes password with bcrypt, creates user with `accountStatus: 'pending_verification'`, generates a secure 6-digit OTP, dispatches email via Gmail SMTP, and redirects to `/auth/otp`.

#### 12. 6-Digit Email OTP Verification (`/auth/otp`)
- **How It Works**:
  - Six discrete input blocks with automatic focus advancement, paste support, and URL parameter autofill (`?email=...&otp=...`).
  - Resend OTP button with a 60-second cooldown timer.
  - Built-in universal testing bypass (`123456`) allowing testing environments to proceed without third-party email delays.
  - On success: Activates account, issues JWT token in HTTP Bearer header / local storage, and redirects to `/dashboard`.

#### 13. Operative Login (`/login`)
- **How It Works**:
  - Email and password authentication.
  - If the user's account is `pending_verification`, intercepts login, re-sends a fresh OTP, and forwards user to `/auth/otp`.
  - Supports role-based automatic routing (`admin` -> `/admin`, `mentor` -> `/mentor-command-center`, `student` -> `/dashboard`).

#### 14. Admin Authentication Portal (`/admin-login`)
- **How It Works**:
  - Dedicated Neo-Brutal terminal styling with security warnings.
  - Validates credentials and verifies `role: 'admin'` or `role: 'judge'`.
  - Works even when the site is placed under Maintenance Mode lockdown.

#### 15. Password Recovery (`/auth/forgot-password`, `/auth/reset-password`)
- **How It Works**:
  - Generates single-use cryptographic recovery token with 1-hour expiry.
  - Dispatches recovery link to user's verified email.

---

### C. Student & Squad Execution Flow

#### 16. Hacker Dashboard (`/dashboard`)
- **How It Works**:
  - Operative status card with badge (Squad Leader, Operative, Solo).
  - Quick widgets: Registered Hackathon banner, Squad Roster with member avatars, Active Milestone countdown, Unread Announcements widget, and Quick SOS Support button.

#### 17. Hacker Central Workspace (`/workspace`)
- **How It Works**:
  - Complete squad mission control:
    - **Squad Roster**: Shows all members, roles (Leader/Member), contact email, and active status.
    - **Active Problem Statement Card**: Details the selected challenge, deliverables, and repo guidelines.
    - **Kanban Task Board**: Add, drag, and complete sprint tasks (`To Do`, `In Progress`, `Done`).
    - **Project Deliverables Module**:
      - GitHub Repository URL (must be public).
      - Live Demo URL / Vercel Link.
      - Figma / Architecture Diagram URL.
      - 2-Minute Demo Video (YouTube / Loom).
      - Project Description & Tech Stack Tags.
      - One-click `[SUBMIT FINAL PROJECT]` with lock-in confirmation modal.

#### 18. Squad Management (`/team`)
- **How It Works**:
  - View squad invite link (`/invite/:token`).
  - Leader controls: Invite teammate by email, promote member to Co-Leader, remove member, or disband squad.
  - Member controls: Leave squad (assigns new leader if leader leaves).

#### 19. Paid Tournament Checkout & Proof Submission (`/payment`)
- **How It Works**:
  - When a squad registers for a paid hackathon, the registration enters `paymentStatus: 'pending_proof'`.
  - The payment portal displays the calculated fee (Total = Fee x Squad Size or Flat Fee).
  - Renders Official UPI ID, Payee Name, and dynamic UPI QR Code.
  - **Submission Form**:
    - Operative inputs the 12-digit Bank Transaction Reference Number (UTR).
    - Uploads screenshot / PDF receipt of payment.
  - On submit: Status transitions to `payment_under_review`, and an immediate notification is dispatched to the Admin Payment Review Queue.

#### 20. Live Squad & Platform Chat (`/chat`)
- **How It Works**:
  - Real-time communication powered by Socket.IO.
  - Channels:
    - `#global-lounge`: General conversation across all participants.
    - `#squad-comms`: Private encrypted channel restricted to squad members.
    - `#mentor-hotline`: Direct channel for squad to request mentor intervention.
  - Full typing indicators, message delivery status, and code snippet formatting.

#### 21. SrijanBot AI Hackathon Assistant (`/ai-assistant`)
- **How It Works**:
  - Chat interface powered by Groq LLaMA 3.3.
  - Specialized system prompts trained on CodeSrijan rules, project ideation, tech stack selection, debugging advice, and presentation tips.
  - Robust heuristic fallback engine providing instant responses even if external AI quotas are exceeded.

#### 22. Digital Cryptographic Certificates (`/certificates`)
- **How It Works**:
  - Generates verifiable SVG/PDF certificates for participants, winners, and mentors.
  - Features unique SHA-256 certificate hash and verification QR code linking to `/certificates?id=...`.

---

### D. Admin Command Center (`/admin/*`)

#### 23. Executive Telemetry Overview (`/admin` / `admin.index.tsx`)
- **How It Works**:
  - Key performance indicators: Total Registered Users, Active Squads, Paid Registrations, Projects Submitted, Open Support Tickets.
  - Real-time event log stream tracking user signups, submissions, and payments.

#### 24. Hackathons Management (`/admin/hackathons`)
- **How It Works**:
  - Master list of all platform hackathons with status toggles (`draft`, `upcoming`, `ongoing`, `judging`, `completed`).
  - Format mode badges (`ONLINE`, `OFFLINE`, `HYBRID`) and fee badges (`FREE`, `PAID`).
  - **Instant Problem Statement Controls**:
    - **[REVEAL PS]** button: Instantly publishes problem statements to participants and broadcasts in-app announcements.
    - **[HIDE PS]** button: Relocks problem statements back into classified mode.
  - Direct links to Edit Event, View Registered Squads, and Create New Event (`/admin/hackathons/create`).

#### 25. Payment Audit & Verification Queue (`/admin/payments`)
- **How It Works**:
  - High-precision financial audit terminal designed for reviewing UPI payments and bank receipts.
  - **Filter Tabs**: `PENDING REVIEW`, `VERIFIED`, `REJECTED`, `AWAITING PROOF`, `ALL REGISTRATIONS`.
  - **Live Search**: Instant search by UTR, Squad Name, Team ID, or Leader Email.
  - **Re-Audit Capabilities (Fixed User Requirements)**:
    - **On Pending Cards**: Click `[VERIFY & CLEAR]` or `[DECLINE]`.
    - **On Verified Cards**: Click `[RE-AUDIT: DECLINE]` (opens audit note modal to specify reason) or `[EDIT AUDIT NOTE]`.
    - **On Rejected Cards**: Click `[RE-AUDIT: VERIFY & CLEAR]` to overturn a mistaken rejection.
  - **Protected Payment Receipt Modal (Image 1 Fix)**:
    - Clicking `[VIEW PROOF]` opens the official transaction voucher modal with raw payload inspector and visual receipt preview.
    - **Action Bar**:
      - If verified: `[RE-AUDIT: DECLINE PAYMENT]` and `[EDIT AUDIT NOTE]`.
      - If rejected: `[RE-AUDIT: VERIFY & CLEAR]` and `[EDIT REJECTION REASON]`.
      - If pending review: `[DECLINE PAYMENT]` and `[VERIFY & CLEAR]`.
  - Every action sends an automated confirmation email to the squad leader and updates their workspace registration badge in real-time.

#### 26. User Management & Operative Registry (`/admin/users`)
- **How It Works**:
  - Complete user directory with instant search and filter by role (`student`, `mentor`, `judge`, `admin`).
  - Actions: Promote role, ban user, activate account, reset password token, view assigned squad.

#### 27. Team Submissions & Point Adjustments (`/admin/teams`)
- **How It Works**:
  - Inspect squad deliverables: GitHub repository, demo video, presentation slides.
  - Disqualify squad for rule violations with mandatory reason, or restore disqualified squad.
  - Adjust squad points and assign custom bonus marks.

#### 28. Live Judging Matrix & Evaluations (`/admin/evaluations`, `/evaluations`)
- **How It Works**:
  - Multi-rubric scoring terminal: Innovation, Technical Complexity, Practical Impact, Presentation.
  - Real-time score aggregation across multiple judges with standard deviation and anomaly flags.

#### 29. Public Leaderboard Controls (`/admin/leaderboard`, `/leaderboard`)
- **How It Works**:
  - Toggle leaderboard visibility (`Hidden during hacking`, `Live Preliminary`, `Finalized Winners`).
  - Automated rank computation with manual override support for tie-breakers.

#### 30. Platform Settings & Maintenance Lockdown (`/admin/settings`)
- **How It Works**:
  - Global feature toggles: Allow New Registrations, Allow Submission Edits, Maintenance Mode.
  - **System Button (Maintenance Lockdown)**:
    - When switched ON: Sets `maintenanceMode = true` in MongoDB and in-memory server state.
    - **Impact on Normal Users / Public**:
      - Client-side: `MaintenanceGuard` in `__root.tsx` locks out all public and student routes with the **Level 5 Security Lockdown** screen.
      - Server-side: All `/api/*` endpoints (except auth and status) return HTTP 503 Service Unavailable to non-admin tokens.
    - **Impact on Admins**:
      - Client-side: Admins with valid session token bypass the lockout screen completely. A top neon warning bar is shown: `⚠️ SYSTEM NOTICE: PLATFORM IS CURRENTLY IN MAINTENANCE LOCKDOWN (ADMIN BYPASS ACTIVE)`.
      - Server-side: Admin requests pass straight through the middleware without interruption.

---

## 3. Database Schema Overview (MongoDB Atlas)

The platform is backed by 15 collections:
1. `User`: Operatives, authentication hashes, roles (`student`, `mentor`, `judge`, `admin`), account status.
2. `Hackathon`: Title, slug, description, mode (`offline`, `online`, `hybrid`), entryType (`free`, `paid`), fee, feeBasis, upiId, payeeName, amenities (`[String]`), problemRevealMode (`manual`, `immediate`, `at_start`), problemStatementsRevealed (`Boolean`), venue address, dates.
3. `ProblemStatement`: Challenge title, domain track, difficulty, prize, description, deliverables, `isPublished`, `isLocked`, linked `hackathonId`.
4. `Team`: Squad name, leader ID, members array, project title, submission links, verification status, points.
5. `Registration`: Participant-to-hackathon enrollment record, team ID, `paymentStatus` (`free`, `pending_proof`, `payment_under_review`, `verified`, `rejected`), paymentProofUrl, utrNumber, amountPaid, auditNote, verifiedAt, reviewedBy.
6. `Evaluation`: Judge scores across criteria, qualitative feedback, squad ID.
7. `Announcement`: Global broadcast notices, priority flags, target audience.
8. `Message`: Real-time chat messages, channel IDs, user references.
9. `SupportTicket`: SOS tickets, priority levels, resolution notes.
10. `Sponsor`: Partner profiles, tiers, website URLs, logos.
11. `Certificate`: Cryptographic verification hashes, recipient metadata.
12. `SystemSetting`: Key-value configuration parameters, including `maintenanceMode`.
13. `AuditLog`: Security audit trails for administrative actions.
14. `EmailVerification`: 6-digit OTP hashes, expiration timestamps.
15. `Session`: JWT tokens and active login sessions.

---

## 4. Complete Verification & Testing Record

- **Backend Test Suite**: `node --test server/test_admin_team_and_rejection.mjs`
  - Verified Admin Team Verification & Status Edit: PASSED.
  - Verified Admin Team General Edit: PASSED.
  - Verified Payment Rejection with Mandatory Reason & Email Dispatch: PASSED.
  - Verified Chat Message In-App Notifications: PASSED.
  - Verified Mark All Notifications Read: PASSED.
- **Frontend Production Build**: `npm run build`
  - All 66 routes compiled and bundled into production Nitro/Vite output with 0 errors.
