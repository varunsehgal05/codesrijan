# CODESRIJAN — USER ROLES & ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-04` | **Target Schema**: Multi-Tenant RBAC Matrix  
**Executive Author**: Senior Security Architect & Identity Governance Specialist  

---

## 1. Executive Summary & Identity Architecture
The current production codebase implements a coarse 4-role model (`student`, `admin`, `judge`, `mentor`) managed via `store.tsx` and Express JWT middleware. To support multi-college hackathons, corporate sponsors, independent organizers, and fair evaluations, CodeSrijan requires an 11-role granular hierarchy with strict multi-tenant boundary isolation.

---

## 2. Comprehensive 11-Role Operational Profiles

### 1. Guest (Unauthenticated Visitor)
- **Can See**: Public landing page, published hackathon overviews, public problem statements (when unembargoed), announcements, sponsor grid, timeline, rules, FAQ, and public winner galleries.
- **Can Create**: Self-registration account (`POST /api/auth/register`), organizer application (`POST /api/host-requests`).
- **Can Edit / Delete / Approve / Publish**: Strictly **NONE**.
- **Private Data**: Cannot view any participant emails, team rosters, draft submissions, or financial proofs.
- **Required Authorizations**: Captcha protection on registration to prevent bot account creation.

### 2. Student / Participant
- **Can See**: Student Dashboard HUD, active hackathon telemetry, challenge statements, recruitment marketplace, personal certificate vault, Discord support desk, public leaderboard.
- **Can Create**: Join requests to teams, support tickets, payment proof uploads, candidate recruitment profile.
- **Can Edit**: Personal profile (bio, GitHub, skills, college, graduation year).
- **Can Delete**: Personal join requests before acceptance.
- **Can Approve / Publish**: None.
- **Private Data**: Personal phone number, payment transaction ID, and private support messages are restricted to self and event administrators.

### 3. Team Leader (Squad Captain)
- **Inherits**: All Student / Participant capabilities.
- **Can See**: Squad invite tokens, pending join requests from free agents, project task board, repository submission fields.
- **Can Create**: Squad instance (`POST /api/teams`), invite links, project submission.
- **Can Edit**: Squad name, logo, repository URL, demo URL, presentation deck, problem statement selection.
- **Can Delete / Kick**: Disband squad (before registration deadline), kick non-performing members.
- **Can Approve**: Accept incoming join requests from candidate builders.
- **Can Publish**: Submit official project payload for judging.
- **Private Access**: Squad secret token, member emergency contacts.

### 4. Team Member
- **Inherits**: All Student / Participant capabilities.
- **Can See**: Squad workspace, assigned tasks, team chat room, submission status.
- **Can Create**: Project tasks, task comments, chat messages.
- **Can Edit**: Personal assigned tasks and task completion status.
- **Restrictions**: Cannot disband squad, kick teammates, change squad problem statement, or mutate final submission links without captain authorization.

### 5. Event Organizer
- **Scope**: Strictly isolated to assigned `hackathonId` and `organizationId`.
- **Can See**: Event dashboard, registered participants, squad roster, payment proof submissions, problem statement drafts, assigned judges, support tickets.
- **Can Create**: Event schedules, technological tracks, problem statements, rubrics, custom FAQs, event announcements.
- **Can Edit**: Event dates, banners, problem descriptions, participant status.
- **Can Approve**: Manual UPI payment receipts, team registrations, late submission exceptions.
- **Can Publish**: Problem statement release (manual or timed), event announcements, official results.
- **Strict Tenant Boundary**: **Cannot** view, edit, or approve events, payments, or participants belonging to other organizers.

### 6. Organization Administrator (Collegiate Society Head / Dean)
- **Scope**: Manages the overarching `Organization` entity (e.g. "ACM Student Chapter, IIT Delhi").
- **Can See**: All hackathons hosted by the organization, organization revenue, audit logs.
- **Can Create**: New hackathon instances under organization quota, invite staff organizers.
- **Can Edit**: Organization profile, verified college badges, bank/UPI payout information.
- **Can Approve / Revoke**: Organizer staff roles within their organization.

### 7. Judge (Evaluator)
- **Can See**: Assigned submissions, evaluation rubrics, criteria weighting schemas, blind project repos and demos.
- **Can Create**: Draft evaluation scores, feedback notes, criterion-by-criterion ratings.
- **Can Edit**: Draft scores until the evaluation window locks.
- **Can Approve / Publish**: Submit finalized evaluation scores (`POST /api/evaluations/:id/finalize`).
- **Private Isolation**: Cannot view other judges' real-time scores before publication; cannot view participant names or colleges if Blind Judging is enabled.

### 8. Mentor
- **Can See**: Assigned hackathon tracks, active student help tickets, live SOS mentor requests, table numbers/channels.
- **Can Create**: Mentor advice logs, session summaries, resource links.
- **Can Edit**: Status of assigned mentor requests (`Claimed`, `In Progress`, `Resolved`).
- **Restrictions**: Cannot score submissions, approve payments, or view confidential problem statements before embargo lift.

### 9. Moderator
- **Can See**: Chat messages, community discussions, reported users, offensive squad names.
- **Can Create**: Warning notices, moderation flags.
- **Can Edit**: Sanitize inappropriate team names or profile bios.
- **Can Delete**: Remove spam or abusive chat messages.
- **Can Approve**: Escalate severe infractions to platform administrators.

### 10. Volunteer / Event Staff
- **Scope**: Physical venue operations and logistics.
- **Can See**: Participant attendance list, check-in QR scanner, food/swag badge status, table allocations.
- **Can Create**: Check-in scan timestamps.
- **Restrictions**: Read-only access to participant profiles; zero access to financial accounts, problem creation, or judging scores.

### 11. CodeSrijan Super Admin (Platform Owner)
- **Scope**: Global system governance.
- **Can See**: Global platform telemetry, all organizations, all users, financial ledgers, audit logs, system health.
- **Can Create**: Platform-wide broadcasts, new organization authorizations.
- **Can Edit**: System configurations, maintenance modes, fee structures.
- **Can Delete / Suspend**: Suspend fraudulent organizations, ban abusive accounts platform-wide.
- **Audit Requirement**: Every super-admin override must be immutably recorded in `ActivityLog`.

---

## 3. Comprehensive Role-Permission Matrix

| Action / Capability | Guest | Student | Captain | Member | Organizer | Org Admin | Judge | Mentor | Mod | Staff | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse Public Events** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Register for Event** | No | Yes | Yes | Yes | No | No | No | No | No | No | No |
| **Create Team** | No | Yes | Yes | No | No | No | No | No | No | No | No |
| **Invite Teammates** | No | No | Yes | No | No | No | No | No | No | No | No |
| **Submit Project Repo** | No | No | Yes | No | No | No | No | No | No | No | No |
| **Upload Payment Proof**| No | Yes | Yes | No | No | No | No | No | No | No | No |
| **Verify / Approve Payment**| No | No | No | No | Yes | Yes | No | No | No | No | Yes |
| **Create Hackathon** | No | No | No | No | Yes | Yes | No | No | No | No | Yes |
| **Release Problems** | No | No | No | No | Yes | Yes | No | No | No | No | Yes |
| **Score Submissions** | No | No | No | No | No | No | Yes | No | No | No | Override |
| **Claim SOS Mentor Request**| No | No | No | No | No | No | No | Yes | No | No | Yes |
| **Scan Venue Check-In QR**| No | No | No | No | Yes | Yes | No | No | No | Yes | Yes |
| **Issue Certificates** | No | No | No | No | Yes | Yes | No | No | No | No | Yes |
| **Ban / DIQ Squad** | No | No | No | No | Yes | Yes | No | No | No | No | Yes |
| **Platform Config / Env**| No | No | No | No | No | No | No | No | No | No | Yes |

---

## 4. Multi-Tenant Event Isolation Protocol
To enforce strict boundary isolation between Organizer A and Organizer B:
1. **Schema Partitioning**: All events, registrations, teams, and submissions must contain an immutable `organizationId`.
2. **Middleware Verification (`requireEventOwnership`)**:
   ```javascript
   const event = await Hackathon.findById(req.params.hackathonId);
   if (req.user.role !== 'super_admin' && event.organizationId !== req.user.organizationId) {
       return res.status(403).json({ error: "Access Denied: You do not own this hackathon." });
   }
   ```
3. **URL Traversal Prevention**: Direct tampering with `hackathonId` in REST paths or TanStack router queries results in immediate 403 Forbidden rejection.

