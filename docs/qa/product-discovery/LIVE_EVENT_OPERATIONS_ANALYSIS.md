# CODESRIJAN — LIVE EVENT OPERATIONS & DAY-OF-HACKATHON ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-09` | **Focus Area**: Real-Time 24-48 Hour Event Operations  
**Perspective**: Event Operations Director, Venue Logistics Lead & Senior Systems Architect  

---

## 1. Executive Summary & Operational Context
A hackathon is a high-intensity, time-compressed event. Over 24 to 48 hours, organizers must orchestrate hundreds of participants, live meal schedules, sponsor workshops, SOS mentor dispatches, hardware lab requests, and emergency schedule shifts. CodeSrijan provides core real-time elements (SrijanBot, Discord ticket bot, countdown HUD), but lacks physical attendance tracking, session management, and emergency broadcast overrides.

---

## 2. Real-Time Operational Requirements & Gap Matrix

### 2.1 Venue Check-in & Physical Attendance Tracking
- **The Operational Need**: For in-person or hybrid hackathons, organizers must track who physically arrived at the venue to allocate tables, distribute swag, authorize meals, and enforce venue security.
- **Current State**: CodeSrijan is completely digital; there is no check-in scanner or physical attendance state.
- **Recommended Solution**:
  1. Generate a personalized **Dynamic Event Pass QR** on the Student Dashboard (`/dashboard`).
  2. Equip Event Volunteers (`role: event_staff`) with a mobile QR camera scanner on `/staff/checkin`.
  3. Scanning verifies registration, marks `Registration.checkedIn: true`, records check-in timestamp, and assigns a physical table (e.g. `Table B-14`).
  4. Tracks meal badges (Breakfast, Lunch, Midnight Pizza) to prevent duplicate meal claims.

---

### 2.2 Synchronized Problem Statement Reveal
- **The Operational Need**: In competitive collegiate events, releasing problem statements 5 minutes early to one team creates an unfair advantage. Release must occur at the exact second across all devices.
- **Current State**: Handled via `wallClockBoundary` check and `problemRevealMode`. Students view `[CLASSIFIED SECURITY PROTOCOL // PENDING DIRECTORATE AUTHORIZATION]` until reveal.
- **Gaps Identified**:
  - Requires participants to manually refresh the page unless WebSockets push a reveal event.
- **Recommended Solution**:
  - Implement a synchronized WebSocket trigger:
    `socket.on('problem_statements_unlocked', (payload) => { ... })`
  - When the countdown hits zero, TanStack router automatically triggers query invalidation without requiring a full browser reload.

---

### 2.3 Live Schedule & Session Management
- **The Operational Need**: Hackathons feature rolling milestones: Opening Ceremony (10:00 AM), Sponsor Workshop: GenAI (1:00 PM), Mentoring Round 1 (4:00 PM), Midnight Snack (12:00 AM), Soft Deadline (8:00 AM), Hard Submission Deadline (10:00 AM).
- **Current State**: `/timeline` provides a static milestone list.
- **Gaps Identified**:
  - No "Happening Now" indicator.
  - No meeting links (Zoom/Google Meet/YouTube Live) for virtual stages.
  - If an organizer delays a session by 30 minutes, they cannot update the live schedule without developer assistance.
- **Recommended Solution**:
  - Build a dynamic `EventSchedule` manager in `/admin/schedule`.
  - Feature a real-time "ACTIVE NOW" banner at the top of the Student Dashboard.

---

### 2.4 SOS Mentor Dispatch & Table Routing
- **The Operational Need**: During 3:00 AM debugging crises, teams need rapid technical assistance (e.g., "Docker container failing on Table 22").
- **Current State**:
  - `/support` features a Discord Ticket Bot interface.
  - Students can select `mentor_sos` with their squad ID and message (e.g. `[SOS MENTOR DISPATCH] [SQUAD: t-1791540495510] need med on table 20`).
- **Gaps Identified**:
  - Mentors do not receive mobile push notifications when a ticket is opened.
  - No "Claim Ticket" concurrency lock (two mentors might walk to Table 20 simultaneously).
- **Recommended Solution**:
  - Enhance `/mentor-command-center` with an atomic `CLAIM TICKET` action that marks the ticket `DISPATCHED_TO_MENTOR_X` and notifies the squad.

---

### 2.5 Emergency Announcements & Audio Chime Alerts
- **The Operational Need**: Critical safety or deadline shifts (e.g. "Submission extended by 30 minutes due to WiFi outage") must immediately grab participants' attention.
- **Recommended Solution**:
  - Implement an `URGENT_BROADCAST` modal that interrupts the user's active screen with an audio chime and high-contrast alert banner requiring an "I Acknowledge" click to dismiss.

