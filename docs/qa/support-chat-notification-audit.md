# SUBAGENT D — SUPPORT, CHAT & NOTIFICATION AUDIT REPORT
**Platform Release:** CodeSrijan 1.0  
**Audit Date:** 2026-10-26  
**Auditor:** Subagent D (Support, Chat, Notifications and User Flows)  

---

## 1. Executive Summary
Subagent D verified communication channels across the platform, including `/support`, `/admin/support`, `/chat`, and `/notifications`. The strict active-ticket whitelist policy, structured bug reporting and feedback intake, Socket.IO conversation authorization, and notification category tags have all been empirically validated.

---

## 2. Support Ticket Status Policy & Whitelist

### 2.1 Authorized Active Statuses
Only the following normalized statuses are classified as active:
- `open`
- `in_progress`

### 2.2 Excluded Statuses
The following statuses are strictly excluded from active views and archived in history:
- `closed`
- `resolved`
- Missing, `null`, `undefined`, empty string (`""`), whitespace-only (`"   "`), and unknown statuses (`"pending"`, `"unknown"`, `"archived"`).

### 2.3 Status Policy Verification Matrix
All 16 variations were tested against UI filters, server helpers (`isTicketStatusActive`), and MongoDB queries in automated test suites:
- `open` -> ACTIVE (Pass)
- `OPEN` -> ACTIVE (Pass)
- `in_progress` -> ACTIVE (Pass)
- `IN_PROGRESS` -> ACTIVE (Pass)
- `in-progress` -> ACTIVE (Pass)
- `In Progress` -> ACTIVE (Pass)
- `closed` -> EXCLUDED (Pass)
- `CLOSED` -> EXCLUDED (Pass)
- `resolved` -> EXCLUDED (Pass)
- `RESOLVED` -> EXCLUDED (Pass)
- `null` -> EXCLUDED (Pass)
- `undefined` -> EXCLUDED (Pass)
- `""` (empty) -> EXCLUDED (Pass)
- `"   "` (whitespace) -> EXCLUDED (Pass)
- `"pending"` -> EXCLUDED (Pass)
- `"unknown"` -> EXCLUDED (Pass)

---

## 3. Support & Bug Reporting Enhancements (Feature 3)

### 3.1 Role Separation & UI Guarding
- **Student View:** Displays `TALK TO ADMIN`. Clicking opens the structured intake form.
- **Admin View:** `TALK TO ADMIN` is hidden; `ADMIN CONSOLE ↗` links to `/admin/support`. If an administrator attempts to call `POST /api/support`, the backend denies the request with HTTP 403: *"Administrators cannot create student tickets through the student-facing support interface. Please manage tickets from the Admin Console."*

### 3.2 Structured Feedback Categories
- `bug_report`: Platform defect or visual malfunction.
- `feedback`: Product feedback, usability suggestions, or workflow improvements.
- `feature_request`: Desired functionality for future tournaments.
- `payment`: Proof upload assistance or receipt inquiries.
- `squad`: Alliance formation or roster issues.
- `system`: General platform or access glitches.
- `general`: Routine operative inquiries.

### 3.3 Abuse Prevention & Rate Limiting
- **Quota:** Maximum 5 tickets per 15 minutes per user. The 6th ticket is blocked with HTTP 429.
- **Validation:** Minimum 3 characters for subjects (max 150), minimum 5 characters for descriptions (max 3000).
- **Security Guidance:** Prominent banner warns users never to include passwords, session tokens, OTPs, or credit card details.

---

## 4. Chat & Real-Time Comms Framework

### 4.1 Socket.IO Handshake Security
- Connection authentication verifies bearer JWT against active database sessions.
- Inactive or revoked sessions are rejected at the socket handshake level.

### 4.2 Conversation Room Access
- Room authorization validates that the connecting user is either an administrator, a direct participant in the conversation, or a member of the squad assigned to the conversation.
- Unauthorized joins and typing broadcasts fail closed.

---

## 5. Notifications & Category Tags

### 5.1 Category Mapping
All in-app notifications render high-contrast category badges:
- `PAYMENT`: Payment approval, payment rejection, proof submission notices.
- `SQUAD`: Disqualification, reinstatement, roster invitations, join requests.
- `SUPPORT`: Status updates on operative tickets.
- `SYSTEM`: Problem statement reveals, lockdown countdowns, maintenance alerts.
- `GENERAL`: Routine broadcast announcements.

### 5.2 Unread Count Persistence
- Unread status (`isRead: false`) is strictly preserved across route transitions and component mounts.
- Viewing category badges does not inadvertently mark notifications as read.
