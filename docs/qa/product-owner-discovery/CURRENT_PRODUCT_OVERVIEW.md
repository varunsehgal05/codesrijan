# CODESRIJAN — CURRENT PRODUCT OVERVIEW & ARCHITECTURAL FOUNDATION

**Executive CTO Assessment & Discovery Briefing**  
**Date:** October 30, 2026  
**Repository:** `interactive-showcase-main`  
**Deployment:** Production Frontend (`https://codesrijan-nine.vercel.app`), Production Backend API (`https://codesrijan-api-6tfr.onrender.com/api`)  
**Audience:** CodeSrijan Product Owner, Executive Leadership, Strategy & Architecture Review Team  

---

## 1. What is the Actual Purpose of the Existing Product?

CodeSrijan is an end-to-end, neo-brutalist competitive hackathon platform engineered to manage student hackathons on a strict zero-budget infrastructure ($0.00/mo operating cost across Vercel Hobby, Render Free, MongoDB Atlas M0, and Firebase Spark).

Its actual realized purpose today is:
1. **Single-Tenant Centralized Event Host**: It allows a single institutional team (the "CodeSrijan Administrator") to create, configure, publish, and govern an active collegiate hackathon (such as the 24-Hour flagship event).
2. **Student Competitor Arena**: Students register, authenticate via email OTP, recruit squad members, form teams of up to 4 operatives, select problem statements, access a Kanban project workspace (HUD), request live mentor sessions, submit final artifacts (GitHub repo, demo URL, presentation, documentation), and check live leaderboard rankings.
3. **Manual UPI QR Financial Gateway**: It processes hackathon registration fees (e.g. ₹100/team or ₹100/participant) by rendering an organizer's UPI ID / QR code, capturing student transaction reference IDs and payment screenshots, storing images in MongoDB GridFS, and queuing them for administrative audit and approval/rejection.
4. **Judging & Evaluation Portal**: Designated judges review submitted repositories, assign numerical scores across predefined criteria, provide written qualitative critique, and feed the live leaderboard.
5. **AI Platform Copilot (SrijanBot v2.4)**: An embedded AI assistant powered by Groq LLM (LLaMA-3.3-70B/8B) grounded in real-time MongoDB database queries (event dates, team counts, problem statements, leaderboard rankings).

---

## 2. Is It Currently Designed for One Administrator or Multiple Independent Organizers?

**Current State: Designed for ONE Global Platform Administrator.**

* **Source Code Evidence (`server/models/index.js`, `server/models/auth.js`)**:
  - The `User` model defines: `role: { type: String, enum: ['student', 'judge', 'mentor', 'admin'], default: 'student' }`.
  - There is **no `'organizer'` role** in the user schema.
  - The `admin` role is an omnipotent super-admin. An authenticated `admin` user has global unrestricted access to `/admin/*`, can view all users, modify all hackathons, approve/reject all payments, disqualify any team, and edit all problem statements.
* **No Multi-Tenant Isolation**: There is no concept of an `organizationId`, `tenantId`, or `eventOrganizerId` that scopes data. Every database query in `server/server.js` filters either globally or by `hackathonId`, and admin routes do not verify if an admin owns a specific hackathon.

---

## 3. Can External Colleges and Organizations Host Their Own Hackathons?

**Current State: NO, not autonomously.**

* There is a landing page route `/host` (`src/routes/host.tsx`) and an "Apply to Host" modal, but it functions merely as a static lead-generation form that emits a notification or stores a basic proposal.
* External college coordinators **cannot**:
  - Sign up as an independent organizer.
  - Log in to an isolated organizer dashboard.
  - Connect their own UPI ID or bank account for direct payouts without global admin intervention.
  - Isolate their student registrations, submissions, and judge roster from other college events.
* In the current architecture, if College X wants to host an event on CodeSrijan, the central CodeSrijan super-admin must manually create the hackathon on College X's behalf using `/admin/hackathons/create`.

---

## 4. Is Organizer Registration Implemented?

**Current State: NO.**

* The registration portal at `/register` (`src/routes/register.tsx`) only creates users with the default role `'student'`.
* Role assignment for `'judge'`, `'mentor'`, or `'admin'` is performed out-of-band by existing admins via `/admin/users` or through seed scripts (`server/seedData.js`, `server/create_admin.cjs`).
* There is no organizer onboarding flow, no organization profile collection (e.g., college affiliation, official accreditation, GST/PAN documents, authorization letters), and no organizer invitation mechanism.

---

## 5. Is Organizer Verification Implemented?

**Current State: NO.**

* Because organizer accounts do not exist in the schema, no organizer verification pipeline exists.
* There is no KYC (Know Your Customer), college email domain verification (`.ac.in` / `.edu`), institution approval workflow, or background-check state machine.

---

## 6. Can One Organization Have Multiple Administrators?

**Current State: NO (Architecturally flat).**

* The platform has only a global flat pool of administrators. If an organization has 5 staff members, all 5 must be granted global `'admin'` privileges.
* This means every administrator has full access to the entire platform—including all other events, financial receipts, system settings, database telemetry, and user management. There is no hierarchical role-based access control (RBAC) such as `Organization Owner`, `Event Lead`, `Event Manager`, `Finance Auditor`, or `Check-in Staff`.

---

## 7. Can Organizers Have Staff, Volunteers, and Moderators?

**Current State: NO.**

* The schema only supports `'student'`, `'judge'`, `'mentor'`, and `'admin'`.
* There are **no roles** for:
  - `Volunteer`: To scan QR codes at venue doors.
  - `Moderator`: To monitor team chat, public recruitment, and support tickets.
  - `Sponsor Rep`: To view team problem progress or resume books.
  - `Track Lead`: To oversee specific challenge categories.

---

## 8. Does Each Hackathon Have an Independent Workspace?

**Current State: PARTIALLY (Logical separation by `hackathonId`, but with single-active bias).**

* **Database Level**: `Team`, `Registration`, `Submission`, and `ProblemStatement` models all contain a `hackathonId` field.
* **Frontend Level**:
  - The student workspace (`/workspace`) queries `GET /api/teams/my-team` and `GET /api/hackathons/active`.
  - The UI heavily relies on the single **active** hackathon concept (`/api/hackathons/active`). If two hackathons are active simultaneously, the navigation and dashboard default to whichever hackathon is marked active by the administrator.
  - Competitor chat (`/chat`) and support tickets are organized into conversations, but team chat is bound to `teamId`, not strictly isolated by a hackathon context switcher.

---

## 9. Can Students Participate in Multiple Hackathons?

**Current State: YES at Database Level, but HIGH FRICTION at Frontend UI Level.**

* **Database Level**: The `Registration` schema enforces uniqueness on `{ hackathonId: 1, userId: 1 }` (`server/models/index.js#L165`). A student can register for Hackathon A and Hackathon B simultaneously.
* **Frontend Limitation**:
  - The `User` model has a convenience field `teamId: String`. When a student joins a team, `currentUser.teamId` is updated.
  - Many UI components (such as the Dashboard and Top Navbar links) check `currentUser.teamId` without checking which hackathon that team belongs to.
  - If a student leads Team Alpha in Hackathon 1 and joins Team Beta in Hackathon 2, the UI encounters state collisions unless the user actively leaves or switches contexts.

---

## 10. Summary of Existing Product Limitations

| Dimension | Implemented & Working | Missing / Critical Limitation |
| :--- | :--- | :--- |
| **Multi-Tenancy** | Single global database with `hackathonId` indexing | No multi-tenant data isolation, no organizer accounts, no organization branding isolation |
| **Authentication** | Email OTP with 6-digit verification code, JWT session cookies | No social OAuth (GitHub, Google), no organizer registration, flat 4-role model |
| **Payments** | UPI ID + QR code rendering, screenshot upload, GridFS storage, Admin audit | Manual verification only; no automated webhook reconciliation, no refunds, no ledger, no payout system |
| **Team Management** | Team creation, join requests, invitations, Kanban HUD | Fixed team size (max 4 hardcoded in several UI routes), single-team UI state collision |
| **Submissions** | Multi-field payload (GitHub, live demo, video, presentation) | No commit history validation, no automated repo plagiarism check, no automated build checks |
| **Judging** | Numerical scoring by criteria, total aggregation, judge portal | No blind judging, no tie-breaking algorithm, no score normalization between strict and lenient judges |
| **Certification** | Admin manual certificate generation, student download | No public verification URL, no cryptographic signing, no automated bulk template population |
| **Infrastructure** | $0.00/mo operating cost, GridFS binary storage, Render backend, Vercel frontend | Render free spin-down (50s cold start), no automated daily DB backup cron |

---

*Verified from source repository `interactive-showcase-main` at commit `ee12bd2`.*
