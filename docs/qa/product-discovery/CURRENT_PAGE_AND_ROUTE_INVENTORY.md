# CODESRIJAN — COMPLETE PAGE & ROUTE INVENTORY
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Router**: TanStack Router (`src/routes/`) | **Total Discovered Routes**: 49  
**Document Code**: `DISCOVERY-DOC-02` | **Audit Date**: 2026-10-30  

---

## 1. Route Architecture Overview
The frontend architecture utilizes file-based routing orchestrated via `@tanstack/react-router`. Routes are partitioned into four operational tiers:
1. **Public Marketing & Informational Surfaces** (Accessible to all visitors)
2. **Identity & Authentication Handshake Surfaces** (Session establishment)
3. **Student / Builder Cockpit Surfaces** (Authenticated participants & teams)
4. **Administrative Governance Surfaces** (Restricted to platform directors)

---

## 2. Exhaustive Route Inventory Matrix

### Tier 1: Public Discovery & Informational Surfaces (12 Routes)

| # | Route URL | Source File | Authorized Roles | Primary Functionality & Interactive Elements | Dependent Backend APIs | Production Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 1 | `/` | `index.tsx` | All / Anonymous | Neo-brutalist landing page, Hero banner, Hackathon teaser, Track badges, SrijanBot trigger | `GET /api/hackathons` | **ACTIVE** |
| 2 | `/about` | `about.tsx` | All / Anonymous | Platform philosophy, zero-budget architecture, mission overview, brand emblem | Static content | **ACTIVE** |
| 3 | `/announcements` | `announcements.tsx` | All / Anonymous | Category-filtered bulletins (`ALL`, `GLOBAL`, `ARENA`, `PRIORITY`) | `GET /api/announcements` | **ACTIVE** |
| 4 | `/sponsors` | `sponsors.tsx` | All / Anonymous | Corporate partner showcases with SVG brand assets & partner links | `GET /api/sponsors` | **ACTIVE** |
| 5 | `/timeline` | `timeline.tsx` | All / Anonymous | Visual hackathon milestone pipeline, calendar & agenda view toggles | `GET /api/calendar-events` | **ACTIVE** |
| 6 | `/faq` | `faq.tsx` | All / Anonymous | Expandable accordion of frequent participant queries & rules | `GET /api/faqs` | **ACTIVE** |
| 7 | `/gallery` | `gallery.tsx` | All / Anonymous | Showcase of past hackathon project submissions and media | `GET /api/gallery` | **ACTIVE** |
| 8 | `/code-of-conduct`| `code-of-conduct.tsx`| All / Anonymous | Hackathon ethics, anti-harassment rules, and integrity policies | Static content | **ACTIVE** |
| 9 | `/privacy-policy` | `privacy-policy.tsx`| All / Anonymous | Data collection, usage, and privacy disclosure documentation | Static content | **ACTIVE** |
| 10| `/host-event` | `host-event.tsx` | All / Anonymous | Organizer lead capture and host-application submission form | `POST /api/host-requests` | **ACTIVE** |
| 11| `/community` | `community.tsx` | All / Anonymous | Student builder matrix showcase and community links | `GET /api/users` | **ACTIVE** |
| 12| `/highlights` | `highlights.tsx` | All / Anonymous | Curated project highlights, winner spotlights, and press reel | Static / Gallery | **ACTIVE** |

---

### Tier 2: Authentication & Identity Lifecycle Surfaces (7 Routes)

| # | Route URL | Source File | Access Control | Primary Action & Security Constraints | Dependent Backend APIs | Production Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 13| `/login` | `login.tsx` | Public / Guest | Email/password login form, Firebase client SDK fallback to JWT | `POST /api/auth/login` | **ACTIVE** |
| 14| `/register` | `register.tsx` | Public / Guest | Multi-field registration (Name, Email, College, Specialization) | `POST /api/auth/register`| **ACTIVE** |
| 15| `/auth/otp` | `auth.otp.tsx` | Pending Verification| 6-digit numeric OTP cell verification matrix with resend cooldown | `POST /api/auth/verify-email` | **ACTIVE** |
| 16| `/auth/forgot-password` | `auth.forgot-password.tsx` | Public / Guest | Password reset email dispatcher | `POST /api/auth/forgot-password` | **ACTIVE** |
| 17| `/auth/reset-password` | `auth.reset-password.tsx` | Public / Token | Secure password reset form validated via URL token | `POST /api/auth/reset-password` | **ACTIVE** |
| 18| `/invite/$token` | `invite.$token.tsx` | Authenticated | Automatic squad joining via cryptographically signed invitation link | `POST /api/teams/join-invite` | **ACTIVE** |
| 19| `/admin-login` | `admin-login.tsx` | Public / Admin | Dedicated administrator portal login surface | `POST /api/auth/login` | **ACTIVE** |

---

### Tier 3: Student Builder Cockpit & Workspace Surfaces (14 Routes)

| # | Route URL | Source File | Required Role | Primary Operational Capabilities | Dependent Backend APIs | Production Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 20| `/dashboard` | `dashboard.tsx` | Student (or Admin) | Operative workspace HUD, countdown timer, fee status, squad alliance | `GET /api/hackathons`, `GET /api/auth/me` | **ACTIVE** |
| 21| `/problems` | `problems.tsx` | Student / All | Technological track filter bar, classified problem lock, dossier modal | `GET /api/problems` | **ACTIVE** |
| 22| `/challenge` | `challenge.tsx` | Student | Focused single problem statement operational specifications | `GET /api/problems/:id` | **ACTIVE** |
| 23| `/recruitment` | `recruitment.tsx` | Student | Squad Builder (Find/Join/Create tabs), Specialization slotting bar | `GET /api/teams`, `GET /api/users` | **ACTIVE** |
| 24| `/certificates` | `certificates.tsx` | Student | Official Certificate Matrix, verified SHA-256 signatures, PDF downloads | `GET /api/certificates` | **ACTIVE** |
| 25| `/support` | `support.tsx` | Student | Discord Ticket Bot interface, real-time ticket threads, TALK TO ADMIN | `GET /api/support/tickets` | **ACTIVE** |
| 26| `/leaderboard` | `leaderboard.tsx` | Student / All | Arena standings matrix, verified rubric score breakdowns, search & filter | `GET /api/evaluations` | **ACTIVE** |
| 27| `/profile` | `profile.tsx` | Student | Builder dossier, skills badges, social links, college & year edit | `GET /api/users/profile` | **ACTIVE** |
| 28| `/profile-overview`| `profile-overview.tsx`| Student | Publicly viewable builder card with awards and team history | `GET /api/users/:id/profile` | **ACTIVE** |
| 29| `/team` | `team.tsx` | Student (In Team) | Team roster management, invite codes, member kick/leave controls | `GET /api/teams/:id` | **ACTIVE** |
| 30| `/workspace` | `workspace.tsx` | Student (In Team) | Collaborative project workspace, task kanban, repo submission uploader | `GET /api/teams/:id/tasks`, `POST /api/submissions` | **ACTIVE** |
| 31| `/payment` | `payment.tsx` | Student | Official event fee payment details, UPI QR code, payment proof upload | `POST /api/payments/proof` | **ACTIVE** |
| 32| `/chat` | `chat.tsx` | Student / Team | Real-time squad and administrative direct communication channel | Socket.io / `/api/conversations` | **ACTIVE** |
| 33| `/notifications`| `notifications.tsx`| Student | Notification history, category filtering, unread indicator | `GET /api/notifications` | **ACTIVE** |

---

### Tier 4: Role-Specific Specialized Surfaces (3 Routes)

| # | Route URL | Source File | Required Role | Functionality & Access Bounds | Dependent Backend APIs | Production Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 34| `/mentor` | `mentor.tsx` | Mentor / Admin | Mentor dashboard, active squad dispatch requests, table assistance queue | `GET /api/mentor/requests` | **ACTIVE** |
| 35| `/mentor-command-center` | `mentor-command-center.tsx` | Mentor / Admin | Live SOS mentor routing, emergency assistance dispatch terminal | `GET /api/mentor/sos` | **ACTIVE** |
| 36| `/evaluations` | `evaluations.tsx` | Judge / Admin | Judge evaluation matrix, assigned submission scoring rubrics, feedback notes | `GET /api/evaluations/assigned` | **ACTIVE** |

---

### Tier 5: Administrative Governance Surfaces (13 Routes)

| # | Route URL | Source File | Required Role | Administrative Authority & Governance Scope | Dependent Backend APIs | Production Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| 37| `/admin` | `admin.tsx` | Admin Strict | Governance layout wrapper, sidebar navigation, directorate header | Layout wrapper | **ACTIVE** |
| 38| `/admin/index` | `admin.index.tsx` | Admin Strict | Platform high-level analytics, active users, hackathons, open tickets | `GET /api/admin/stats` | **ACTIVE** |
| 39| `/admin/hackathons`| `admin.hackathons.tsx`| Admin Strict | Event lifecycle management, 5-Step Hackathon Wizard (Banner & QR upload) | `GET/POST /api/hackathons` | **ACTIVE** |
| 40| `/admin/users` | `admin.users.tsx` | Admin Strict | Global user registry, role mutation, ban/suspend accounts | `GET /api/users` | **ACTIVE** |
| 41| `/admin/teams` | `admin.teams.tsx` | Admin Strict | Global squad directorate, roster review, manual team modification | `GET /api/teams` | **ACTIVE** |
| 42| `/admin/problems` | `admin.problems.tsx` | Admin Strict | Challenge directive creation, track assignment, embargo scheduling | `GET/POST /api/problems` | **ACTIVE** |
| 43| `/admin/submissions`| `admin.submissions.tsx`| Admin Strict | Central project submission repository, code repository & demo link review | `GET /api/submissions` | **ACTIVE** |
| 44| `/admin/evaluations`| `admin.evaluations.tsx`| Admin Strict | Judging rubrics manager, score aggregation, tie-breaker override | `GET /api/evaluations` | **ACTIVE** |
| 45| `/admin/payments` | `admin.payments.tsx` | Admin Strict | UPI payment proof verification console, approve/reject transactions | `GET/PATCH /api/payments` | **ACTIVE** |
| 46| `/admin/support` | `admin.support.tsx` | Admin Strict | Central helpdesk dispatcher, ticket assignments, Discord thread management | `GET/PATCH /api/support` | **ACTIVE** |
| 47| `/admin/announcements`| `admin.announcements.tsx`| Admin Strict | System broadcast composer, targeted priority alert dispatch | `POST /api/announcements` | **ACTIVE** |
| 48| `/admin/certificates`| `admin.certificates.tsx`| Admin Strict | Official certificate file uploader, batch issuance, SHA-256 hash generation | `POST /api/certificates` | **ACTIVE** |
| 49| `/admin/logs` | `admin.logs.tsx` | Admin Strict | Security audit trails, IP tracking, administrative action log | `GET /api/admin/logs` | **ACTIVE** |

