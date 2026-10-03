# CodeSrijan Admin Panel Guide

Here is the complete list of every Admin page available in CodeSrijan, along with its specific use case and a practical example of how to use it.

### 1. Dashboard (`/admin`)
* **Use:** The central command center providing high-level metrics and a bird's-eye view of platform activity.
* **Example:** You log in during a hackathon to quickly check how many users have registered today and how many support tickets are currently open.

### 2. Users Management (`/admin/users`)
* **Use:** View, search, filter, and manage all registered accounts on the platform (Students, Mentors, Judges, Admins).
* **Example:** A student emails you saying they lost access to their account. You use this page to find their profile and manually send a password reset, or to suspend an account that violates the code of conduct.

### 3. Hackathons Management (`/admin/hackathons`)
* **Use:** Create new hackathon events, set their dates, define team size limits, and change their active status.
* **Example:** You are preparing for the "Spring 2026 Innovation Sprint". You create the event here, keep it as a "Draft" while finalizing details, and then change it to "Published/Active" when registration opens.

### 4. Problems & Challenges (`/admin/problems`)
* **Use:** Define the specific problem statements, categories, and difficulty levels for active hackathons.
* **Example:** You create a new problem called "AI for Accessibility" (Medium difficulty) and assign it to the currently active hackathon so students can select it when forming their teams.

### 5. Teams Management (`/admin/teams`)
* **Use:** Monitor all created teams, their members, the problem they selected, and their current workspace progress.
* **Example:** A team requests to have a 5th member added, but the limit is 4. You can override and manually adjust their team roster from this page.

### 6. Submissions (`/admin/submissions`)
* **Use:** Review all final project submissions (GitHub links, Figma files, Demo URLs).
* **Example:** The deadline has passed. You go here to "Lock" all submissions so students can no longer edit their draft links before judging begins.

### 7. Judges Management (`/admin/judges`)
* **Use:** Onboard judges and securely assign them to evaluate specific teams or specific problem statements.
* **Example:** You assign "Dr. Vikram" (a UI/UX expert) to evaluate 5 specific teams that chose the "Design Accessibility" problem track.

### 8. Evaluations (`/admin/evaluations`)
* **Use:** Oversee the scores and feedback being submitted by the judges in real-time.
* **Example:** You check this page to see if any judge is falling behind on their assigned evaluations before the closing ceremony.

### 9. Leaderboard Management (`/admin/leaderboard`)
* **Use:** Calculate final scores, apply manual bonuses or penalties, and publish the official results.
* **Example:** "Team Alpha" won a mini-game during the hackathon. You use this page to apply a "+10 Bonus" to their final score before publishing the leaderboard to the public.

### 10. Mentors Management (`/admin/mentors`)
* **Use:** Assign available mentors to teams that have requested technical help or guidance.
* **Example:** "Team Nova" is struggling with their React code. You assign "Neha" (a React Mentor) to their team so she gains access to their team workspace and chat.

### 11. Announcements (`/admin/announcements`)
* **Use:** Broadcast important updates, targeted either globally or to specific roles (e.g., only Judges).
* **Example:** You publish an announcement targeting only "Students": *"Lunch is now being served in the main hall! You have 1 hour."*

### 12. Certificates (`/admin/certificates`)
* **Use:** Generate, issue, and manage cryptographic or standard certificates for winners and participants.
* **Example:** The hackathon ends, and you batch-generate "Certificate of Participation" for everyone who successfully submitted a project. 

### 13. Recruitment / Opportunities (`/admin/recruitment`)
* **Use:** Post job/internship opportunities from sponsors and review the talent pipeline.
* **Example:** A sponsor wants to hire a Junior Frontend Developer. You post the job here so students can apply directly through their dashboard.

### 14. Support Ticketing (`/admin/support`)
* **Use:** Manage the helpdesk queue where students report technical issues or platform bugs.
* **Example:** A user opens a "High Priority" ticket saying they cannot upload their demo video. You reply to the ticket, resolve their issue, and mark it as "Closed".

### 15. Sponsors Management (`/admin/sponsors`)
* **Use:** Add sponsor logos, websites, and organizational tiers (Gold, Silver, Community) for display on the public landing page.
* **Example:** "Nova Technologies" signs on as a Gold Sponsor. You upload their logo here, and it instantly appears on the main website.

### 16. Gallery & Media (`/admin/gallery`)
* **Use:** Upload photos and videos from the live event for the public to view.
* **Example:** After the opening ceremony, you upload 10 photos of the keynote speaker for the community to see on the `/gallery` route.

### 17. Analytics (`/admin/analytics`)
* **Use:** View deep data insights (most popular tech stacks used, engagement metrics, demographic data).
* **Example:** You are writing a post-event report for sponsors and need to know exactly what percentage of projects used AI versus Blockchain.

### 18. Activity Logs (`/admin/logs`)
* **Use:** An immutable audit trail of every important action taken on the platform.
* **Example:** A team complains their submission was deleted. You check the logs and see that the Team Leader accidentally deleted it at 2:00 AM.

### 19. Settings (`/admin/settings`)
* **Use:** Toggle global platform features on or off without needing to deploy new code.
* **Example:** The judging phase is starting and you want to reduce server load, so you toggle the "Chat Feature" to OFF temporarily.

### 20. Event Schedule (`/admin/schedule`)
* **Use:** Manage the chronological timeline of events (workshops, keynotes, deadlines) shown to users.
* **Example:** The "API Workshop" is delayed by 30 minutes. You update the schedule here, and it dynamically updates on the students' timeline view.
