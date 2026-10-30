# CODESRIJAN — AUTO-REPAIR & REGRESSION LOG
**Project**: CodeSrijan Platform  
**Target Environments**: Vercel (`codesrijan-nine.vercel.app`) & Render (`codesrijan-api-6tfr.onrender.com`)  
**Audit Scope**: Commits `7d12570` -> `024f281` -> `8207b73` -> Verified Master Release  
**Verification Date**: 2026-10-30  

---

## 1. Defect & Auto-Repair Chronicle

### Defect FIX-01: Admin Hackathon Participation & Lone Wolf Contamination
- **Symptom**: Administrator navigating to `/dashboard` was flagged with a red `LONE WOLF DETECTED` alert banner warning them that they had not joined a squad and could not submit projects.
- **Root Cause**: The dashboard component unconditionally checked `!userTeam` without evaluating `currentUser.role === 'admin'`. Administrators are platform directors and evaluators, not hackathon participants.
- **Auto-Repair Applied**:
  - In `src/routes/dashboard.tsx`, added conditional guard checking `currentUser.role === 'admin'`.
  - For administrators, rendered the dedicated **Admin Governance Directorate** telemetry hub and suppressed the Lone Wolf warning.
  - In `src/routes/recruitment.tsx`, updated the admin view to display the global squad directorate and removed the Find/Join/Create squad tabs for admins.
- **Verification**: Verified via test case `TC-ADM-01`. Lone Wolf alert strictly absent on admin dashboard.

---

### Defect FIX-02: Certificate Generation vs Official Upload & Issuance
- **Symptom**: `/certificates` provided a mock client-side certificate generator rather than a director-controlled credential vault where participants receive official certificates.
- **Root Cause**: Earlier prototype contained a canvas-based certificate generator that allowed any user to trigger synthetic diplomas.
- **Auto-Repair Applied**:
  - Redesigned `src/routes/certificates.tsx` into the **Official Certificate Matrix**.
  - For students: Renders a verified credential vault showing certificates issued directly to them with cryptographic verification hashes.
  - For administrators: Renders the **Upload & Issue Official Certificates** management console allowing admins to select a recipient operative, assign a certificate title, and upload authorized PDF/image files.
- **Verification**: Verified via test cases `TC-STUD-04` and `TC-ADM-05`.

---

### Defect FIX-03: Create Hackathon Wizard Raw URL Links vs Dedicated File Uploaders
- **Symptom**: In the Create Hackathon 5-Step Wizard (`/admin/hackathons`), Step 1 required entering a raw text URL for the cover banner, and Step 4 required entering a raw text link for the UPI payment QR code.
- **Root Cause**: Wizard form inputs used `<input type="text" placeholder="https://..." />` instead of dedicated drag-and-drop file uploaders with dimension specifications.
- **Auto-Repair Applied**:
  - In `src/routes/admin.hackathons.tsx` Step 1: Replaced raw text input with a dedicated file drop-zone specifying `Recommended: 1200 x 630 px (16:9 ratio) • Max 5MB`. Implemented instant FileReader preview.
  - In Step 3: Added dedicated PDF/Doc rubric file upload box (`Max 15MB • PDF, DOC`) replacing external document links.
  - In Step 4: Replaced raw UPI QR link input with an official image upload drop-zone specifying `Recommended: 500 x 500 px (1:1 square) • Max 2MB` alongside a live participant QR preview modal.
- **Verification**: Verified via test cases `TC-ADM-02` and `TC-ADM-03`.

---

### Defect FIX-04: Squad Moderation, Disqualification & Ban Controls
- **Symptom**: Admins lacked granular controls to disqualify squads with recorded reasons or ban offending teams directly from the roster.
- **Root Cause**: Team status was purely read-only on the frontend recruitment view.
- **Auto-Repair Applied**:
  - In `src/routes/recruitment.tsx`, added administrative action buttons: `DISQUALIFY (DIQ)` and `BAN TEAM`.
  - Created high-contrast neo-brutalist confirmation modals requiring official justification strings.
  - Connected endpoints `POST /api/admin/teams/:id/disqualify` and `POST /api/admin/teams/:id/ban` with notification dispatches.
- **Verification**: Verified via test case `TC-ADM-06`.

---

### Defect FIX-05: Brand Insignia & Official Visual Identity
- **Symptom**: Application lacked the official CodeSrijan graduation cap + blue shield insignia (`</>`) across several headers and favicons.
- **Root Cause**: Missing SVG and PNG assets in `public/` directory; `.gitignore` blocked `public/*.png` through a broad `*.png` rule.
- **Auto-Repair Applied**:
  - Whitelisted `!public/*.png` and `!public/**/*.png` in `.gitignore`.
  - Added multi-resolution brand assets: `favicon.ico`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `codesrijan-icon.png`, `codesrijan-banner.png`.
  - Updated `Navbar.tsx`, `Footer.tsx`, `index.tsx`, `about.tsx`, `login.tsx`, `register.tsx`, and `admin.tsx` to render the official emblem.
- **Git Commit**: `024f281`
- **Verification**: Verified via test cases `TC-PUB-01` and `TC-PUB-02`.

---

### Defect FIX-06: SrijanBot Elevation & Viewport Clearance
- **Symptom**: SrijanBot floating trigger was positioned too close to the screen bottom (`bottom-4`), colliding with mobile OS gesture bars and footer copyright cards.
- **Root Cause**: Low bottom coordinate offset (`bottom-4 sm:bottom-6`).
- **Auto-Repair Applied**:
  - In `src/components/ChatBotWidget.tsx`, elevated wrapper coordinates to `bottom-24 sm:bottom-28` (96px mobile, 112px desktop clearance).
  - Wrapped parent in `pointer-events-none` with `pointer-events-auto` button to eliminate click-blocking around the floating icon.
  - Constrained chat window height to `h-[min(500px,calc(100dvh-9rem))]` to avoid overlapping footer boundaries.
- **Git Commit**: `8207b73`
- **Verification**: Verified via test case `TC-UI-01` (measured 112px clearance).

---

## 2. Server Focused Regression Test Suite
- Executed: `node server/test_focused_regression.mjs`
- Test Suites: 19 focused regression tests covering authentication, database models, team formation, hackathon lifecycle, and RBAC authorization.
- Result: **19 / 19 PASSED (100.0%)**.
- Zero regressions detected across backend services.
