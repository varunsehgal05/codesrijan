# 🧪 CodeSrijan E2E Feature Test Suite & Verification Matrix

This document records the automated and manual end-to-end (E2E) test specifications for all features in the CodeSrijan Hackathon Platform.

---

## 📋 Comprehensive Test Cases Specification

### TC-01: Navbar Layout & Single-Line Alignment
- **File**: `src/components/layout/Navbar.tsx`
- **Goal**: Verify navigation items fit horizontally on a single flex row without wrapping.
- **Steps**:
  1. Open home page `http://localhost:3000`.
  2. Inspect top navbar container: confirm `flex-nowrap` layout ensures all navigation items (`Hackathons Hub`, `Sponsors`, `Host Event`, `About Platform`, `Help & Support`) sit on a single line without wrapping.
  3. Verify `Sponsors` link is visible and accessible in both logged-in and guest states.
- **Result**: **PASS** ✅

---

### TC-02: Public & Authenticated Sponsors Grid
- **File**: `src/routes/sponsors.tsx`
- **Goal**: Verify partners grid displays standard sponsor cards for guest & logged-in users.
- **Steps**:
  1. Open `http://localhost:3000/sponsors`.
  2. Confirm partner grid displays partner logos: **Google Cloud, Vercel, Firebase, GitHub, Intel**.
- **Result**: **PASS** ✅

---

### TC-03: SrijanBot AI ChatBot Widget
- **File**: `src/components/ChatBotWidget.tsx`
- **Goal**: Verify floating SrijanBot AI widget is accessible to guest users and answers queries.
- **Steps**:
  1. Open any public route (`/about`, `/sponsors`, `/timeline`).
  2. Verify floating yellow **Help** tab and bot avatar button appears on the bottom right.
  3. Expand chat window and type: `"When is submission?"`.
  4. Submit query and verify SrijanBot responds instantly with submission deadline details.
- **Result**: **PASS** ✅

---

### TC-04: Hackathons Hub Route Resolution
- **File**: `src/routes/hackathons.tsx`
- **Goal**: Verify `/hackathons` route loads cleanly without 404.
- **Steps**:
  1. Click `Hackathons Hub` in the navbar.
  2. Confirm URL resolves to `http://localhost:3000/hackathons` and displays active hackathon arenas.
- **Result**: **PASS** ✅

---

### TC-05: Master Accounts Authentication
- **File**: `server/server.js`
- **Goal**: Verify default master accounts log in with HTTP 200.
- **Credentials**:
  - Admin: `admin@codesrijan.com` / `CodeSrijan99!`
  - Student: `student@codesrijan.com` / `HackerStudent99!`
- **Result**: **PASS** ✅

---

### TC-06: Ultra-Fast Admin Telemetry Dashboard
- **File**: `src/routes/admin.index.tsx`
- **Goal**: Verify Admin Dashboard metrics hydrate instantly (0ms UI block wait).
- **Result**: **PASS** ✅

---

### TC-07: Operative Full User Info Modal
- **File**: `src/routes/admin.users.tsx`
- **Goal**: Verify clicking blue **INFO** button opens complete hacker profile modal.
- **Details**: Operative Name, ID, Email (with COPY button), Phone (with COPY button), College, Branch, Year, Squad, Role, Status.
- **Result**: **PASS** ✅

---

### TC-08 & TC-09: Multi-Select, Bulk Deletion & Permanent Purging
- **Files**: `src/routes/admin.users.tsx` & `server/server.js`
- **Goal**: Verify row checkboxes, Select All header, and `DELETE /api/admin/users/:id` permanently purge accounts from MongoDB & Firebase.
- **Result**: **PASS** ✅

---

### TC-10: Support Ticket Management & Admin Chat System
- **Files**: `src/routes/admin.support.tsx` & `src/routes/chat.tsx`
- **Goal**: Verify support tickets table has Processing, Clone, and Remove controls, and `/chat` displays student name & ticket subject for admins.
- **Result**: **PASS** ✅
