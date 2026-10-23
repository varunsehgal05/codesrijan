# CodeSrijan — Comprehensive UX & Interface Audit

**Audit Date:** 2026-10-23  
**UX Auditor:** Lead UX Researcher & Usability Tester  
**Platform Version:** Commit `4c3851c` + Local Security & Integrity Patches  
**Tested Viewports:** 1440x900 (Desktop), 1280x800 (Laptop), 768x1024 (Tablet), 375x812 (Mobile), 320x700 (Small Mobile)  

---

## 1. Executive Summary & Design System Analysis

CodeSrijan employs a high-energy **Neo-Brutalist design language** characterized by:
- 2px to 4px solid black borders (`brutal-border`, `border-stark-black`)
- Flat, non-blurred offset drop-shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`)
- High-contrast color palette: Electric Blue (`#3B82F6`), Alert Amber (`#F59E0B`), Rose Error (`#F43F5E`), Stark Black (`#0A0A0A`), Pure White (`#FFFFFF`)
- Monospaced technical typography (`font-code-snippet`) paired with bold condensed display headings (`font-display-lg`)

Overall, the design language delivers a distinctive, competitive esports/cyber-tournament feel. However, several UX rough edges, validation feedback gaps, and workflow ambiguities were identified during comprehensive journey walkthroughs.

---

## 2. Categorized UX Defects & Usability Findings

### Category 1: Trust, Transparency & Payment UX

#### Issue UX-001 (Priority P1 — High): Unclear Fee Basis on Tournament Registration Form
- **Route:** `/hackathons/:id/register`
- **Role Affected:** Student Team Leader
- **Observed Behavior:** The payment card displays a total amount (e.g. ₹300) without prominently explaining whether the fee is calculated *per team* or *per participant*.
- **Expected Behavior:** An explicit fee breakdown: *"Tournament Fee: ₹150/participant × 2 verified operatives = ₹300 total"*.
- **Usability Impact:** Causes hesitation during checkout; leaders worry they are overcharged.
- **Recommended Fix:** Add a dynamic calculation breakdown callout above the payment QR code showing `rosterMembers.length × feePerParticipant`.
- **Status:** Documented for frontend UI enhancement.

#### Issue UX-002 (Priority P2 — Medium): Ambiguous "Awaiting Payment Review" Status Wording
- **Route:** `/payment`, `/dashboard`
- **Role Affected:** Student
- **Observed Behavior:** After submitting UTR and screenshot, status badge displayed as "PAYMENT UNDER REVIEW". Some users confused this with "Payment Failed" or "Unpaid".
- **Expected Behavior:** Clear explanatory badge: *"Proof Submitted — Administrator Review in Progress (SLA: 2-4 Hours)"*.
- **Usability Impact:** Prompts redundant support tickets asking if payment was received.
- **Recommended Fix:** Update badge label and provide an informational tooltip explaining the manual verification SLA.
- **Status:** Documented for UI polish.

---

### Category 2: Squad Formation & Invitations UX

#### Issue UX-003 (Priority P1 — High): Hidden Prerequisite for Inviting Teammates (`BUG-TEAM-001`)
- **Route:** `/team`
- **Role Affected:** Student Team Leader & Invitee
- **Observed Behavior:** When a leader enters an operative's ID to invite them, the server returns an error *"Operative is not registered for this event."* The UI previously gave no clear hint to the leader that the invited student had to register solo first.
- **Expected Behavior:** If the invitee is not registered, the UI should offer an automated invite link or prompt: *"Operative has not yet joined this tournament. Share this invite link with them to auto-enroll: `/invite/:token`"*.
- **Usability Impact:** High friction during team formation; users assume the system is broken.
- **Remediation Implemented:** Backend now cleans up placeholder solo registrations upon team registration, and frontend deep link `/invite/:token` safely preserves context.
- **Status:** **Remediated**.

#### Issue UX-004 (Priority P2 — Medium): Lack of Warning Before Roster Permanent Lock
- **Route:** `/hackathons/:id/register`
- **Role Affected:** Team Leader
- **Observed Behavior:** Clicking "CONFIRM REGISTRATION" permanently locks the squad roster (`isLocked: true`) without an explicit confirmation dialog warning that members cannot be added or changed afterward.
- **Expected Behavior:** A confirmation modal: *"Warning: Registering your squad will permanently lock your roster. No members can be added, removed, or transferred after registration. Continue?"*
- **Usability Impact:** Leaders who accidentally register before their full 4-person squad has joined find their roster locked with incomplete members.
- **Recommended Fix:** Wrap the registration submission in a modal confirmation dialog.
- **Status:** Recommended for next frontend release.

---

### Category 3: Forms, Validation & Feedback

#### Issue UX-005 (Priority P2 — Medium): Missing Server Error Display on Malformed Registration
- **Route:** `/register`
- **Role Affected:** New Student
- **Observed Behavior:** When server returned 400 for malformed email or duplicate account, the error message in some network states appeared only in browser console or generic toast rather than inline beside the offending field.
- **Expected Behavior:** Inline red highlight with descriptive error message directly beneath the email field.
- **Usability Impact:** Users on mobile devices with toast notifications hidden may not understand why the form did not submit.
- **Recommended Fix:** Bind server response error fields to react-hook-form / Zod field states.
- **Status:** Documented for polish.

#### Issue UX-006 (Priority P3 — Low): FAQ Accordion Focus Indicator
- **Route:** `/faq`
- **Role Affected:** Keyboard / Screen Reader Users
- **Observed Behavior:** In high-contrast dark mode, the active outline focus indicator on expanded accordion headers had low visual contrast against the dark background.
- **Expected Behavior:** High-visibility 2px solid cyan/electric-blue outline on `:focus-visible`.
- **Usability Impact:** Keyboard navigation accessibility can be improved for low-vision users.
- **Recommended Fix:** Add `focus-visible:ring-2 focus-visible:ring-electric-blue` to accordion triggers.
- **Status:** Documented in Accessibility Audit.

---

### Category 4: Admin Oversight & Workflow UX

#### Issue UX-007 (Priority P2 — Medium): Payment Queue Filter Tab Persistence
- **Route:** `/admin/payments`
- **Role Affected:** Administrator
- **Observed Behavior:** When an administrator approves or rejects a payment on the "Pending" tab, the page re-fetches and occasionally resets the active tab back to "All".
- **Expected Behavior:** The active tab selection ("Pending", "Verified", "Rejected") should be stored in URL search parameters (`?tab=pending`) so page state is retained across actions.
- **Usability Impact:** Admins reviewing large batches of payments lose their place after every review decision.
- **Recommended Fix:** Sync tab state with TanStack Router search params.
- **Status:** Documented for admin portal refinement.

---

## 3. UX Priority Breakdown

| Priority | Definition | Count |
| :--- | :--- | :---: |
| **P0 / Critical** | Workflow completely blocked or financial state confusing | 0 |
| **P1 / High** | Significant friction in core workflow (fee breakdown, invite prerequisites) | 2 |
| **P2 / Medium** | Feedback delay, missing confirmation modal, or lost tab state | 4 |
| **P3 / Low** | Focus outline, cosmetic spacing, or minor copy adjustments | 1 |
| **Total UX Findings** | | **7** |
