# CODESRIJAN — ORGANIZER AND EVENT OPERATIONS AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal Hackathon Operations Director & Event Architect  
**Operational Lens:** Evaluating platform readiness for an on-site or hybrid 48-hour collegiate hackathon with 500-1,000 participants and 100+ active squads.  

---

## 1. The 48-Hour Live Event Operations Checklist

Can an event organizer manage the following 18 essential real-world operational capabilities?

| Operational Capability | Currently Implemented? | Existing Mechanism / Page | Real-World Operational Readiness |
| :--- | :---: | :--- | :--- |
| **1. Registration Management** | ✅ YES | `/admin/operations`, `/admin/users` | Full visibility over hacker signups, colleges, and contact emails. |
| **2. Payment Audit & Clearance** | ✅ YES | `/admin/payments` | Manual inspection of UTR and GridFS slip images; approval/rejection triggers email. |
| **3. Team Rosters & Governance** | ✅ YES | `/admin/teams` | Search by squad code, inspect members, disqualify rogue squads, adjust bonus points. |
| **4. Participant Eligibility Checking** | ⚠️ PARTIAL | `/admin/hackathons` | Basic text rules; lacks automatic college-domain or ID verification. |
| **5. Track & Category Setup** | ✅ YES | `/admin/problems` | Multi-track support (Web3, AI, Cloud, Fintech) with difficulty levels. |
| **6. Problem Statement Scheduling** | ✅ YES | `/admin/operations` | Immediate or scheduled problem reveal switch with countdown sync. |
| **7. Master Event Schedule** | ⚠️ PARTIAL | `/admin/schedule`, `/timeline` | Visual timeline display; lacks calendar subscription (`.ics` / Google Calendar sync). |
| **8. Real-Time Announcements** | ✅ YES | `/admin/announcements` | Pinned bulletins, target audience filtering, real-time push via WebSockets. |
| **9. Judge Management & Roster** | ✅ YES | `/admin/judges` | Add judges, assign to specific tracks, track grading completion rates. |
| **10. Mentor SOS Dispatch** | ✅ YES | `/mentor`, `/mentor-command-center` | Real-time squad distress calls, mentor claim workflow, meet links. |
| **11. Volunteer & Staff Management** | ❌ NO | None | No volunteer accounts or scoped permissions exist. |
| **12. Physical Attendance & QR Check-In** | ❌ NO | None | No badge printing, no QR ticket scanner at the door, no physical attendance audit. |
| **13. Meal & Swag Distribution Tracking**| ❌ NO | None | No coupon or badge scanning for food or hackathon kits. |
| **14. Live Technical Support Desk** | ✅ YES | `/admin/support`, `/support` | Real-time support ticketing with category tags and chat thread integration. |
| **15. Project Submission Depository** | ✅ YES | `/admin/submissions` | Centralized repository of GitHub, demo URLs, presentation decks, and videos. |
| **16. Deliberation & Leaderboard Freeze** | ✅ YES | `/admin/leaderboard` | Live score override, leaderboard freeze toggle, winner finalization. |
| **17. Certificate Studio & Issuance** | ✅ YES | `/admin/certificates` | Visual template designer, bulk generation, student vault download. |
| **18. Post-Event Telemetry & Analytics** | ⚠️ PARTIAL | `/admin/analytics`, `/admin/health` | Basic counts (users, teams); lacks retention curves, college win ratios, funnel drop-off. |

---

## 2. Deep Dive: Missing On-Site Event Realities

### 2.1 The Physical Venue Door Check-In Problem
* **The Reality:** At 8:00 AM on Hackathon Day, 500 college students arrive at the physical auditorium.
* **Current Platform Failure:** There is **no mobile QR scanner** or attendee check-in portal. An organizer would have to open the master user table (`/admin/users`), search each student by name or email, and manually mark them present on a paper spreadsheet.
* **Solution Architecture:**
  - Generate a dynamic QR code on the student's `/dashboard` ("Digital Access Badge").
  - Provide a lightweight PWA route `/volunteer/checkin` allowing student volunteers with smartphones to scan badges with camera vision and record `attended: true` and `checkedInAt: timestamp`.

### 2.2 Squad Balancing & The "Abandoned Squad" Scenario
* **The Reality:** 2 hours before submission deadline, a 4-person squad experiences an interpersonal dispute, or the leader loses internet connectivity.
* **Current Platform Friction:**
  - The leader alone holds the key to submit the project.
  - If the leader is unresponsive, the remaining members cannot click submit.
  - The admin has to manually delete the team or edit database records.
* **Solution Architecture:**
  - Provide an "Emergency Co-Leader Promotion" action in `/admin/teams` allowing an organizer to transfer leadership with one click.

### 2.3 Venue Amenities & Emergency Broadcasts
* **Current State:** The `Hackathon` model contains an `amenities: [String]` field (e.g. `Wi-Fi High-Speed`, `24/7 Red Bull & Coffee`, `Rest Pods`, `Hardware Lab`).
* **Operational Value:** While this informs students, there is no interactive venue floor plan or Wi-Fi credential portal.

---

## 3. Autonomous Organizer Independence Verdict

**Can external organizers currently run an event independently?**

> **VERDICT: NO.**  
> External organizers currently require a central CodeSrijan super-admin to set up the event, configure the UPI QR code, manage database settings, and audit payment receipts.  
> To become a true self-serve platform (like Devpost or Unstop), CodeSrijan must decouple the single super-admin model into isolated, multi-tenant Organizer Workspaces with self-serve billing, staff delegation, and custom QR check-in tools.

---

*Verified from operational route analysis and event management requirements.*
