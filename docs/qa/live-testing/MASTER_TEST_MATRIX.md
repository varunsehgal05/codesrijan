# CODESRIJAN — MASTER TEST MATRIX & EMPIRICAL EVIDENCE
**Environment**: Production Live (`https://codesrijan-nine.vercel.app`)  
**Backend API**: `https://codesrijan-api-6tfr.onrender.com/api`  
**Browser Engine**: Real Chrome CDP connected on `127.0.0.1:9222`  
**Execution Date**: 2026-10-30  
**Overall Result**: **29 / 29 PASSED (100.0%)**  

---

## 1. Master Empirical Test Execution Matrix

| Test ID | Testing Area | Form Factor | Active Role | Executed Action | Expected Result | Actual Production State | Verdict | Evidence Artifact |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **TC-PUB-01** | Landing & Navbar | Chrome (1440) | Anonymous | Navigate to `/` | Branding logo rendered in navbar | `codesrijan-icon.png` verified | **PASS** | `evidence/public-pages/01_landing.png` |
| **TC-PUB-02** | About Platform | Chrome (1440) | Anonymous | Navigate to `/about` | Official brand showcase & insignia rendered | Insignia & overview verified | **PASS** | `evidence/public-pages/02_about.png` |
| **TC-PUB-03** | Announcements | Chrome (1440) | Anonymous | Switch 4 category tabs on `/announcements` | Tab filtering updates bulletins client-side | 4 tabs filter dynamically without reload | **PASS** | `evidence/public-pages/03_announcements.png` |
| **TC-PUB-04** | Sponsor Grid | Chrome (1440) | Anonymous | Inspect `/sponsors` | At least 4 corporate sponsor SVGs rendered | 5 corporate SVGs verified | **PASS** | `evidence/public-pages/04_sponsors.png` |
| **TC-PUB-05** | Timeline | Chrome (1440) | Anonymous | Navigate to `/timeline` | Interactive roadmap milestones render | Timeline nodes rendered | **PASS** | `evidence/public-pages/05_timeline.png` |
| **TC-AUTH-01**| Login Validation | Chrome (1440) | Anonymous | Submit invalid credentials on `/login` | HTTP 401 & safe rejection alert | Rejection banner: "Invalid matrix passkey" | **PASS** | `evidence/authentication/01_invalid_login.png` |
| **TC-AUTH-02**| Student Auth | Chrome (1440) | Student | Submit `student@codesrijan.com` credentials | JWT Bearer token stored in `localStorage` | Token stored in `codesrijan_auth_token` | **PASS** | `evidence/authentication/02_student_authenticated.png` |
| **TC-STUD-01**| Student Dashboard| Chrome (1440) | Student | Navigate to `/dashboard` | Operative identity & squad status rendered | Student dashboard rendered cleanly | **PASS** | `evidence/student/01_student_dashboard.png` |
| **TC-STUD-02**| Problem Directives| Chrome (1440) | Student | Navigate to `/problems` | Track filters & security lifecycle active | Directives portal active with security state | **PASS** | `evidence/problem-statements/01_problems_track_filters.png` |
| **TC-STUD-03**| Recruitment | Chrome (1440) | Student | Navigate to `/recruitment` | Squad builder & specialization slotting | Squad Builder & slotting active | **PASS** | `evidence/teams/01_squad_recruitment.png` |
| **TC-STUD-04**| Certificates | Chrome (1440) | Student | Navigate to `/certificates` | Official Certificate Matrix rendered | Matrix rendered with verified hashes | **PASS** | `evidence/student/02_certificates_matrix.png` |
| **TC-STUD-05**| Support Helpdesk | Chrome (1440) | Student | Navigate to `/support` | Discord Ticket Bot channel operational | Discord Ticket Bot active with TALK TO ADMIN | **PASS** | `evidence/support-chat/01_support_transmissions.png` |
| **TC-STUD-06**| Leaderboard | Chrome (1440) | Student | Navigate to `/leaderboard` | Live squad rankings rendered | Leaderboard standings verified live | **PASS** | `evidence/student/03_leaderboard.png` |
| **TC-ADM-01** | Admin Governance | Chrome (1440) | Admin | Navigate to admin `/dashboard` | Governance Directorate present, Lone Wolf absent | Governance present, Lone Wolf strictly absent | **PASS** | `evidence/admin/01_admin_governance_dashboard.png` |
| **TC-ADM-02** | Wizard Step 1 | Chrome (1440) | Admin | Open Create Hackathon Step 1 | Banner file uploader with `1200 x 630` badge | File uploader & `1200 x 630` badge verified | **PASS** | `evidence/admin/02_hackathon_step1_banner.png` |
| **TC-ADM-03** | Wizard Step 4 | Chrome (1440) | Admin | Select Paid Entry on Step 4 | Payment QR uploader with `500 x 500` badge | QR uploader & `500 x 500` badge verified | **PASS** | `evidence/admin/04_hackathon_step4_qr.png` |
| **TC-ADM-04** | Directive Dossier | Chrome (1440) | Admin | Click `INSPECT DIRECTIVE` on `/problems` | Dossier modal opens without squad error | Directive Dossier modal opens cleanly | **PASS** | `evidence/problem-statements/02_admin_inspect_directive.png` |
| **TC-ADM-05** | Certificate Console| Chrome (1440)| Admin | Navigate to `/certificates` | Upload & Issue Official Certificates console | Issuance console active with file uploader | **PASS** | `evidence/admin/05_admin_certificates_upload.png` |
| **TC-ADM-06** | Squad Discipline | Chrome (1440) | Admin | Inspect `/recruitment` for moderation | Disciplinary actions (`DIQ`, `BAN TEAM`) present| DIQ and Ban controls verified per squad | **PASS** | `evidence/admin/06_admin_recruitment_governance.png` |
| **TC-UI-01**  | SrijanBot Elevation| Chrome (1440)| Anonymous | Measure floating trigger bottom clearance | Trigger elevated `>= 80px` above window bottom | Trigger elevated at 112px clearance | **PASS** | `evidence/responsive-ui/bot_button_elevation.png` |
| **TC-RESP-1440**| Desktop Viewport | Chrome (1440x900)| Anonymous | Render full landing page at 1440x900 | Zero horizontal overflow, full grid | Zero overflow (`scrollWidth === innerWidth`) | **PASS** | `evidence/responsive-ui/desktop_1440.png` |
| **TC-RESP-1366**| Laptop Viewport | Chrome (1366x768)| Anonymous | Render landing page at 1366x768 | Zero horizontal overflow, compact layout | Zero overflow | **PASS** | `evidence/responsive-ui/laptop_1366.png` |
| **TC-RESP-768** | Tablet Viewport | Chrome (768x1024)| Anonymous | Render landing page at 768x1024 | Zero horizontal overflow, 2-column stack | Zero overflow | **PASS** | `evidence/responsive-ui/tablet_768.png` |
| **TC-RESP-390** | Mobile Viewport | Chrome (390x844)| Anonymous | Render landing page at 390x844 | Zero horizontal overflow, single-column stack| Zero overflow | **PASS** | `evidence/responsive-ui/mobile_390.png` |
| **TC-RESP-320** | Narrow Mobile | Chrome (320x700)| Anonymous | Render landing page at 320x700 | Zero horizontal overflow, compact touch targets| Zero overflow | **PASS** | `evidence/responsive-ui/narrow_mobile_320.png` |
| **TC-API-01** | API Health Gateway| Node / HTTPS | System | `GET /api/health` | HTTP 200 OK with connected database | HTTP 200 OK, database `codesrijan` active | **PASS** | N/A (Live HTTP Response) |
| **TC-DB-01**  | Hackathons Invariant| Node / HTTPS | System | `GET /api/hackathons` | Exactly 2 production hackathons preserved | Exactly 2 records confirmed | **PASS** | N/A (Live MongoDB Query) |
| **TC-DB-02**  | User Accounts Invariant| Node / HTTPS| Admin | `GET /api/users` | Strictly 8 user accounts preserved | Strictly 8 accounts confirmed | **PASS** | N/A (Live MongoDB Query) |
| **TC-SEC-01** | RBAC Protection | Node / HTTPS | Anonymous | `GET /api/users` (unauthenticated) | HTTP 401 Unauthorized | HTTP 401 Access Denied enforced | **PASS** | N/A (Live HTTP Response) |

---

## 2. Summary Statistics
- **Total Test Cases Executed**: 29
- **Passed**: 29
- **Failed**: 0
- **Blocked**: 0
- **Execution Success Rate**: **100.0%**
