# CodeSrijan - Architectural Structure

This document outlines the full architecture of the CodeSrijan Student-Run Hackathon Platform.

## 1. Directory Structure

- `/src` - Frontend (React + Vite)
  - `/components` - Reusable UI components (buttons, modals, layout elements)
  - `/hooks` - Custom React hooks
  - `/lib` - Utility functions, store configuration
  - `/routes` - TanStack Router page definitions
- `/server` - Backend (Express.js + MongoDB)
  - `/models` - Mongoose database models
  - `/services` - Business logic (e.g., email dispatch)
  - `server.js` - Main Express application and API endpoints
- `/public` - Static assets

## 2. Frontend Routing Structure (TanStack Router)

### Public / Marketing Routes
- `/` - Landing Page
- `/about` - About Platform & Team
- `/timeline` - Event Schedule
- `/faq` - Frequently Asked Questions
- `/problems` - Active Problem Statements (Public View)

### Authentication Flow
- `/login` - Hacker / Mentor Login
- `/register` - Hacker Registration
- `/auth/otp` - Email Verification
- `/auth/forgot-password` - Password Recovery
- `/admin-login` - Root Admin Access

### Hacker Workspace (Requires Authentication)
- `/dashboard` - Overview (Timer, Mission Status)
- `/workspace` - Main Dashboard interface wrapper
- `/profile` - User Profile & Identity
- `/team` - Team Management (Squad details)
- `/recruitment` - Squad Assembly (Find/Join/Create Teams)
- `/chat` - Secure Comms (Team & Global Chat)
- `/evaluations` - Project Submissions & Feedback
- `/support` - Help & Support Tickets
- `/settings` - Workspace Settings

### Admin Control Center (`/admin`)
- `/admin` - Root wrapper & Sidebar
- `/admin/` (Index) - Dashboard Analytics
- `/admin/users` - Hacker Management
- `/admin/teams` - Squad Monitoring
- `/admin/hackathons` - Event Management
- `/admin/problems` - Problem Statement Configuration
- `/admin/announcements` - Global Broadcasts
- `/admin/leaderboard` - Live Rankings
- `/admin/sponsors` - Sponsor Management
- `/admin/judges` - Evaluation Panel
- `/admin/mentors` - Oracle Support Team
- `/admin/certificates` - Achievement Distribution
- `/admin/support` - Incoming Support Tickets
- `/admin/logs` - System Audit Trails
- `/admin/settings` - Platform Configuration

## 3. Database Models (MongoDB)
- **User**: Hackers, Mentors, Admins. Stores identity, role, team ref.
- **Team**: Squads. Stores members, creator, repo links.
- **Hackathon**: Event details (dates, status).
- **ProblemStatement**: High-octane challenge definitions.
- **Message**: Chat messages for Secure Comms.
- **Announcement**: Broadcasted events.
- **SupportTicket**: Help requests from hackers.
- **EmailVerification**: OTP tokens for registration.
