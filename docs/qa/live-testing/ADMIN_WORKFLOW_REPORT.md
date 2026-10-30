# CODESRIJAN — ADMINISTRATIVE GOVERNANCE & WORKFLOW REPORT
**Environment**: Production (`https://codesrijan-nine.vercel.app`)  
**Persona**: Codesrijan Administrator (`admin@codesrijan.com` / Global Directorate)  
**Security Boundary**: Role `admin` Strict Enclosure  
**Verification Date**: 2026-10-30  

---

## 1. Executive Summary
The Administrator Governance audit validates the mission-critical capabilities reserved exclusively for platform directors and hackathon organizers:
1. **Directorate Dashboard**: Verification that administrative metrics render without competitor-specific blocks (Lone Wolf warning removed).
2. **Hackathon Orchestration Wizard**: Verification of the 5-step event creation workflow, specifically ensuring raw URL inputs have been replaced by dedicated file upload components (1200x630 banner and 500x500 payment QR).
3. **Directive Dossier Inspection**: Direct inspection of problem statements from `/problems` without requiring team membership or throwing squad errors.
4. **Official Certificate Issuance Matrix**: Replacement of client-side certificate generators with an authoritative file upload & recipient issuance pipeline.
5. **Enforcement & Disciplinary Controls**: Real-time Disqualification (DIQ) and Ban modals on `/recruitment` to maintain hackathon integrity.

---

## 2. Granular Audit of Administrative Surfaces

### 2.1 Directorate Dashboard (`/dashboard`)
- **Route**: `https://codesrijan-nine.vercel.app/dashboard`
- **Identity & Role Display**: Shows `CODESRIJAN ADMINISTRATOR` with badge `Role: ADMIN` and direct shortcut to `ADMIN PANEL`.
- **Competitor Isolation**: In previous releases, admins without teams erroneously saw a `LONE WOLF DETECTED` alert. The updated component (`src/routes/dashboard.tsx`) inspects `currentUser.role === 'admin'` and completely suppresses the Lone Wolf warning. Instead, the admin sees the **Admin Governance Directorate** telemetry hub.
- **Evidence**: `docs/qa/live-testing/evidence/admin/01_admin_governance_dashboard.png`
- **Result**: **PASS**

### 2.2 Create Hackathon 5-Step Wizard (`/admin/hackathons`)
- **Route**: `https://codesrijan-nine.vercel.app/admin/hackathons`
- **Modal Trigger**: Clicking `+ CREATE HACKATHON` opens the Neo-Brutalist creation modal:
  1. **Step 1: Basic Event Information**:
     - Event Name, Theme / Category, Format Mode (`ONLINE`, `HYBRID`, `OFFLINE`).
     - **Banner Image Uploader**: Previously a raw text URL input. Now features a dedicated file drop-zone:
       `Recommended: 1200 x 630 px (16:9 ratio) • Max 5MB`.
       Clicking or dragging a file triggers immediate FileReader encoding with a live banner preview.
     - Description textarea with rich character counter.
  2. **Step 2: Windows, Tracks & Rules**:
     - Registration start/close datetimes, Submission deadline.
     - Technological track selector (`AI`, `SYSTEMS`, `OPEN_INNOVATION`).
     - Operative code of conduct editor.
  3. **Step 3: Problem Statements & Evaluation Rubrics**:
     - Problem title, track classification, difficulty rating.
     - **Rubric File Uploader**: Dedicated PDF/Document upload zone replacing raw URL inputs:
       `Max 15MB • PDF, DOC`.
     - Embargo toggle: Allows admins to lock problem visibility until hackathon kickoff.
  4. **Step 4: Registration Policy & Payment Demodel**:
     - Entry Fee configuration (e.g. `₹100` or `FREE`).
     - Payment UPI ID / VPA.
     - **UPI Payment QR Uploader**: Dedicated image uploader replacing raw link input:
       `Recommended: 500 x 500 px (1:1 square) • Max 2MB`.
       Includes interactive "Live Participant QR Preview" showing exactly what students see on their checkout modal.
  5. **Step 5: Review & Direct Launch**:
     - Consolidated configuration audit summary.
     - `LAUNCH HACKATHON` dispatches `POST /api/hackathons`.
- **Evidence**: `docs/qa/live-testing/evidence/hackathons/01_wizard_step1_banner_upload.png` and `docs/qa/live-testing/evidence/hackathons/02_wizard_step4_payment_qr.png`
- **Result**: **PASS**

### 2.3 Directive Dossier Inspection (`/problems`)
- **Route**: `https://codesrijan-nine.vercel.app/problems`
- **Operational Requirement**: Administrators must be able to inspect classified problem directives without joining a squad or causing state errors.
- **Implementation**: The problem card renders an `INSPECT DIRECTIVE` button visible to administrators.
- **Modal Behavior**: Clicking opens the `ADMIN DIRECTIVE INSPECTION` dossier containing:
  - Confidential Problem Parameters & Architecture Requirements.
  - Evaluation Rubric weightings (Innovation 30%, Execution 30%, Polish 20%, Presentation 20%).
  - Downloadable specification documents.
  - No competitor validation errors or "squad required" toasts occur.
- **Evidence**: `docs/qa/live-testing/evidence/problem-statements/02_admin_directive_inspection.png`
- **Result**: **PASS**

### 2.4 Official Certificate Issuance Matrix (`/certificates`)
- **Route**: `https://codesrijan-nine.vercel.app/certificates`
- **Header**: `CERTIFICATE VERIFICATION & ISSUANCE` / `Official Credential Matrix`.
- **Workflow**:
  - Replaced legacy mock certificate generator.
  - Displays administrative issuance console: `Upload & Issue Official Certificates`.
  - Recipient selection dropdown populated by verified hackathon participants.
  - Certificate file selector accepting high-resolution PNG or PDF.
  - `UPLOAD & ISSUE OFFICIAL CERTIFICATE` generates cryptographic verification hash and dispatches credential to recipient's student matrix.
- **Evidence**: `docs/qa/live-testing/evidence/admin/02_certificate_issuance_console.png`
- **Result**: **PASS**

### 2.5 Squad Enforcement & Disciplinary Controls (`/recruitment`)
- **Route**: `https://codesrijan-nine.vercel.app/recruitment`
- **Admin View**: In admin mode, the recruitment page renders the **Global Squad Directorate**:
  - Displays `MATCHING SQUADS: N OF N TOTAL`.
  - Each squad card displays team captain, roster size, college affiliation, and submission status.
- **Disqualification Control (`DISQUALIFY (DIQ)`)**:
  - Clicking triggers the neo-brutalist Gavel Modal: `DISQUALIFY SQUAD`.
  - Admin enters official reason (e.g., "Plagiarized repository codebase").
  - `CONFIRM DISQUALIFY` dispatches `POST /api/admin/teams/:id/disqualify`.
  - Notifies team members and updates squad standing to disqualified.
- **Ban Control (`BAN TEAM`)**:
  - Clicking triggers the Ban Squad Modal.
  - Admin specifies infraction reason.
  - `CONFIRM BAN` revokes access tokens for team members and marks team banned.
- **Evidence**: `docs/qa/live-testing/evidence/admin/03_squad_ban_diq_controls.png`
- **Result**: **PASS**

---

## 3. Administrative Control Summary Table

| Operational Area | Action / Feature | Validation Rule | Production Status |
| :--- | :--- | :--- | :---: |
| Dashboard | Suppress Lone Wolf | If `role === 'admin'`, hide Lone Wolf banner | **VERIFIED** |
| Create Hackathon | 1200x630 Banner Upload | Replace raw URL with File Uploader | **VERIFIED** |
| Create Hackathon | 500x500 UPI QR Upload | Replace raw URL with QR File Uploader | **VERIFIED** |
| Directives | Inspect Problem Statements | Open dossier modal without squad check | **VERIFIED** |
| Certificates | Issue & Upload Credentials | Admin file upload replaces generator | **VERIFIED** |
| Team Management | DIQ / Ban Squads | Reason prompt + Real-time status update | **VERIFIED** |
