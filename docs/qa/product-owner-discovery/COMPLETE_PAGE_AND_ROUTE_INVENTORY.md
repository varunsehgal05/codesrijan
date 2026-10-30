# CODESRIJAN — COMPLETE PAGE AND ROUTE INVENTORY

**Discovery Date:** October 30, 2026  
**Router:** TanStack Router (`src/routes/`)  
**Total Route Files:** 71 Files  
**Target Environments:** Production Frontend (`codesrijan-nine.vercel.app`) / Local Dev (`localhost:5173`)  

---

## 1. Public & Marketing Routes (Unauthenticated / General Access)

| Route Path | File | Intended Users | Primary Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/` | `index.tsx` | All Visitors | Homepage, Hero banner, Live Objective Matrices, Active Event countdown ticker, Platform telemetry stats |
| `/about` | `about.tsx` | All Visitors | Mission statement, platform background, philosophy, zero-budget open-source architecture overview |
| `/hackathons` | `hackathons.index.tsx` | All Visitors | Directory of active, upcoming, and past hackathons with category filters and search |
| `/hackathons/$id/register` | `hackathons.$id.register.tsx` | Students | Event-specific enrollment flow (Solo vs Squad, college validation, payment notice) |
| `/problems` | `problems.tsx` | All Visitors / Students | Problem statement repository, track filtering (Web3, AI, Systems), detail drawer, squad lock |
| `/sponsors` | `sponsors.tsx` | All Visitors / Sponsors | Tiered sponsor directory (Alpha, Beta, Partner), perks breakdown, sponsorship inquiry CTA |
| `/leaderboard` | `leaderboard.tsx` | All Visitors / Competitors | Live leaderboard matrix, rank badges, score breakdown by criteria, podium celebration |
| `/announcements` | `announcements.tsx` | All Visitors / Students | Official directives, pinned bulletins, target audience filtering, timestamped logs |
| `/community` | `community.tsx` | All Visitors | Discord / Telegram community gateway, open-source contributor links, community guidelines |
| `/timeline` | `timeline.tsx` | All Visitors | Visual chronological roadmap of hackathon milestones, kickoff, deadlines, and closing ceremony |
| `/faq` | `faq.tsx` | All Visitors | Categorized frequently asked questions (Rules, Teams, Tech Stack, Eligibility, IP Rights) |
| `/code-of-conduct` | `code-of-conduct.tsx` | All Visitors | Ethics policy, zero-tolerance anti-harassment directive, sportsmanship rules, reporting channel |
| `/privacy-policy` | `privacy-policy.tsx` | All Visitors | Data protection policy, information collection disclosures, cookie usage, privacy terms |
| `/highlights` | `highlights.tsx` | All Visitors | Past event photo highlights, top project showcases, winner testimonials |
| `/gallery` | `gallery.tsx` | All Visitors | Photo archive from hackathon physical venues, workshop snapshots, mentor sessions |
| `/host-event` | `host-event.tsx` | Prospective Organizers | Proposal form for universities and communities seeking to host events on CodeSrijan |

---

## 2. Authentication & Onboarding Routes

| Route Path | File | Intended Users | Primary Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/login` | `login.tsx` | All Registered Users | Email & Password login, redirect to `/dashboard` or `/admin`, session cookie creation |
| `/register` | `register.tsx` | Prospective Students | Initial account creation (Name, Email, Password, College, Branch, Year), triggers OTP |
| `/admin-login` | `admin-login.tsx` | Administrators | Dedicated admin entry portal with security notice and direct route to `/admin` |
| `/auth/otp` | `auth.otp.tsx` | New Users | 6-digit email OTP verification screen, resend timer, account activation |
| `/auth/forgot-password` | `auth.forgot-password.tsx` | Locked Users | Trigger password reset email via Google Apps Script relay / Firebase |
| `/auth/reset-password` | `auth.reset-password.tsx` | Locked Users | Token-validated password change form |
| `/invite/$token` | `invite.$token.tsx` | Invited Students | One-click squad invitation acceptance / rejection screen via token |

---

## 3. Student & Competitor Routes (Protected: `student`, `admin`)

| Route Path | File | Intended Users | Primary Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/dashboard` | `dashboard.tsx` | Authenticated Users | Main operative command deck: hackathon status, squad designation, registration progress, HUD links |
| `/profile` | `profile.tsx` | Authenticated Users | Comprehensive portfolio: bio, GitHub, LinkedIn, skills, friend requests, squad history |
| `/profile-overview` | `profile-overview.tsx` | Authenticated Users | Compact public profile card modal/view for recruitment browsing |
| `/settings` | `settings.tsx` | Authenticated Users | Account settings: update bio, tech stack, avatar, notification preferences, reset password |
| `/workspace` | `workspace.tsx` | Squad Members | Team Kanban board (Todo/In-Progress/Review/Done), problem details, SOS mentor tickets |
| `/recruitment` | `recruitment.tsx` | Students | Squad matchmaking marketplace: browse looking-for-team hackers, post profile, invite to squad |
| `/team` | `team.tsx` | Squad Members | Dedicated team roster management, kick member, transfer leadership, leave squad, disband squad |
| `/payment` | `payment.tsx` | Registered Students | Upload payment proof screenshot, input UPI transaction reference, track audit review state |
| `/chat` | `chat.tsx` | Competitors / Mentors | Real-time messaging hub: Direct DMs, Squad channels, Mentor threads, Support channel |
| `/support` | `support.tsx` | Competitors | Ticketing desk: report technical blockers, submit SOS mentor request, check resolution logs |
| `/notifications` | `notifications.tsx` | Authenticated Users | Historical transmission feed: squad invites, payment updates, grading alerts, system bulletins |
| `/certificates` | `certificates.tsx` | Competitors | View and download awarded certificates of participation, winner, runner-up |
| `/ai-assistant` | `ai-assistant.tsx` | Competitors | Full-page SrijanBot conversational interface with verified MongoDB database telemetry grounding |
| `/challenge` | `challenge.tsx` | Competitors | Focused problem statement deep-dive, submission checklist, resource links |

---

## 4. Judge & Mentor Routes (Protected: `judge`, `mentor`, `admin`)

| Route Path | File | Intended Users | Primary Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/evaluations` | `evaluations.tsx` | Judges | Judge evaluation dashboard: browse assigned team submissions, grade criteria (0-100), submit notes |
| `/mentor` | `mentor.tsx` | Mentors | Mentor incoming dispatch desk: view squad SOS tickets, accept requests, attach Google Meet links |
| `/mentor-command-center`| `mentor-command-center.tsx`| Mentors | Real-time queue of squad queries, live availability status toggle, active sessions list |

---

## 5. Administrative & Governance Routes (Protected: `admin` Only)

| Route Path | File | Intended Users | Primary Purpose & Features |
| :--- | :--- | :--- | :--- |
| `/admin` | `admin.index.tsx` | Super-Admin | Executive overview: live hacker counts, revenue settled, pending audits, quick links |
| `/admin/hackathons` | `admin.hackathons.tsx` | Super-Admin | Hackathon lifecycle management: status transitions, schedule dates, fee settings, rules |
| `/admin/hackathons/create`| `admin.hackathons.create.tsx`| Super-Admin | 5-step wizard to create a new hackathon (Basics, Dates, Fee & UPI, Problem reveal mode) |
| `/admin/hackathons/$id` | `admin.hackathons.$id.tsx` | Super-Admin | Detailed hackathon edit screen: update banners, coordinators, amenities, rules |
| `/admin/operations` | `admin.operations.tsx` | Super-Admin | Real-time event operations cockpit: registration deadlines, submission phase gates, emergency controls |
| `/admin/payments` | `admin.payments.tsx` | Super-Admin | Payment audit console: inspect uploaded QR slips, verify transaction IDs, approve/reject |
| `/admin/teams` | `admin.teams.tsx` | Super-Admin | Global team registry: inspect squad rosters, search by code, disqualify teams, assign bonus/penalties |
| `/admin/users` | `admin.users.tsx` | Super-Admin | User administration: filter by role (student, judge, mentor, admin), ban/unban, promote roles |
| `/admin/problems` | `admin.problems.tsx` | Super-Admin | Problem statement repository manager: publish/unpublish, domain tagging, difficulty classification |
| `/admin/problems/create` | `admin.problems.create.tsx` | Super-Admin | Problem creator: title, domain, requirements, constraints, resources, PDF attachment |
| `/admin/problems/$id` | `admin.problems.$id.tsx` | Super-Admin | Problem statement editor and metadata inspector |
| `/admin/submissions` | `admin.submissions.tsx` | Super-Admin | Central submission depository: GitHub repo links, live demo URLs, video links, zip payloads |
| `/admin/evaluations` | `admin.evaluations.tsx` | Super-Admin | Judge scoring audit: view aggregate team scores, inspect individual judge rubrics, export grades |
| `/admin/judges` | `admin.judges.tsx` | Super-Admin | Judge roster manager: assign judges to hackathons/categories, inspect grading progress |
| `/admin/mentors` | `admin.mentors.tsx` | Super-Admin | Mentor management: track mentor response times, assign categories, manage mentor roster |
| `/admin/announcements` | `admin.announcements.tsx` | Super-Admin | Broadcast center: draft, schedule, pin, and dispatch announcements to target audiences |
| `/admin/certificates` | `admin.certificates.tsx` | Super-Admin | Certificate studio: upload templates, preview layouts, issue certificates to participants |
| `/admin/support` | `admin.support.tsx` | Super-Admin | Helpdesk command center: triage incoming tickets, reply to competitors, change ticket status |
| `/admin/leaderboard` | `admin.leaderboard.tsx` | Super-Admin | Leaderboard override controls: freeze leaderboard, publish finalized scores, toggle public view |
| `/admin/sponsors` | `admin.sponsors.tsx` | Super-Admin | Sponsor CRUD: add sponsor logos, tier designations, website links, contract amounts |
| `/admin/recruitment` | `admin.recruitment.tsx` | Super-Admin | Squad recruitment moderation: inspect looking-for-team listings, resolve squad disputes |
| `/admin/schedule` | `admin.schedule.tsx` | Super-Admin | Master event schedule builder: add timeline blocks, workshops, keynotes, mentor hours |
| `/admin/gallery` | `admin.gallery.tsx` | Super-Admin | Event media manager: upload venue photos, banner imagery, social highlights |
| `/admin/analytics` | `admin.analytics.tsx` | Super-Admin | Telemetry analytics: registration velocity, college distribution, submission rates |
| `/admin/logs` | `admin.logs.tsx` | Super-Admin | Immutable security audit log: inspect login events, role promotions, payment audits, team actions |
| `/admin/health` | `admin.health.tsx` | Super-Admin | Production system health telemetry: Render uptime, MongoDB readyState, GridFS memory, API latency |
| `/admin/settings` | `admin.settings.tsx` | Super-Admin | Global feature flags: maintenance mode, registration toggle, submission gate, email relay settings |

---

*Verified from source filesystem `interactive-showcase-main/src/routes`.*
