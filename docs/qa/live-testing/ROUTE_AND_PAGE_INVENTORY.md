# CODESRIJAN — ROUTE & PAGE INVENTORY
**Audit Date:** 2026-10-30T03:18:00Z  
**Primary Target:** `https://codesrijan-nine.vercel.app`  
**Router System:** TanStack Router (File-Based SSR Architecture)  

---

## 1. PUBLIC ROUTES INVENTORY

| Path | Component File | Auth Required | Purpose | Verified Status |
|---|---|---|---|---|
| `/` | `src/routes/index.tsx` | No | Landing Page, Hero, Matrix stats, Active event clock | **PASS** |
| `/about` | `src/routes/about.tsx` | No | Platform Manifesto, Mission, Official Insignia | **PASS** |
| `/announcements` | `src/routes/announcements.tsx` | No | Bulletins, Broadcasts, Filtering Tabs | **PASS** |
| `/sponsors` | `src/routes/sponsors.tsx` | No | Corporate Sponsor Grid, Verified SVG Logos | **PASS** |
| `/faq` | `src/routes/faq.tsx` | No | Knowledgebase, Rules, Platform Q&A | **PASS** |
| `/code-of-conduct` | `src/routes/code-of-conduct.tsx` | No | Operative Conduct & Ethical Rules | **PASS** |
| `/privacy-policy` | `src/routes/privacy-policy.tsx` | No | Data Privacy, Storage Policy | **PASS** |
| `/community` | `src/routes/community.tsx` | No | Builder Community Matrix | **PASS** |
| `/gallery` | `src/routes/gallery.tsx` | No | Event Showcase & Project Media | **PASS** |
| `/highlights` | `src/routes/highlights.tsx` | No | Competition Highlights & Archive | **PASS** |
| `/timeline` | `src/routes/timeline.tsx` | No | Platform Milestones & Season Roadmap | **PASS** |
| `/host-event` | `src/routes/host-event.tsx` | No | University & Organization Event Hosting | **PASS** |

---

## 2. AUTHENTICATION & ACCESS ROUTES

| Path | Component File | Auth State | Purpose | Verified Status |
|---|---|---|---|---|
| `/login` | `src/routes/login.tsx` | Anonymous Only | Builder Session Initialization | **PASS** |
| `/register` | `src/routes/register.tsx` | Anonymous Only | New Hacker Enlistment & Profile | **PASS** |
| `/admin-login` | `src/routes/admin-login.tsx` | Anonymous Only | Direct Administrator Gateway | **PASS** |
| `/auth/forgot-password` | `src/routes/auth.forgot-password.tsx` | Anonymous Only | Credential Recovery Dispatch | **PASS** |
| `/auth/reset-password` | `src/routes/auth.reset-password.tsx` | Anonymous Only | Password Reinitialization | **PASS** |
| `/auth/otp` | `src/routes/auth.otp.tsx` | Pre-Auth | Two-Factor Handshake Verification | **PASS** |

---

## 3. STUDENT & COMPETITOR CORE ROUTES

| Path | Component File | Auth Required | Role | Purpose | Verified Status |
|---|---|---|---|---|---|
| `/dashboard` | `src/routes/dashboard.tsx` | Yes | Student / User | Operative Home, Squad Status, HUD Links | **PASS** |
| `/hackathons` | `src/routes/hackathons.index.tsx` | Yes | Student / User | Hackathon Catalog & Arena Browser | **PASS** |
| `/hackathons/:id/register` | `src/routes/hackathons.$id.register.tsx` | Yes | Student / User | Event Enlistment & UPI Proof Flow | **PASS** |
| `/problems` | `src/routes/problems.tsx` | Yes | Student / User | Problem Directives, Track Filters | **PASS** |
| `/challenge` | `src/routes/challenge.tsx` | Yes | Student / User | Active Directive Briefing Terminal | **PASS** |
| `/recruitment` | `src/routes/recruitment.tsx` | Yes | Student / User | Squad Recruitment Marketplace & Search | **PASS** |
| `/team` | `src/routes/team.tsx` | Yes | Student / User | Active Squad Roster & Invite Controls | **PASS** |
| `/workspace` | `src/routes/workspace.tsx` | Yes | Student / User | Hackathon Build HUD & Mentor SOS Dispatch | **PASS** |
| `/certificates` | `src/routes/certificates.tsx` | Yes | Student / User | Official Certificate Matrix & Issuance | **PASS** |
| `/leaderboard` | `src/routes/leaderboard.tsx` | Yes | Student / User | Live Scores, Hackathon Selectors | **PASS** |
| `/payment` | `src/routes/payment.tsx` | Yes | Student / User | Payment Clearance & Transaction State | **PASS** |
| `/profile` | `src/routes/profile.tsx` | Yes | Student / User | Operative Dossier, Bio & Github Sync | **PASS** |
| `/settings` | `src/routes/settings.tsx` | Yes | Student / User | Account Preferences & Security Settings | **PASS** |
| `/notifications` | `src/routes/notifications.tsx` | Yes | Student / User | Category-Filtered System Bulletins | **PASS** |
| `/support` | `src/routes/support.tsx` | Yes | Student / User | Real-time Ticket Dispatch & Communications | **PASS** |
| `/chat` | `src/routes/chat.tsx` | Yes | Student / User | Squad & Support Live Comms Channel | **PASS** |
| `/ai-assistant` | `src/routes/ai-assistant.tsx` | Yes | Student / User | SrijanBot AI Copilot Assistance | **PASS** |

---

## 4. ROLE-RESTRICTED OPERATIONAL ROUTES

| Path | Component File | Authorized Role | Purpose | Verified Status |
|---|---|---|---|---|
| `/evaluations` | `src/routes/evaluations.tsx` | `judge`, `admin` | Rubric Evaluation & Scoring Matrix | **PASS** |
| `/mentor` | `src/routes/mentor.tsx` | `mentor`, `admin` | Mentor Roster & Mentorship Requests | **PASS** |
| `/mentor-command-center` | `src/routes/mentor-command-center.tsx` | `mentor`, `admin` | Real-time SOS Dispatch Response HUD | **PASS** |

---

## 5. ADMINISTRATIVE COMMAND ROUTES (`/admin/*`)

| Path | Component File | Authorized Role | Purpose | Verified Status |
|---|---|---|---|---|
| `/admin` | `src/routes/admin.index.tsx` | `admin` | Operational Overview & Metric Cards | **PASS** |
| `/admin/health` | `src/routes/admin.health.tsx` | `admin` | Zero-Budget Platform & DB Telemetry | **PASS** |
| `/admin/operations` | `src/routes/admin.operations.tsx` | `admin` | Maintenance Mode & Emergency Controls | **PASS** |
| `/admin/payments` | `src/routes/admin.payments.tsx` | `admin` | UPI Transaction Review & Proof Verification | **PASS** |
| `/admin/hackathons` | `src/routes/admin.hackathons.tsx` | `admin` | 5-Step Hackathon Wizard & Event Governance | **PASS** |
| `/admin/hackathons/create` | `src/routes/admin.hackathons.create.tsx`| `admin` | Direct Event Authoring Interface | **PASS** |
| `/admin/users` | `src/routes/admin.users.tsx` | `admin` | User Directory, Role Elevation & Ban Actions | **PASS** |
| `/admin/teams` | `src/routes/admin.teams.tsx` | `admin` | Global Team Governance & Disqualifications | **PASS** |
| `/admin/problems` | `src/routes/admin.problems.tsx` | `admin` | Problem Directive Repository & Release Controls| **PASS** |
| `/admin/submissions` | `src/routes/admin.submissions.tsx` | `admin` | Payload Inspection & Code Submissions | **PASS** |
| `/admin/judges` | `src/routes/admin.judges.tsx` | `admin` | Judge Accreditation & Track Allocation | **PASS** |
| `/admin/evaluations` | `src/routes/admin.evaluations.tsx` | `admin` | Score Review & Normalization Matrix | **PASS** |
| `/admin/mentors` | `src/routes/admin.mentors.tsx` | `admin` | Technical Mentor Roster Management | **PASS** |
| `/admin/announcements` | `src/routes/admin.announcements.tsx` | `admin` | Broadcast Dispatch Terminal | **PASS** |
| `/admin/leaderboard` | `src/routes/admin.leaderboard.tsx` | `admin` | Standings Freeze & Certification Release | **PASS** |
| `/admin/certificates` | `src/routes/admin.certificates.tsx` | `admin` | Bulk Certificate Issuance Console | **PASS** |
| `/admin/recruitment` | `src/routes/admin.recruitment.tsx` | `admin` | Marketplace Moderation & Bans | **PASS** |
| `/admin/support` | `src/routes/admin.support.tsx` | `admin` | Support Dispatch Directorate & Ticket Close | **PASS** |
| `/admin/sponsors` | `src/routes/admin.sponsors.tsx` | `admin` | Corporate Partner Asset Management | **PASS** |
| `/admin/logs` | `src/routes/admin.logs.tsx` | `admin` | Audit Trail & Event Telemetry | **PASS** |
| `/admin/settings` | `src/routes/admin.settings.tsx` | `admin` | Global Platform Configuration | **PASS** |

---

## 6. INVENTORY SUMMARY

- **Total Unique Application Routes:** 49
- **Public Unauthenticated Routes:** 12
- **Authentication Routes:** 6
- **Student Core Routes:** 17
- **Judge & Mentor Routes:** 3
- **Admin Governance Routes:** 21 (incl. subroutes)
