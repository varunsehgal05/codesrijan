# CODESRIJAN — STUDENT WORKFLOW VERIFICATION REPORT
**Environment**: Production (`https://codesrijan-nine.vercel.app`)  
**Persona**: Student Competitor (`student@codesrijan.com` / Vanguard Hacker)  
**Security Tier**: Student Role RBAC  
**Verification Date**: 2026-10-30  

---

## 1. Executive Summary
The Student Journey audit evaluates the complete lifecycle of a hackathon participant on the live CodeSrijan platform:
1. **Authentication & Session Handshake**: Token persistence in `codesrijan_auth_token`, role assignment `student`.
2. **Operative Workspace HUD**: Dashboard telemetry, active squad card, live countdown timer to hackathon submission window, payment proof indicator.
3. **Problem Statement Matrix**: Filter bar across technological tracks, classified directive security protocols, in-depth evaluation criteria.
4. **Squad Recruitment & Team Builder**: Find Squads, Join Squad via Token, Create Squad, Specialization Slotting bar, candidate profiles.
5. **Certificates Matrix**: Student credential vault displaying official issued certificates and tamper-proof verification hash.
6. **Support Helpdesk & Dispatcher**: Discord Ticket Bot channel, real-time messaging, emergency SOS dispatch.
7. **Global Leaderboard**: Live squad rankings, score breakdowns, pagination, and college standings.

---

## 2. Detailed Journey Test Results

### 2.1 Student Dashboard HUD (`/dashboard`)
- **Route**: `https://codesrijan-nine.vercel.app/dashboard`
- **Identity Display**: Shows `VANGUARD HACKER`, role badge `STUDENT`, and registered college `National Institute of Technology`.
- **Hackathon Telemetry Banner**: Displays event target `CODESRIJAN 24-HOUR HACKATHON`, fee status `FEE DUE: ₹100`, and real-time countdown timer (`20 DAYS : 19 HOURS : 19 MINS : 27 SECS`).
- **Payment Action**: Displays high-contrast yellow `COMPLETE PAYMENT (₹100) ->` button guiding the user to UPI QR payment submission.
- **Squad Status**: If member has a team, displays squad roster card. If unassigned, prompts recruitment marketplace access.
- **Evidence**: `docs/qa/live-testing/evidence/student/01_student_dashboard.png`
- **Result**: **PASS**

### 2.2 Problem Directives & Lifecycle Security (`/problems`)
- **Route**: `https://codesrijan-nine.vercel.app/problems`
- **Track Filters**: Top slotting bar with pills for `ALL`, `AI / ML`, `WEB3 / BLOCKCHAIN`, `SYSTEMS`, `FINTECH`.
- **Security Lifecycle State**: For active hackathons with embargoed problem statements, the platform correctly renders:
  ```
  [CLASSIFIED SECURITY PROTOCOL // PENDING DIRECTORATE AUTHORIZATION]
  THE ADMIN HAS NOT REVEALED THE PROBLEM STATEMENT YET.
  ```
  Students cannot access premature problem leaks, ensuring competitive integrity.
- **Revealed Statements**: When unlocked by the directorate, problem statements render full descriptions, constraints, input/output schemas, and evaluation weightings.
- **Evidence**: `docs/qa/live-testing/evidence/problem-statements/01_problems_track_filters.png`
- **Result**: **PASS**

### 2.3 Squad Recruitment Marketplace (`/recruitment`)
- **Route**: `https://codesrijan-nine.vercel.app/recruitment`
- **Tabbed Interface**:
  - `FIND`: Search candidate builders and available squads.
  - `JOIN`: Input squad invitation code to instantly link with an existing team.
  - `CREATE`: Initialize new squad (disabled if student already belongs to a registered squad).
- **Specialization Slotting Bar**: Quick-filtering badges for `ALL SLOTS`, `UI/UX DESIGN`, `FRONTEND`, `BACKEND`, `FULLSTACK`, `AI / ML`, `CYBERSECURITY`.
- **Profile Inspection**: Student candidate cards feature `View Profile` triggers opening the Builder Dossier with GitHub links, tech stack badges, and previous hackathon experience.
- **Evidence**: `docs/qa/live-testing/evidence/teams/01_squad_recruitment.png`
- **Result**: **PASS**

### 2.4 Official Certificates Matrix (`/certificates`)
- **Route**: `https://codesrijan-nine.vercel.app/certificates`
- **Header**: `OFFICIAL CERTIFICATE MATRIX` / `Tamper-Proof Credential Verification`.
- **Student View**: Replaced legacy auto-generator with the official Certificate Vault. Students view verified certificates issued directly by administrators for completed hackathons.
- **Verification Hash**: Each credential card displays an immutable SHA-256 verification signature and download button for high-resolution PDF/image credentials.
- **Evidence**: `docs/qa/live-testing/evidence/student/02_certificates_matrix.png`
- **Result**: **PASS**

### 2.5 Discord Ticket Bot & Helpdesk (`/support`)
- **Route**: `https://codesrijan-nine.vercel.app/support`
- **Header**: `# DISCORD TICKET BOT` (Bot Verified) / `Real-Time Helpdesk & Issue Channels`.
- **Interaction**:
  - `TALK TO ADMIN` action button triggers ticket creation modal.
  - Category selector supports `TECHNICAL_ASSISTANCE`, `MENTOR_SOS`, `PAYMENT_QUERY`, `TEAM_DISPUTE`.
  - Submitting ticket creates private thread between student squad and event administrators.
- **Evidence**: `docs/qa/live-testing/evidence/support-chat/01_support_transmissions.png`
- **Result**: **PASS**

### 2.6 Global Arena Leaderboard (`/leaderboard`)
- **Route**: `https://codesrijan-nine.vercel.app/leaderboard`
- **Standings Matrix**: Displays ranking (#1 through #N), squad name, college badge, aggregate rubric score, and project link.
- **Pagination**: Smooth client-side pagination supporting search filtering by squad name.
- **Evidence**: `docs/qa/live-testing/evidence/student/03_leaderboard.png`
- **Result**: **PASS**

---

## 3. Student Workflow Assessment Matrix

| Journey Step | Endpoint / Trigger | Expected Outcome | Actual Production State | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| Auth Handshake | `POST /api/auth/login` | Return Bearer JWT | Token stored in `localStorage` | **PASS** |
| HUD Telemetry | `GET /api/hackathons` | Load active event | Countdown timer active (20d remaining)| **PASS** |
| Problem Access | `GET /api/problems` | Embargoed or revealed | Classified security lock active | **PASS** |
| Team Recruitment| `GET /api/teams` | Roster of matching squads | Tabs active, slotting filters working | **PASS** |
| Credential Vault| `GET /api/certificates` | Display certificates | Certificate Matrix rendered cleanly | **PASS** |
| Helpdesk Ticket | Socket.io / REST | Real-time chat thread | Discord bot channel active | **PASS** |
| Arena Rankings | `GET /api/leaderboard` | Live ranking scores | Leaderboard loaded with verified teams | **PASS** |
