# CODESRIJAN — PAGE-BY-PAGE DETAILED AUDIT & MISSING-FEATURE ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-03` | **Audit Scope**: Complete 49 TanStack Routes  
**Perspective**: CTO, CPO, Senior UI/UX Architect, and Lead Product Manager  

---

## 1. Public Marketing & Event Discovery Surfaces

### 1.1 Homepage (`/` -> `src/routes/index.tsx`)
- **Allowed Roles**: All / Guest / Anonymous
- **Intended Purpose**: Primary marketing gateway, event discovery, platform value proposition, participant call-to-action.
- **Current Functionality**: Neo-brutalist hero section, headline "The student-driven competitive hackathon matrix", active hackathon teaser card (`CODESRIJAN 24-HOUR HACKATHON`), technological track badges, stats ticker, and floating SrijanBot.
- **Interactive Controls**: `REGISTER NOW` CTA, `Explore Parameters` buttons on tracks, `Admin Panel` button in navbar.
- **Backend Dependencies**: `GET /api/hackathons`.
- **What's Missing**:
  - No search bar to search hackathons by name, technology, or host college.
  - No filter for Online vs Offline vs Hybrid events.
  - No filter for Free vs Paid admission.
  - No distinction between Featured, Ongoing, Upcoming, and Completed/Archived hackathons.
  - The "99.98% UPTIME" and stats are hardcoded rather than dynamically queried from live database aggregates.
  - No organizer onboarding CTA (e.g. "Host a Hackathon on CodeSrijan").
- **What's Confusing**:
  - The navbar contains an "Admin Panel" button visible to anonymous visitors, tempting unauthorized clicks which lead to login redirects.
- **Risks & Vulnerabilities**:
  - Single active hackathon design makes the platform look like a one-off event website rather than a reusable hackathon ecosystem.
- **Priority**: **P1 (Essential)**
- **Recommended UX Overhaul**:
  - Transform homepage into a **Multi-Event Discovery Hub**: Search bar with autocompletion, category filter pills (`AI/ML`, `Web3`, `Systems`, `Open Innovation`), event status tabs (`Active Now`, `Upcoming`, `Past Winners`), and a prominent dual-CTA: `Join as Hacker` vs `Host a Hackathon`.

---

### 1.2 About Page (`/about` -> `src/routes/about.tsx`)
- **Allowed Roles**: All / Guest
- **Purpose**: Explain the platform architecture, mission, collegiate credibility, and zero-budget philosophy.
- **Current Functionality**: Displays CodeSrijan brand emblem, architecture explanation, and technical overview.
- **What's Missing**:
  - No team credits, collegiate advisory board, or contact directory.
  - No downloadable media kit or brand guidelines.
  - No link to organizer case studies or success metrics.
- **Priority**: **P3 (Future)**

---

### 1.3 Announcements Page (`/announcements` -> `src/routes/announcements.tsx`)
- **Allowed Roles**: All / Guest
- **Purpose**: Central bulletin board for platform alerts, urgent schedule changes, and event updates.
- **Current Functionality**: Displays announcements list with category filters (`ALL`, `GLOBAL`, `ARENA`, `PRIORITY`).
- **Interactive Controls**: Filter tabs.
- **Backend Dependencies**: `GET /api/announcements`.
- **What's Missing**:
  - Announcements are not scoped to specific hackathons; all bulletins appear in a single global feed.
  - No push-notification subscription toggle or RSS/Atom feed.
  - No search box within bulletins.
  - No "Acknowledge" button for mandatory safety or conduct bulletins.
- **Priority**: **P2 (Important)**

---

### 1.4 Sponsors Page (`/sponsors` -> `src/routes/sponsors.tsx`)
- **Allowed Roles**: All / Guest
- **Purpose**: Corporate partner showcase, sponsorship tier transparency, recruiter links.
- **Current Functionality**: Renders 5 corporate partner cards with SVG logos and external hyperlinks.
- **What's Missing**:
  - No "Become a Sponsor" prospectus download button or inquiry form.
  - No tier distinctions (Title, Platinum, Gold, Community, Cloud Partner).
  - No sponsor perks (API credits, job openings, recruiter links).
- **Priority**: **P2 (Important)**

---

### 1.5 Timeline Page (`/timeline` -> `src/routes/timeline.tsx`)
- **Allowed Roles**: All / Guest
- **Purpose**: Visual event milestones, stage countdowns, and schedule.
- **Current Functionality**: Displays timeline cards with Agenda vs Calendar grid view toggles.
- **What's Missing**:
  - The schedule displays a single event timeline. If multiple hackathons exist, their timelines collide.
  - No "Add to Google Calendar / iCal" export button.
  - No automatic timezone converter for international or remote participants.
- **Priority**: **P1 (Essential)**

---

### 1.6 Host an Event Page (`/host-event` -> `src/routes/host-event.tsx`)
- **Allowed Roles**: All / Guest
- **Purpose**: Organizer application and inquiry intake.
- **Current Functionality**: Form collecting organizer name, college, email, expected participant size, and dates.
- **Backend Dependencies**: `POST /api/host-requests`.
- **What's Missing**:
  - No status tracker for submitted applications (e.g. "Pending Review", "Approved").
  - No instant organizer workspace provisioning upon admin approval.
  - No pricing calculator or plan selection.
- **Priority**: **P1 (Essential)**

---

## 2. Authentication & Identity Surfaces

### 2.1 Login & Registration (`/login`, `/register`)
- **Current Functionality**: Form handling email, password, college, specialization. Firebase Auth with Express fallback.
- **What's Missing**:
  - No Google / GitHub OAuth one-click sign-in (critical for developers).
  - No "Remember Me" toggle.
  - Password strength meter is missing on registration.
- **What's Confusing**:
  - Error messages previously returned raw server errors; now resolved to neo-brutalist alert banners.
- **Priority**: **P1 (Essential)**

### 2.2 OTP Verification (`/auth/otp`)
- **Current Functionality**: 6 individual numeric inputs with automatic focus forwarding.
- **What's Missing**:
  - No fallback option if email delivery fails (e.g. WhatsApp/SMS OTP).
  - Resend cooldown timer resets on page refresh.
- **Priority**: **P2 (Important)**

---

## 3. Student Builder Cockpit Surfaces

### 3.1 Student Dashboard (`/dashboard` -> `src/routes/dashboard.tsx`)
- **Current Functionality**: Student HUD, active event card, countdown timer, payment status (`FEE DUE: ₹100` with yellow action button), active squad alliance card, quick comm links.
- **What's Missing**:
  - Only displays the *first* registered hackathon; does not support viewing multiple registered events.
  - No project submission quick-link directly on the dashboard when submission window opens.
  - No live notifications drawer or recent announcement cards.
- **Priority**: **P1 (Essential)**

### 3.2 Problem Statements Matrix (`/problems` -> `src/routes/problems.tsx`)
- **Current Functionality**: Track filter pills, classified problem lock state (`[CLASSIFIED SECURITY PROTOCOL // PENDING DIRECTORATE AUTHORIZATION]`), Directive Dossier modal.
- **What's Missing**:
  - No "Bookmark Problem" capability.
  - No indicator showing how many squads have chosen each problem (track popularity).
  - No submission upload button directly inside the problem dossier.
- **Priority**: **P1 (Essential)**

### 3.3 Squad Recruitment Marketplace (`/recruitment` -> `src/routes/recruitment.tsx`)
- **Current Functionality**: Three-tab layout (`FIND`, `JOIN`, `CREATE`), candidate search, Specialization Slotting bar, View Profile modal.
- **What's Missing**:
  - No squad invitation inbox where students can accept or decline pending squad invites.
  - Team creation allows picking arbitrary names without checking for duplicate names within the same hackathon.
  - No squad chat deep-link from the team card.
- **Priority**: **P1 (Essential)**

### 3.4 Official Certificates Matrix (`/certificates` -> `src/routes/certificates.tsx`)
- **Current Functionality**: Displays official verified certificates issued to the authenticated student, SHA-256 hash, and download button.
- **What's Missing**:
  - No public verification URL (e.g. `/verify-certificate?id=...`) that students can share on LinkedIn.
  - No "Add to LinkedIn Profile" 1-click button.
- **Priority**: **P1 (Essential)**

### 3.5 Project Workspace (`/workspace` -> `src/routes/workspace.tsx`)
- **Current Functionality**: Team task kanban board, submission repository link input, demo URL input, file uploaders.
- **What's Missing**:
  - No version history or submission receipt download.
  - Does not validate whether repository links are public (e.g. 404 on private GitHub repos).
  - No preview iframe for submitted live demo URLs.
- **Priority**: **P1 (Essential)**

---

## 4. Administrative Governance Surfaces

### 4.1 Admin Hackathons Directorate (`/admin/hackathons`)
- **Current Functionality**: Hackathon list, "+ CREATE HACKATHON" 5-Step Wizard with dedicated 1200x630 banner uploader and 500x500 UPI QR uploader.
- **What's Missing**:
  - No "Duplicate Event" button (forcing organizers to re-type tracks and rules for annual editions).
  - No "Draft vs Published" status toggle; creating a hackathon immediately makes it visible.
  - No multi-tenant filtering by organizing college/organization.
- **Priority**: **P1 (Essential)**

### 4.2 Admin Payments Reconciliation (`/admin/payments`)
- **Current Functionality**: Table of submitted payments, UPI reference ID, proof screenshot viewer, Approve and Reject buttons.
- **What's Missing**:
  - No CSV/Excel export of financial transactions for accounting reconciliation.
  - No duplicate transaction detection (a student could submit the same UPI UTR twice).
  - No recorded audit trail of *which* admin approved a payment.
  - No dispute resolution queue or partial refund tracking.
- **Priority**: **P0 (Critical Security & Finance)**

### 4.3 Admin Evaluations & Judging (`/admin/evaluations`)
- **Current Functionality**: Matrix of submitted projects, score cards, evaluation status.
- **What's Missing**:
  - No blind judging toggle (evaluators can see team and college names, introducing bias).
  - No normalization algorithm for harsh vs generous judges.
  - No tie-breaking protocol when two squads receive identical aggregate scores.
- **Priority**: **P1 (Essential)**

### 4.4 Admin Support & Helpdesk (`/admin/support`)
- **Current Functionality**: Global Discord-style ticket dispatch queue, thread conversation viewer, Close Ticket button.
- **What's Missing**:
  - No ticket assignment to specific staff/mentors.
  - No ticket priority tagging (`URGENT`, `SOS`, `GENERAL`).
  - No canned responses for common questions.
- **Priority**: **P2 (Important)**

