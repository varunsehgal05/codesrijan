# CODESRIJAN — ARCHITECTURE REPAIR & DEFECT LOG

Detailed record of all identified architecture weaknesses, defects, root cause analyses, applied patches, and regression verification results.

---

## REPAIR 1: Admin Dashboard Role Gating & Governance Oversight
- **Identified Defect:** Administrators visiting `/dashboard` were subjected to student-only restrictions: seeing "LONE WOLF DETECTED" (warning of no team), "PAYMENT CLEARANCE REQUIRED" (fee due ₹100), and "Diplomas" link instead of "Certificates".
- **Root Cause:** `/dashboard` and `SubmissionCountdown.tsx` assumed single-tenant student behavior by default without checking `currentUser.role === 'admin'`.
- **Architectural Fix:**
  - In `src/routes/dashboard.tsx`, gated mission status to render the **Admin Governance Directorate** for admins (displaying registered hacker counts, active squads, total revenue collected, and disciplinary shortcuts).
  - Gated `LONE WOLF DETECTED` strictly to non-admin roles.
  - In `src/components/SubmissionCountdown.tsx`, replaced payment prompt with **Admin Oversight Directorate** button linking to `/admin/hackathons`.
  - Renamed "Diplomas" in Secure Comm Links to "Certificates" (`/certificates`).
- **Verification:** Verified in Chrome; zero payment or squad requirements rendered for admin.

---

## REPAIR 2: Hackathon Creation Wizard File Upload Overhaul
- **Identified Defect:** Create Hackathon wizard steps 1, 3, and 4 relied on manual text URL inputs (`Cover Banner Image URL`, `Specification Document / PDF URL`, `Custom Official QR Image URL`), prone to broken external image links.
- **Root Cause:** Wizard lacked native browser file upload integration.
- **Architectural Fix:**
  - **Step 1:** Implemented image upload component with recommended dimensions (`1200 × 630 px, 16:9 ratio • Max 5MB`), instant preview thumbnail, and clear button.
  - **Step 3:** Implemented document file upload component accepting `.pdf, .doc, .docx` up to 15MB.
  - **Step 4:** Implemented UPI QR code image upload component with recommended dimensions (`500 × 500 px, 1:1 square • Max 2MB`), live participant mockup preview, and removal button.
- **Verification:** Tested in Chrome; local file buffers read via `FileReader` and persisted cleanly into MongoDB.

---

## REPAIR 3: Admin Problem Directive Selection Override
- **Identified Defect:** Admin clicking `SELECT DIRECTIVE ->` in `/problems` triggered error toast: `You must join or create a squad before selecting a problem statement.`
- **Root Cause:** `selectProblem()` checked `if (!userTeam)` prior to checking `currentUser.role`.
- **Architectural Fix:**
  - Added early check: `if (currentUser.role === 'admin') { setInspectingProblem(targetProb); return; }`.
  - Rendered `INSPECT DIRECTIVE` button with visibility icon for administrators.
  - Implemented the **Directive Dossier Inspection Modal** displaying challenge descriptions, tech stacks, PDF specification links, and locked squad allocations.
- **Verification:** Verified in Puppeteer browser session; admin clicks directive and inspects dossier with zero toast errors.

---

## REPAIR 4: Platform-Wide Auto-Scroll viewport Jump
- **Identified Defect:** Navigating to pages (such as `/support` or `/chat`) unexpectedly scrolled the viewport to the bottom of the page, cutting off header controls.
- **Root Cause:** `ChatBotWidget.tsx` executed `endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })` unconditionally on mount across all pages, even when closed.
- **Architectural Fix:**
  - Restricted `scrollIntoView()` in `ChatBotWidget.tsx` to execute strictly when `isOpen === true` using `{ behavior: 'smooth', block: 'nearest' }`.
  - Added `window.scrollTo(0, 0)` in `src/routes/__root.tsx` on TanStack route transitions.
- **Verification:** Platform navigation verified across 8 routes; viewport stays anchored to header.

---

## REPAIR 5: Recruitment Admin-to-Team Comms Integration
- **Identified Defect:** Admin clicking `[ 💬 COMMS ]` on a squad in `/recruitment` failed to open a group discussion with the team.
- **Root Cause:** Squad conversation channels lacked administrative participation by default.
- **Architectural Fix:**
  - Added backend route `POST /api/conversations/admin-team/:teamId` in `server/server.js` linking Admin with all squad operatives in an official dispatch channel.
  - Updated `[ 💬 COMMS ]` button in `src/routes/recruitment.tsx` to invoke this endpoint and route directly to `/chat?conv=<id>`.
- **Verification:** Tested in Chrome; conversation created and seeded with administrative dispatch message.
