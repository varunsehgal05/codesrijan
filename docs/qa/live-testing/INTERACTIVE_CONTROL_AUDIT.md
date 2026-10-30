# CODESRIJAN — INTERACTIVE CONTROL AUDIT
**Environment**: Production (`https://codesrijan-nine.vercel.app`)  
**Commit**: `8207b73` | **Engine**: Neo-Brutalist React 18 + TanStack Router  
**Verification Date**: 2026-10-30  

---

## 1. Executive Summary & Control Surface Scope
The CodeSrijan application encompasses four distinct interactive tiers:
1. **Public Marketing & Discovery**: Landing Hero CTA, Announcements Category Switchers, Timeline View Toggles, Sponsor Grid Links, Navbar Navigation, Footer Links.
2. **Identity & Authentication**: Login Form, Registration Form, OTP Verification Matrix, Forgot Password Dispatcher, Password Reset Form.
3. **Student / Builder Cockpit**: Squad Recruitment Builder (Find/Join/Create Tabs, Candidate Filter Bar, Specialization Slotting), Problem Statement Filter Tabs, Directive Dossier Modal, Submission Uploader, Hackathon Registration & UPI Proof Verification, Discord Ticket Bot / Helpdesk, Leaderboard Search & Pagination.
4. **Administrative Governance Terminal**: Hackathon Creation 5-Step Wizard (Banner File Uploader, Tracks Manager, Problem Directives, Registration & UPI QR Uploader, Launch Review), Team Ban / Disqualification Directives, Certificate Issuance & Upload Matrix, Global User Inspection & Search, Discord Ticket Dispatcher.

---

## 2. Granular Interactive Control Inventory

### A. Public & Informational Controls
| Control Name | Location / Route | Control Type | Target Action / Endpoint | Visual & Validation State | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Register CTA** | `/` (Hero) | Button / Link | Routes to `/register` or `/dashboard` if authenticated | High-contrast brutal yellow button with hover translate | **PASS** |
| **Explore Parameters** | `/` (Tracks) | Button / Link | Routes to `/problems` with selected track query | Instant navigation, preserves filter context | **PASS** |
| **Announcements Tabs** | `/announcements` | Tab Switchers (4) | Filters notices (`ALL`, `HACKATHONS`, `SYSTEM`, `MAINTENANCE`) | Active tab marked with electric-blue fill and sharp black border | **PASS** |
| **Timeline View Switch**| `/timeline` | Button Group | Toggles Agenda view vs Calendar Grid view | Instant state toggle, zero UI latency | **PASS** |
| **Sponsor Corporate Badges**| `/sponsors` | Hyperlink Cards (5)| External redirection to partner developer portals | `target="_blank" rel="noopener noreferrer"` enforced | **PASS** |
| **Floating SrijanBot** | Global (`Navbar.tsx`)| Floating Button | Toggles AI Copilot & Support modal | Elevated `bottom-24 sm:bottom-28` (112px clearance); unobstructed | **PASS** |

---

### B. Authentication & Session Controls
| Control Name | Route | Input Types | Validation & Constraint Logic | Error State Feedback | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student / Admin Login** | `/login` | Email (`type="text"`), Password (`type="password"`) | Requires non-empty email format and password string | Inline brutal alert banner: "Authentication failed. Invalid email or password." | **PASS** |
| **Student Registration** | `/register` | Full Name, Email, Password, College, Specialization | Enforces standard email format, minimum 8-char password | Visual validation hints; redirects to `/verify-email` upon 200 OK | **PASS** |
| **6-Digit OTP Matrix** | `/verify-email` | 6 Individual Numeric Cells | Auto-focus advance on digit entry, backspace back-navigation | Immediate feedback on incorrect OTP code | **PASS** |
| **Session Terminate** | Global (`Navbar` / `/dashboard`) | Button | Purges `codesrijan_auth_token` and Firebase session; routes `/` | Instant state reset without lingering cached credentials | **PASS** |

---

### C. Student / Builder Workflow Controls
| Control Name | Route | Input / Trigger | Operation Details | Fail-Safe & Boundary Protection | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Squad Filter Tabs** | `/recruitment` | Tab Buttons (`FIND`, `JOIN`, `CREATE`) | Switches view between browsing squads, entering invitation token, or creating new squad | Prevents duplicate squad creation if user is already squad captain | **PASS** |
| **Specialization Slotting** | `/recruitment` | 7 Filter Badges | Filters candidates by `UI/UX`, `FRONTEND`, `BACKEND`, `FULLSTACK`, `AI/ML`, `CYBERSECURITY` | Real-time client-side filter against active candidate pool | **PASS** |
| **Problem Track Filters** | `/problems` | 5 Filter Pills | Filters problem statements (`ALL`, `AI`, `WEB3`, `SYSTEMS`, `FINTECH`) | Handles unrevealed/classified directive states cleanly | **PASS** |
| **Directive Dossier Modal** | `/problems` | Button | Opens in-depth problem constraints, evaluation rubric, and sample test cases | Backdrop click-outside and `ESC` key dismiss modal cleanly | **PASS** |
| **Support Helpdesk Ticket**| `/support` | Button & Modal Form | Triggers ticket creation with Category dropdown and description textarea | Validates required fields; notifies support channel instantly | **PASS** |
| **Leaderboard Search** | `/leaderboard`| Input Searchbox | Searches squad names and college affiliations | Debounced search input; paginated 10 entries per slice | **PASS** |

---

### D. Administrative Governance Controls
| Control Name | Route | Control Elements | Operational Capability | Safeguards & Authorization Checks | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hackathon Wizard Step 1** | `/admin/hackathons` | Banner File Upload Box (`1200x630`) | Replaced raw URL input with drag-and-drop / click file upload | Accepts PNG/JPG/WEBP; auto-encodes to high-performance data URI | **PASS** |
| **Hackathon Wizard Step 4** | `/admin/hackathons` | UPI QR File Upload Box (`500x500`) | Replaced raw URL input with dedicated image file uploader | Visual preview thumbnail rendered instantly on file selection | **PASS** |
| **Squad Ban Directive** | `/recruitment` | Button -> Confirmation Modal | Opens Ban modal requiring reason string before disabling team | Disables team submission privileges and marks status `BANNED` | **PASS** |
| **Squad Disqualify** | `/recruitment` | Button -> Gavel Modal | Opens Disqualification modal with reason requirement | Updates squad standing to `DISQUALIFIED` across leaderboard | **PASS** |
| **Certificate Upload & Issue** | `/certificates` | Upload & Issue File Trigger | Replaced auto-generator with admin upload workflow | Admin uploads authorized PDF/image certificates for recipients | **PASS** |
| **User Ban / Role Toggle** | `/admin/users` | Action Menus | Inspects user metadata, toggles administrative permissions | Protected by admin token check; non-admin requests receive 403 Forbidden | **PASS** |

---

## 3. Keyboard & Focus Navigation Audit
1. **Tab Order**: Sequential tab indexing verified on `/login`, `/register`, `/dashboard`, and `/admin/hackathons`. Focus rings render high-contrast 2px black outlines complying with WCAG 2.1 AA.
2. **Escape Key Handling**: All modal dialogues (Hackathon Wizard, Squad Ban Modal, Disqualification Modal, Directive Dossier, SrijanBot Drawer) intercept `keydown: Escape` and cleanly unmount without lingering overlays.
3. **Form Enter Submissions**: Single-field inputs (search, OTP cells) trigger immediate evaluation on `Enter` without requiring explicit mouse click.

---

## 4. Conclusion
All interactive controls adhere to the Neo-Brutalist design specifications. Forms enforce proper client-side validation before triggering network dispatches, file uploaders have successfully replaced raw URL inputs for banners and QR codes, and administrative controls are securely segregated from student interfaces.
