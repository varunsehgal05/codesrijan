# CodeSrijan Admin Panel Guide

Here is the complete list of every Admin page available in CodeSrijan, along with its specific use case, practical examples, and detailed explanations of how they connect to the user experience.

### 1. Dashboard (`/admin`)
* **Use:** The central command center providing high-level metrics and a bird's-eye view of platform activity.
* **Example:** You log in during a hackathon to quickly check how many users have registered today and how many support tickets are currently open.

### 2. Users Management (`/admin/users`)
* **Use:** View, search, filter, and manage all registered accounts on the platform (Students, Mentors, Judges, Admins).
* **Example:** A student emails you saying they lost access to their account. You use this page to find their profile and manually send a password reset, or to suspend an account that violates the code of conduct.
* **Workflow Details:** You can search for users, filter them by Role, and view **Active** versus **Suspended** users in separate tabs. If you edit a user and change their status to Suspended, they are instantly blocked from logging in.

### 3. Hackathons Management (`/admin/hackathons`)
* **Use:** Create new hackathon events, set their dates, define team size limits, and change their active status.
* **Example:** You are preparing for the "Spring 2026 Innovation Sprint". You create the event here, keep it as a "Draft" while finalizing details, and then change it to "Published/Active" when registration opens.
* **User Visibility:** Once an event is marked as "Published", it automatically appears on the public landing page (`/`), allowing students to read the details and click "Register Now".

### 4. Problems & Challenges (`/admin/problems`)
* **Use:** Define the specific problem statements, categories, and difficulty levels for active hackathons.
* **Example:** You create a new problem called "AI for Accessibility" (Medium difficulty) and assign it to the currently active hackathon so students can select it when forming their teams.
* **Button Breakdown:**
  * **Publish:** Makes the problem visible in the public `/problems` directory so students can read it and start brainstorming.
  * **Lock:** Prevents any new teams from selecting this problem (useful if too many teams are doing the same challenge and you want to force them to pick something else).
  * **Copy:** Duplicates the problem if you want to use a similar template for a different category without typing it all over again.

### 5. Teams Management (`/admin/teams`)
* **Use:** Monitor all created teams, their members, the problem they selected, and their current workspace progress.
* **Example:** A team requests to have a 5th member added, but the limit is 4. You can override and manually adjust their team roster from this page.
* **Future Workflows:** (Upcoming Sprint) Disqualifying a team will require a mandatory "Reason" box, which will automatically send an email/notification to all team members, moving them to a separate "Disqualified Teams" list where they can be un-disqualified if necessary.

### 6. Submissions (`/admin/submissions`)
* **Use:** Review all final project submissions (GitHub links, Figma files, Demo URLs).
* **Example:** The deadline has passed. You go here to "Lock" all submissions so students can no longer edit their draft links before judging begins.

### 7. Judges Management (`/admin/judges`)
* **Use:** Onboard judges and securely assign them to evaluate specific teams or specific problem statements.
* **Example:** You assign "Dr. Vikram" (a UI/UX expert) to evaluate 5 specific teams that chose the "Design Accessibility" problem track.

### 8. Evaluations (`/admin/evaluations`)
* **Use:** Oversee the scores and feedback being submitted by the judges in real-time.
* **Example:** You check this page to see if any judge is falling behind on their assigned evaluations before the closing ceremony.
* **How it works:** When a team clicks "Final Submit" in their `/workspace`, their project is locked and automatically appears in the Judges' evaluation queue. Judges score them based on specific rubrics, and the final average dictates their position on the Leaderboard.

### 9. Leaderboard Management (`/admin/leaderboard`)
* **Use:** Calculate final scores, apply manual bonuses or penalties, and publish the official results.
* **Example:** "Team Alpha" won a mini-game during the hackathon. You use this page to apply a "+10 Bonus" to their final score before publishing the leaderboard to the public.
* **Scoring Rules:** You are able to assign negative points (penalties) or positive points (bonuses), both of which will require a mandatory Reason box so there is total transparency on why a score was modified.

### 10. Mentors Management (`/admin/mentors`)
* **Use:** Assign available mentors to teams that have requested technical help or guidance.
* **Example:** "Team Nova" is struggling with their React code. You assign "Neha" (a React Mentor) to their team so she gains access to their team workspace and chat.
* **Workflow Details:** Students have a "Request Help" (SOS) button in their team workspace. When they click it, their request appears here. When you assign a Mentor, that Mentor instantly gets permission to read the team's code and joins their private team chat automatically.

### 11. Announcements (`/admin/announcements`)
* **Use:** Broadcast important updates, targeted either globally or to specific roles.
* **Example:** You publish an announcement targeting only "Students": *"Lunch is now being served in the main hall! You have 1 hour."*
* **Targeting Check:** When you select specific roles (e.g., Judges), the message skips students and only triggers notifications for accounts actively assigned the Judge role.

### 12. Certificates (`/admin/certificates`)
* **Use:** Generate, issue, and manage cryptographic or standard certificates for winners and participants.
* **Example:** The hackathon ends, and you batch-generate "Certificate of Participation" for everyone who successfully submitted a project. 

### 13. Recruitment / Opportunities (`/admin/recruitment`)
* **Use:** Post job/internship opportunities from sponsors and review the talent pipeline.
* **Example:** A sponsor wants to hire a Junior Frontend Developer. You post the job here so students can apply directly through their dashboard.
* **User Visibility:** This module is primarily for Corporate Sponsors (like Google or local startups) who want to hire talent from the hackathon. Students see these job postings on the public `/recruitment` route and can click "Apply" directly.

### 14. Support Ticketing (`/admin/support`)
* **Use:** Manage the helpdesk queue where students report technical issues or platform bugs.
* **Example:** A user opens a "High Priority" ticket saying they cannot upload their demo video. You reply to the ticket, resolve their issue, and mark it as "Closed".
* **User Visibility:** Students open support tickets directly from their `/dashboard` or the `/support` public route. Clicking `Open Comms` as an Admin takes you directly to a private chat channel between you and the user to resolve the issue.

### 15. Sponsors Management (`/admin/sponsors`)
* **Use:** Add sponsor logos, websites, and organizational tiers (Gold, Silver, Community) for display on the public landing page.
* **Example:** "Nova Technologies" signs on as a Gold Sponsor. You upload their logo here, and it instantly appears on the main website.
* **Workflow Details:** Using the Tier dropdown, you categorize their importance (e.g., Gold gets massive logos at the top, Community gets small text links at the bottom). You can provide their logo via an Image URL (or future upload feature) and link their company website.

### 16. Gallery & Media (`/admin/gallery`)
* **Use:** Upload photos and videos from the live event for the public to view.
* **Example:** After the opening ceremony, you upload 10 photos of the keynote speaker for the community to see on the `/gallery` route.
* **User Visibility:** Standard users view these photos seamlessly on the public `/gallery` page, which acts as a dynamic photo album for the live event.

### 17. Analytics (`/admin/analytics`)
* **Use:** View deep data insights (most popular tech stacks used, engagement metrics, demographic data).
* **Example:** You are writing a post-event report for sponsors and need to know exactly what percentage of projects used AI versus Blockchain.
* **Note:** The current analytics are largely visual. Future iterations will pull heavy live aggregations directly from the MongoDB database for real-time accuracy.

### 18. Activity Logs (`/admin/logs`)
* **Use:** An immutable audit trail of every important action taken on the platform.
* **Example:** A team complains their submission was deleted. You check the logs and see that the Team Leader accidentally deleted it at 2:00 AM.
* **Workflow Details:** Logs can be heavily filtered and slotted by action type, making it incredibly easy to track down exactly who modified what resource and when.

### 19. Settings (`/admin/settings`)
* **Use:** Toggle global platform features on or off without needing to deploy new code.
* **Example:** The judging phase is starting and you want to reduce server load, so you toggle the "Chat Feature" to OFF temporarily.

### 20. Event Schedule (`/admin/schedule`)
* **Use:** Manage the chronological timeline of events (workshops, keynotes, deadlines) shown to users.
* **Example:** The "API Workshop" is delayed by 30 minutes. You update the schedule here, and it dynamically updates on the students' timeline view.
* **User Visibility:** Available globally to all users on the public `/timeline` route so everyone knows exactly what is happening during the event.
