# Hackathon Platform Workflow & Gap Analysis

## Standard Hackathon Workflow (Industry Standard)
Leading platforms like Devpost, Dorahacks, and HackerEarth typically follow this user flow:

### 1. Discovery & Registration
- **User Profile Building**: Users create detailed profiles with skills, GitHub, LinkedIn, past projects, and portfolios.
- **Hackathon Discovery**: Browsing active, past, and upcoming hackathons.
- **Registration**: Applying to a specific hackathon, answering custom questionnaire/eligibility checks.

### 2. Team Formation & Recruitment
- **Finding Teammates**: Searching for hackers by skills or roles (e.g., UI/UX, Backend).
- **Team Creation & Invites**: Creating a team, generating invite links, or directly inviting users.
- **Join Requests**: Users requesting to join existing teams.

### 3. Build Phase & Mentorship
- **Problem Statement Selection**: Choosing the track or problem statement to tackle.
- **Task Management**: Simple kanban boards for the team.
- **Mentorship**: Booking 1-on-1 time slots with available mentors for guidance.
- **Announcements**: Receiving critical updates from organizers (e.g., "Submission deadline extended").

### 4. Project Submission
- **Drafting Submission**: Filling out the project details (Name, tagline, description, tech stack used).
- **Assets**: Uploading demo videos, presentation decks, screenshots, and source code links (GitHub).
- **Final Submission**: Locking in the project before the deadline.

### 5. Judging & Results
- **Evaluation**: Judges review submissions based on predefined criteria.
- **Public Voting**: Sometimes community voting is enabled.
- **Leaderboard & Prizes**: Winners announced, digital certificates and badges issued to profiles.

---

## What We Have Currently (CodeSrijan)
Based on the database models and architecture, CodeSrijan already has a solid foundation:
- **Authentication & Roles**: Student, Judge, Mentor, Admin.
- **Team Formation**: `Team`, `TeamInvitation`, `TeamJoinRequest`, and `RecruitmentProfile`.
- **Event Config**: `Hackathon`, `ProblemStatement`.
- **Workspace**: `Project`, `ProjectTask`, `Submission`.
- **Communication**: Chat system (`Conversation`, `Message`) and Support Tickets.
- **Admin**: E2E management of hackathons, judges, and users.

---

## What We Are Missing (Gaps in User Side)

To make the CodeSrijan user experience **fully complete** and match industry standards, we need to address these gaps:

### 1. Global Notifications System (Critical)
**Gap**: We have `TeamInvitation` and `TeamJoinRequest`, but there's no general `Notification` model.
**Need**: A bell icon in the navbar that notifies hackers when:
- Their join request is accepted/rejected.
- They receive a team invite.
- The admin posts a new global announcement.
- The hackathon evaluation phase starts.

### 2. Mentor Booking & Sessions (High Priority)
**Gap**: We have a "mentor" role, but no way for a team to request or book a mentor.
**Need**: A `MentorRequest` or `MentorBooking` model where teams can ask for help, and mentors can accept and provide a Google Meet link.

### 3. Public Voting / Gallery (Medium Priority)
**Gap**: Hackathons usually have a public project gallery where anyone can see what was built.
**Need**: A public `/gallery` route that displays all `submitted` projects once the hackathon ends.

### 4. Rich Submission Editor (Medium Priority)
**Gap**: The project submission form needs to support rich text (Markdown), multiple screenshots upload, and video embed (YouTube/Loom).

### 5. Leaderboard Automation (Low Priority)
**Gap**: Real-time updating leaderboard based on `Evaluation` scores, accessible publicly once evaluation is complete.

---

## Proposed Action Plan
1. **Implement E2E testing using Browser Subagent** to verify the core existing flow (Registration -> Team Creation -> Join Request -> Notifications -> Submission).
2. **Fix bugs** found during the E2E flow (specifically verifying if requests and existing notifications work).
3. **Build the Global Notification System** to handle team requests and announcements smoothly.
4. **Finalize the User Submission Flow** ensuring they can submit their problem statements successfully and it reflects on the Admin side.
