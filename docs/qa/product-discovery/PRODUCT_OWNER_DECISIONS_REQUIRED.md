# CODESRIJAN — PRODUCT OWNER DECISIONS REQUIRED
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-16` | **Focus**: Strategic Business Rules & Architecture Alignment  
**Role**: Executive Decision Briefing for Platform Stakeholders  

---

## 1. Executive Briefing
To ensure CodeSrijan is engineered to the exact operational needs of collegiate and community organizers, 25 critical business decisions must be established by the product owner before feature implementation begins. Every decision details why it matters, options available, trade-offs, and recommended pathways.

---

## 2. The 25 Strategic Decision Dossiers

### Decision 1: External Organizers Policy
- **Why It Matters**: Dictates whether CodeSrijan is an internal collegiate tool or an open SaaS ecosystem like Devfolio/Unstop.
- **Options**:
  - *Option A*: Single-tenant (Only CodeSrijan administrators create events).
  - *Option B*: Open self-serve (Any user can launch events immediately).
  - *Option C (Recommended)*: **Vetted Multi-Tenant** (External colleges and tech clubs apply via `/host-event` and are approved by CodeSrijan Super-Admins).
- **Pros & Cons of Option C**:
  - *Pros*: Protects platform reputation, prevents scam events, while enabling scalable multi-college adoption.
  - *Cons*: Requires an administrative review queue.
- **Architectural Impact**: Requires adding `Organization` entity and `organizationId` foreign key to `Hackathon`.

---

### Decision 2: Organizer Verification & Approval Gate
- **Why It Matters**: Hackathons collecting registration fees or promising cash prizes must be legally and operationally accountable.
- **Options**:
  - *Option A*: Automated email verification only.
  - *Option B (Recommended)*: **Document / College Email Verification** (Requires official faculty advisor letter, verified college email `@college.edu`, or student council letter).
- **Architectural Impact**: Creates `/admin/host-requests` dashboard with approve/reject workflow.

---

### Decision 3: Multi-Admin Support per Organization
- **Why It Matters**: Student organizing committees have 5-15 core members (Design, Tech, Logistics, Finance).
- **Options**:
  - *Option A*: Single login shared among organizers (Insecure).
  - *Option B (Recommended)*: **Organization Team Membership** (One Org Owner invites Staff with granular permissions: Admin, Judge, Moderator, Check-in Staff).
- **Architectural Impact**: Creates `OrganizationMember` role mapping.

---

### Decision 4: Admission Model (Free vs Paid Events)
- **Why It Matters**: Determines whether the platform processes financial data.
- **Options**:
  - *Option A*: 100% Free events only.
  - *Option B (Recommended)*: **Dual Capability** (Organizers choose Free Admission OR Paid Admission with configurable ticket fees).
- **Architectural Impact**: Current Step 4 of the hackathon creation wizard already supports both free and paid toggles.

---

### Decision 5: Long-Term Platform Monetization
- **Why It Matters**: Ensures long-term sustainability while respecting the current $0.00/month operational budget.
- **Options**:
  - *Option A*: 100% Free forever (Non-profit collegiate community).
  - *Option B (Recommended)*: **Freemium Platform** (₹0 platform fee for free collegiate events; 3% - 5% commission on ticket fees for paid events; enterprise licensing for corporate recruiters).

---

### Decision 6: Payment Processing Mechanism (Manual UPI vs Gateway)
- **Why It Matters**: Student hackathons in India often lack registered corporate bank accounts required by Stripe or Razorpay.
- **Options**:
  - *Option A*: Manual UPI QR verification only (Current model).
  - *Option B*: Mandatory payment gateway (Excludes student clubs).
  - *Option C (Recommended)*: **Hybrid Model** (Manual UPI verification for student societies; Automated Razorpay gateway for verified corporate/college entities).

---

### Decision 7: Financial Liability for Refunds
- **Why It Matters**: If a participant pays ₹200 and requests a refund, who handles the payout?
- **Recommended Policy**: **Organizer Direct Liability**. For manual UPI payments, money flows directly to the organizer's bank account via their QR code. The event organizer is legally responsible for issuing manual UPI refunds upon written request.

---

### Decision 8: Prize Pool Escrow & Distribution
- **Why It Matters**: Avoids fraudulent organizers promising ₹50,000 and disappearing.
- **Recommended Policy**: In Phase 1, organizers directly distribute prizes and upload signed disbursement receipts (`PRIZE_RECEIPT_SUBMITTED`). In Phase 2, optional platform escrow for verified sponsors.

---

### Decision 9: Registration Waitlists & Over-Capacity
- **Why It Matters**: Physical venues have strict fire safety limits (e.g. 200 builders).
- **Options**:
  - *Option A*: Hard stop (Registration closes immediately at capacity).
  - *Option B (Recommended)*: **Waitlist Queue** (When capacity is reached, additional teams join waitlist; if a confirmed team cancels, waitlisted squads are promoted in order).

---

### Decision 10: Post-Deadline Squad Changes
- **Why It Matters**: Unfair advantage if top builders join winning squads after seeing problem statements.
- **Recommended Policy**: **Strict Roster Freeze**. Once the registration window closes, team rosters lock automatically. Emergency substitutions require organizer approval.

---

### Decision 11: Solo Hackers ("Lone Wolf") Policy
- **Why It Matters**: Can a single builder compete alone, or are teams of 2-4 mandatory?
- **Recommended Policy**: **Organizer Configurable Bounds**. Each event specifies `teamSizeMin` (e.g. 1) and `teamSizeMax` (e.g. 4). Solo hackers are supported if `teamSizeMin === 1`.

---

### Decision 12: Multi-Stage Hackathons (Rounds)
- **Why It Matters**: Major hackathons have Round 1 (Ideation / PPT submission) and Round 2 (24-hour prototype build).
- **Recommended Policy**: Phase 1 supports single-stage 24/48-hour sprints. Phase 2 introduces multi-stage shortlist progression.

---

### Decision 13: Emergency Deadline Extension Policy
- **Why It Matters**: Technical or network outages during live events require extending submission times.
- **Recommended Policy**: Organizers can extend the submission deadline from `/admin/hackathons`. The system pushes real-time countdown updates via WebSockets and logs the extension reason in the audit trail.

---

### Decision 14: Official Judging Tie-Breaking Rules
- **Recommended Policy**:
  1. Score in primary technical criterion ("Technical Complexity").
  2. Score in innovation criterion ("Originality").
  3. Earliest final submission timestamp.

---

### Decision 15: Blind Judging Mode
- **Recommended Policy**: **Optional Per-Event Toggle**. When enabled, evaluator dashboards mask team and college names to ensure merit-based scoring.

---

### Decision 16: Participant Appeal Window
- **Recommended Policy**: A provisional 2-hour window between evaluation completion and final awards, allowing teams to flag factual submission access errors.

---

### Decision 17: Certificate Issuance Approval Model
- **Recommended Policy**: **Directorate Verified Issuance**. System generates certificates for confirmed participants and winners only after administrative sign-off.

---

### Decision 18: Physical Venue QR Attendance Scanning
- **Recommended Policy**: Implement mobile camera-based QR scanner on `/staff/checkin` to log physical presence and assign table numbers for offline events.

---

### Decision 19: Event Staff & Volunteer Roles
- **Recommended Policy**: Provide lightweight `event_staff` role restricted to check-in scanning and mentor routing without access to financial or scoring controls.

---

### Decision 20: Public vs Private Data Transparency
- **Recommended Policy**: Publicly display team names, project titles, GitHub repos, and demo videos. Keep participant phone numbers, emails, and payment screenshots private.

---

### Decision 21: Event Cancellation Consequences
- **Recommended Policy**: When an event is marked `CANCELLED`, all participant cockpits reflect cancellation notices, submission gates disable, and the organizer is prompted to complete refund acknowledgments.

---

### Decision 22: Fee Policy on Event Cancellation
- **Recommended Policy**: Mandatory 100% refund of registration fees within 7 business days by the host organizer.

---

### Decision 23: Organizer Analytics Access
- **Recommended Policy**: Organizers gain full access to their own event telemetry (registrations, funnel drop-off, track popularity, judging progress) via `/admin/analytics`.

---

### Decision 24: Super-Admin Global Governance Scope
- **Recommended Policy**: Super-admins have read/audit access across all platform entities and the exclusive power to suspend abusive organizations or ban bad actors platform-wide.

---

### Decision 25: Minimum Viable Product (MVP) Release Scope
- **Recommended MVP Gate**:
  - Focus on Rock-Solid Core: Multi-event discovery, squad recruitment with specialization slotting, manual UPI verification with duplicate UTR protection, timed problem statement unlock, GitHub repo validation, weighted rubric evaluations, verified digital certificates, and Discord ticket helpdesk.

