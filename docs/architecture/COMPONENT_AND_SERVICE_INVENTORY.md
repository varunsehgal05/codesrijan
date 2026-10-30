# CODESRIJAN — COMPONENT AND SERVICE INVENTORY

This document provides an exhaustive inventory of all software components, frontend routes, backend controllers, and background services in CodeSrijan.

---

## 1. FRONTEND ROUTE DIRECTORY (`src/routes/`)

| Route Path | File Location | Purpose & Capabilities | Access Level |
|:---|:---|:---|:---|
| `/` | `src/routes/index.tsx` | Platform landing page, mainframe status indicator, and mission brief. | Public |
| `/login` | `src/routes/login.tsx` | Operative authentication terminal with role-aware redirection. | Public |
| `/register` | `src/routes/register.tsx` | Account registration portal with password strength and role selection. | Public |
| `/auth/otp` | `src/routes/auth.otp.tsx` | 6-digit numeric verification code terminal with instant resend action. | Public |
| `/dashboard` | `src/routes/dashboard.tsx` | Role-aware HUD: Admin Governance Directorate for admins; Mission Status for students. | Authenticated |
| `/hackathons` | `src/routes/hackathons.index.tsx` | Catalog of active and upcoming hackathon arenas (Free vs Paid). | Public / Auth |
| `/problems` | `src/routes/problems.tsx` | Problem Directives matrix with 6 track filters and Admin Inspection modal. | Authenticated |
| `/workspace` | `src/routes/workspace.tsx` | Squad project workspace, kanban board, and submission gateway. | Authenticated (Squad required) |
| `/recruitment` | `src/routes/recruitment.tsx` | Squad directory, operative search, friend links, and Admin Team Comms. | Authenticated |
| `/leaderboard` | `src/routes/leaderboard.tsx` | Tournament standings, score breakdowns, and player dossier links. | Public / Auth |
| `/certificates` | `src/routes/certificates.tsx` | My Received Certificates gallery & Admin Official Certificate Upload. | Authenticated |
| `/support` | `src/routes/support.tsx` | Ticket submission desk, active transmission list, and direct SOS dispatch. | Authenticated |
| `/chat` | `src/routes/chat.tsx` | Realtime communication hub with deep-linking (`?conv=` or `?ticketId=`). | Authenticated |
| `/admin/*` | `src/routes/admin.*.tsx` | Administrative consoles (hackathons, users, teams, payments, support). | Admin Only |

---

## 2. BACKEND CONTROLLERS & ENDPOINTS (`server/server.js`)

| Subsystem | Primary Endpoints | Middleware Pipeline | Backing Model |
|:---|:---|:---|:---|
| **Authentication** | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/verify-otp` | Input Validation, bcrypt salt 10, JWT generation | `User` |
| **Hackathons** | `GET /api/hackathons`<br>`POST /api/admin/hackathons`<br>`PUT /api/admin/hackathons/:id` | `requireAuth`, `requireRole(['admin'])` | `Hackathon` |
| **Problem Directives** | `GET /api/hackathons/:id/problems`<br>`POST /api/teams/:id/select-problem` | `requireAuth`, squad leader ownership check | `Hackathon`, `Team` |
| **Certificates** | `GET /api/certificates/my`<br>`POST /api/admin/certificates/upload`<br>`GET /api/certificates/:id` | `requireAuth`, `requireRole(['admin'])` for uploads | `Certificate`, `GridFS` |
| **Recruitment & Comms** | `GET /api/teams`<br>`POST /api/conversations/admin-team/:teamId` | `requireAuth`, squad membership validation | `Team`, `Conversation` |
| **Support & SOS** | `GET /api/support`<br>`POST /api/support/ticket`<br>`PATCH /api/support/ticket/:id` | `requireAuth`, user data isolation check | `SupportTicket`, `Message` |
| **SrijanBot AI** | `POST /api/ai/chat`<br>`GET /api/ai/health` | Live-data grounding, 5s timeout, heuristic fallback | N/A (External Groq) |
| **Health & Telemetry** | `GET /health`<br>`GET /api/health` | Public probe, sanitization (no secret leakage) | MongoDB Ping |

---

## 3. ASYNC & REALTIME SERVICES

1. **Socket.IO Gateway:** Listens on port 5001. Handles room joining (`room:conv-<id>`, `user:<id>`), typing indicators, and message broadcasts.
2. **Email Dispatch Queue:** Asynchronously relays transactional emails to Google Apps Script HTTP endpoint without blocking HTTP request execution.
3. **Database Keep-Alive:** Periodic ping maintains MongoDB Atlas serverless connection pool readiness to prevent cold-start latency.
