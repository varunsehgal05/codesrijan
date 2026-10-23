# CODESRIJAN — FULL SITE ARCHITECTURE & SYSTEM SPECIFICATION

**Live Web App**: [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Live Backend API**: [https://codesrijan-api.onrender.com/api](https://codesrijan-api.onrender.com/api)  
**Database**: MongoDB Atlas Cluster (`codesrijan`)  
**Design Theme**: Neo-Brutalist High-Contrast Cyber Matrix  

---

## 1. High-Level Architecture Overview

CodeSrijan is an end-to-end hackathon operating platform and virtual matrix designed for hackathon organizers, participants, mentors, and judges.

```
                           +-----------------------------------+
                           |        Client Web Application     |
                           |   (Vite + React 19 + TanStack)    |
                           |  https://codesrijan-nine.vercel.app|
                           +-----------------+-----------------+
                                             |
                          HTTPS REST / JWT   |  Socket.IO WSS
                                             v
                           +-----------------+-----------------+
                           |         Express 4 Backend         |
                           |   (Node.js + MongoDB + Socket)   |
                           |https://codesrijan-api.onrender.com|
                           +--------+-----------------+--------+
                                    |                 |
                   +----------------+                 +----------------+
                   v                                                   v
        +----------------------+                            +----------------------+
        |    MongoDB Atlas     |                            |   External Services  |
        | - Users              |                            | - Gmail SMTP (587)   |
        | - Teams & Hackathons |                            | - Groq AI (LLaMA 3.3)|
        | - Submissions        |                            | - Firebase Auth SDK  |
        | - Support Tickets    |                            +----------------------+
        +----------------------+
```

---

## 2. Complete Frontend Routes & Pages (TanStack Router)

The frontend contains **66 route components** organized across 7 functional portals:

### A. Public & Marketing Portal
| Route | Component | Purpose & Features |
|---|---|---|
| `/` | `index.tsx` | Main landing page. Features hero banner, active hackathon countdown, prize pool, sponsor wall, dynamic statistics ticker, announcements, and call-to-actions. |
| `/about` | `about.tsx` | Platform mission, core values, organizer details, and ecosystem vision. |
| `/timeline` | `timeline.tsx` | Live chronological hackathon milestones (Registration, Team Formation, Ideation, Checkpoints, Final Pitch). |
| `/rules` | `rules.tsx` | Participant rules, eligibility criteria, code of conduct, and submission requirements. |
| `/faq` | `faq.tsx` | Interactive searchable FAQ with category filters and brutalist accordion cards. |
| `/sponsors` | `sponsors.tsx` | Sponsor tiers (Title, Platinum, Gold, Silver, Community) with logos and website links. |
| `/gallery` | `gallery.tsx` | Visual gallery of past projects, winning squads, and hackathon highlights. |
| `/highlights` | `highlights.tsx` | Photo reels and media recap of events. |
| `/host-event` | `host-event.tsx` | Organizer application form to host an event on CodeSrijan (includes validation and mailto dispatch). |
| `/community` | `community.tsx` | Community channels, Discord/Telegram links, and open-source contribution links. |
| `/code-of-conduct`| `code-of-conduct.tsx` | Full participant code of conduct and anti-harassment policy. |
| `/privacy-policy` | `privacy-policy.tsx` | User data privacy and compliance disclosures. |

### B. Authentication & Identity Management
| Route | Component | Purpose & Features |
|---|---|---|
| `/login` | `login.tsx` | Operative authentication portal with email/password, JWT issuance, and pending verification interception. |
| `/register` | `register.tsx` | Student onboarding form capturing Name, Email, Password, College, Branch, and Academic Year. |
| `/auth/otp` | `auth.otp.tsx` | 6-digit email OTP verification with auto-fill from query parameters, re-transmit trigger, and universal 123456 bypass support. |
| `/auth/forgot-password` | `auth.forgot-password.tsx` | Password reset request form triggering secure recovery link generation. |
| `/auth/reset-password` | `auth.reset-password.tsx` | Secure password update interface using cryptographic token. |
| `/admin-login` | `admin-login.tsx` | Direct authentication portal reserved for administrators and judges. |

### C. Student & Squad Portal
| Route | Component | Purpose & Features |
|---|---|---|
| `/workspace` | `workspace.tsx` | Hacker central command center. Displays squad roster, active problem statement, repository links, submission module, and Kanban task tracking. |
| `/dashboard` | `dashboard.tsx` | Overview of registered hackathons, squad status, milestone deadlines, and announcements. |
| `/hackathons` | `hackathons.index.tsx` | Browse active, upcoming, and completed hackathons with eligibility details. |
| `/hackathons/:id/register` | `hackathons.$id.register.tsx` | Hackathon enrollment flow with pre-flight status verification (blocks enrollment if status is completed/closed). |
| `/problems` | `problems.tsx` | Problem statement marketplace with keyword search, domain filters (AI, Web3, FinTech, HealthTech), and difficulty badges. |
| `/challenge` | `challenge.tsx` | Deep dive into selected problem statement with evaluation criteria, constraints, and resources. |
| `/recruitment` | `recruitment.tsx` | Squad Builder & Teammate Marketplace. Allows creating a squad, searching for operatives by tech stack, and sending invites. |
| `/team` | `team.tsx` | Squad roster, member management, leave squad, and squad disband controls. |
| `/invite/:token` | `invite.$token.tsx` | One-click squad invitation acceptance interface. |
| `/certificates` | `certificates.tsx` | Digital cryptographic verification and download portal for participation and achievement certificates. |
| `/payment` | `payment.tsx` | Registration fee checkout and merchandise transaction interface. |

### D. Mentorship & Judging Portal
| Route | Component | Purpose & Features |
|---|---|---|
| `/mentor` | `mentor.tsx` | Mentor directory with bio, expertise, and schedule consultation booking. |
| `/mentor-command-center` | `mentor-command-center.tsx` | Assigned squad tracking and real-time guidance queue. |
| `/evaluations` | `evaluations.tsx` | Judge evaluation terminal. Features multi-criteria scoring rubrics (Innovation, Tech Execution, Impact, Presentation) and real-time score calculation. |

### E. Real-Time Communication & Assistance
| Route | Component | Purpose & Features |
|---|---|---|
| `/chat` | `chat.tsx` | Real-time messaging powered by Socket.IO for direct messaging and squad collaboration. |
| `/ai-assistant` | `ai-assistant.tsx` | SrijanBot conversational assistant powered by Groq LLaMA 3.3 with local heuristic fallback engine. |
| `/support` | `support.tsx` | SOS ticket submission and support dispatch queue. |
| `/announcements` | `announcements.tsx` | Live global broadcast notifications. |

### F. Profile & Configuration
| Route | Component | Purpose & Features |
|---|---|---|
| `/profile` | `profile.tsx` | User profile with editable bio, tech stack tags, assigned squad badge, and account status. |
| `/profile-overview` | `profile-overview.tsx` | Compact operative ID card preview. |
| `/settings` | `settings.tsx` | User preferences, notification controls, and session termination. |

### G. Admin Command Center (`/admin` layout)
| Route | Component | Purpose & Features |
|---|---|---|
| `/admin` | `admin.index.tsx` | Executive telemetry dashboard: total participants, active squads, submitted projects, open tickets, and activity timeline. |
| `/admin/hackathons` | `admin.hackathons.tsx` | Complete Hackathon CRUD (Title, status, dates, team size constraints). |
| `/admin/hackathons/create`| `admin.hackathons.create.tsx` | Multi-step wizard to launch a new hackathon. |
| `/admin/hackathons/:id` | `admin.hackathons.$id.tsx` | Event configuration and timeline editing. |
| `/admin/problems` | `admin.problems.tsx` | Problem statement management (publish, unpublish, modify prizes). |
| `/admin/problems/create` | `admin.problems.create.tsx` | Create and attach problem statements to hackathons. |
| `/admin/users` | `admin.users.tsx` | User registry with role promotion (Student/Mentor/Judge/Admin), status controls, and bulk actions. |
| `/admin/teams` | `admin.teams.tsx` | Squad registry, submission verification, team points adjustment, and disqualification/restoration controls. |
| `/admin/evaluations` | `admin.evaluations.tsx` | Live scoring matrix audit across all judges. |
| `/admin/leaderboard` | `admin.leaderboard.tsx` | Publish/unpublish leaderboard toggle, manual score overrides, and rank computations. |
| `/admin/announcements` | `admin.announcements.tsx` | Global announcement composer with target audience dispatch. |
| `/admin/sponsors` | `admin.sponsors.tsx` | Partner and sponsor CRUD. |
| `/admin/certificates` | `admin.certificates.tsx` | Batch certificate generator and cryptographic verification engine. |
| `/admin/support` | `admin.support.tsx` | Helpdesk ticket management with status triage and resolution logging. |
| `/admin/logs` | `admin.logs.tsx` | Real-time audit trail and system security event log viewer. |
| `/admin/settings` | `admin.settings.tsx` | Global platform flags, submission locks, and system parameters. |
| `/admin/judges` | `admin.judges.tsx` | Judge onboarding and category assignment. |
| `/admin/mentors` | `admin.mentors.tsx` | Mentor onboarding and squad assignment. |
| `/admin/analytics` | `admin.analytics.tsx` | Platform growth, submission rates, and attendance telemetry. |

---

## 3. Backend Endpoints & API Topology

All API routes are served under `/api` on `https://codesrijan-api.onrender.com/api`:

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Create student identity, issue 6-digit OTP, dispatch verification email.
- `POST /api/auth/verify-email`: Validate OTP (supports user OTP code or universal bypass `123456`), activate account, issue JWT session token.
- `POST /api/auth/resend-otp`: Generate fresh 6-digit OTP, dispatch via Gmail SMTP, return backup OTP.
- `POST /api/auth/login`: Authenticate email and password, verify accountStatus, issue JWT token.
- `POST /api/auth/forgot-password`: Generate recovery token and dispatch password reset link.
- `POST /api/auth/reset-password`: Validate recovery token and update password hash.
- `GET /api/auth/me`: Resolve current operative from Bearer JWT.

### Hackathons (`/api/hackathons`)
- `GET /api/hackathons`: Fetch all public hackathons.
- `GET /api/hackathons/:id`: Fetch single hackathon with problem statements and dates.
- `POST /api/hackathons/:id/register`: Enroll authenticated student into hackathon with validation check.

### Teams & Squads (`/api/teams`)
- `GET /api/teams`: Fetch squads list.
- `POST /api/teams`: Create new squad with leader, problem statement, and hackathon association.
- `POST /api/teams/:id/invite`: Send invitation to another student.
- `POST /api/teams/accept-invite/:inviteId`: Accept invitation and join team.
- `POST /api/teams/:id/leave`: Leave squad.
- `DELETE /api/teams/:id`: Disband squad (leader only).
- `POST /api/teams/:id/submit`: Submit final project (GitHub link, Figma URL, Demo video, Description).

### Problems (`/api/problems`)
- `GET /api/problems`: List all published problem statements.
- `GET /api/problems/:id`: Fetch single problem details.

### AI Assistant (`/api/ai/chat`)
- `POST /api/ai/chat`: SrijanBot conversational query with Groq LLaMA 3.3 and automatic heuristic fallback.

### Live Communication (`/api/chat` + Socket.IO)
- `GET /api/chat/messages`: Retrieve chat history.
- `POST /api/chat/messages`: Send direct or squad message.
- `Socket.IO Events`: `connection`, `authenticate`, `message`, `notification`, `team_update`.

### Support (`/api/support`)
- `GET /api/support`: List user support tickets.
- `POST /api/support`: File a new SOS ticket.

### Admin (`/api/admin/*`)
- `GET /api/admin/stats`: Aggregate telemetry.
- `GET/POST/PUT/DELETE /api/admin/hackathons`: Manage events.
- `GET/POST/PUT/DELETE /api/admin/problems`: Manage challenges.
- `GET/POST/PUT /api/admin/users`: Manage operatives and roles.
- `GET/PATCH /api/admin/teams`: Review submissions, disqualify, adjust points.
- `GET/POST /api/admin/announcements`: Dispatch broadcast announcements.
- `GET/POST /api/admin/sponsors`: Manage sponsor partners.
- `GET /api/admin/logs`: Audit trail logs.

---

## 4. Database Schema (MongoDB Atlas)

The database `codesrijan` contains 14 collections:
1. `users`: Operatives with `role` (student/judge/mentor/admin), `accountStatus` (active/pending_verification), tech stack, and assigned squad.
2. `emailverifications`: 6-digit OTP token hashes, expiration timestamps (15 minutes), and verification status.
3. `sessions`: Cryptographic session tokens and expiration.
4. `hackathons`: Event entities with registration start/end, status, team size limits, and themes.
5. `problems`: Problem statements with domain, difficulty, prizes, and requirements.
6. `teams`: Squad entities with members array, leaderId, hackathonId, problemId, and submission status.
7. `submissions`: Squad project deliverables (GitHub, Demo, Figma, Description).
8. `evaluations`: Judge scores across scoring criteria and feedback.
9. `announcements`: Global broadcasts with target audiences and pinned flags.
10. `messages`: Real-time chat messages between users and within squads.
11. `supporttickets`: Helpdesk tickets with status (open/in_progress/resolved) and priority.
12. `sponsors`: Partner records with logos, tiers, and URLs.
13. `certificates`: Cryptographic certificate hashes and recipient data.
14. `settings`: Global platform configuration parameters and feature flags.

---

## 5. Security & Authentication Matrix

| Role | Access Permissions |
|---|---|
| **Public / Anonymous** | Landing page, About, Rules, FAQ, Sponsors, Gallery, Highlights, Login, Register |
| **Student** | Workspace, Squad Builder, Team Chat, Problem Explorer, Hackathon Enrollment, Project Submission, Certificates, SOS Tickets |
| **Mentor** | Mentor Command Center, Assigned Squad Guidance, Direct Squad Chat |
| **Judge** | Evaluation Portal, Score Submissions, Judge Criteria Matrix |
| **Admin** | Full Platform Access, Telemetry, User Roles, Leaderboard Toggle, Disqualification, System Logs, Settings |
