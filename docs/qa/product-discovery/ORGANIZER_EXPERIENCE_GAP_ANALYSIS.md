# CODESRIJAN — ORGANIZER EXPERIENCE & GOVERNANCE GAP ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-06` | **Target Persona**: Collegiate & Enterprise Hackathon Organizers  
**Executive Perspective**: Event Operations Lead, Platform Architect & Senior UX Researcher  

---

## 1. Executive Summary & Problem Statement
Currently, CodeSrijan provides a single central admin dashboard (`/admin/*`) rather than a dedicated **Organizer Experience**. To scale beyond internal hackathons into a multi-college platform, organizers must be empowered with self-serve onboarding, granular event controls, unified operational dashboards, and zero-leakage organizational boundaries.

---

## 2. Granular Journey Audit & Identified Gaps

### A. Organizer Onboarding & Identity Gaps

| Capability | Current Production State | Identified Gap | Severity | Recommended Solution |
| :--- | :--- | :--- | :---: | :--- |
| **Organizer Intake** | `/host-event` public lead form | Form inputs are saved to DB but lack an approval state machine | **HIGH** | Build Super-Admin approval queue in `/admin/host-requests` |
| **Organization Profile**| Non-existent | No persistent entity for "IIT Delhi ACM" or "GDG Noida" | **HIGH** | Create `Organization` model (`name`, `logo`, `college`, `website`, `admins`) |
| **Staff Delegation** | Only 1 global admin role | An organizer cannot invite volunteer staff with restricted permissions | **MEDIUM**| Implement Organization Staff invites with scoped roles |
| **Suspension Safety** | Manual MongoDB mutation | If an organizer runs a scam event, super-admins cannot freeze it in 1 click | **CRITICAL**| Add `SUSPEND_ORGANIZER` switch that halts event publishing |

---

### B. Event Creation Wizard Audit (`admin.hackathons.tsx`)

#### Step 1: Basic Event Information
- **Current Functionality**: Event Name, Theme, Format (`ONLINE`, `HYBRID`, `OFFLINE`), Banner Upload (`1200x630`), Event Description.
- **Missing Options**:
  - Event Tagline / Short Pitch.
  - Event Slug / Custom Vanity URL (e.g. `codesrijan.com/e/hacknit-2026`).
  - Physical Venue Details (Google Maps location link, hall/building name for offline hackathons).
  - Organizer Co-hosts (collaborating student societies).

#### Step 2: Windows, Tracks & Rules
- **Current Functionality**: Registration Start/End, Submission Deadline, Tracks selection, Code of Conduct editor.
- **Missing Options**:
  - Problem Statement Reveal Datetime (currently tied ambiguously to event start).
  - Judging Window (Evaluation Start and Evaluation End).
  - Results Declaration Datetime.
  - Timezone Selector (defaults to UTC/IST without user override).

#### Step 3: Problem Statements & Evaluation Rubrics
- **Current Functionality**: Problem statement creation, track assignment, PDF rubric document upload (`Max 15MB`).
- **Missing Options**:
  - Multiple problem statements per track.
  - Custom criteria weights (e.g. Innovation 40%, Technical 40%, Design 20%).
  - Maximum team allocation per problem (preventing all 50 squads from picking the easiest challenge).

#### Step 4: Registration Policy & Payment Model
- **Current Functionality**: Free vs Paid toggle, Fee amount (e.g. ₹100), UPI ID, 500x500 UPI QR uploader, participant preview.
- **Missing Options**:
  - Maximum Participant / Team Capacity (hard stop when venue or cloud quota is full).
  - Team Size Bounds (enforcing min 2, max 4 members).
  - College / Domain Eligibility Restrictions (e.g. "Only open to students of AKTU universities" or whitelist domains `@iitd.ac.in`).
  - Custom Registration Questions (e.g. T-shirt size, dietary preferences, LinkedIn URL, resume upload).

#### Step 5: Review & Direct Launch
- **Current Functionality**: Summary card, `LAUNCH HACKATHON` button.
- **Missing Options**:
  - "Save as Draft" vs "Publish Live" (currently, launching is the only option, immediately making the event public).
  - Pre-flight Validation Checklist (flags missing banner, unconfigured dates, or empty tracks before launch).

---

### C. Organizer Command Center & Operational Telemetry

Currently, an organizer must navigate between five different pages (`/admin/hackathons`, `/admin/teams`, `/admin/payments`, `/admin/submissions`, `/admin/support`) to understand event progress.

#### Recommended Single-Screen Event Operations Cockpit:
1. **Header Health Bar**:
   - Event Status Badge: `REGISTRATION_ACTIVE`
   - Countdown to Registration Close: `04d : 12h : 18m`
   - Capacity Meter: `142 / 200 Teams Registered (71%)`
2. **Financial Pulse Widget**:
   - Total Collected: `₹14,200`
   - Verified Receipts: `128 (₹12,800)`
   - Pending Approvals: `14 (₹1,400)` [Direct link to verification queue]
3. **Squad Formation Telemetry**:
   - Complete 4-Person Squads: `98`
   - Incomplete Squads (2-3 members): `34`
   - Free Agents Seeking Teams: `46` [Trigger automated matchmaking broadcast]
4. **Live Submission Backlog**:
   - Submissions Received: `84 / 128 Active Teams (65%)`
   - Average Time to Deadline: `01h : 42m`
5. **Judging Pipeline Status**:
   - Assigned Submissions: `84`
   - Evaluations Completed: `52 (62%)`
   - Evaluations Pending: `32` [Alert judges with 1 click]
6. **Support Helpdesk Ticker**:
   - Open SOS Mentor Tickets: `3` (Average response time: 4.2 mins)
   - Unresolved Discord Tickets: `5`

---

## 3. Data Export & Operational Reporting Requirements
Organizers require instant one-click CSV and Excel exports:
- **Participant Roster Export**: Names, emails, phones, colleges, specializations, teams, and payment verification status.
- **Submission Dossier Export**: Squad name, leader contact, GitHub URL, live demo URL, video link, and final evaluation score.
- **Judging Summary Export**: Criterion-by-criterion breakdown per judge, judge feedback comments, and normalized rankings.
- **Financial Transaction Ledger**: UTR reference, payment date, participant name, reviewer admin ID, and verification timestamp.

