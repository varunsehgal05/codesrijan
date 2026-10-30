# STRATEGIC QUESTIONS FOR THE CODESRIJAN PRODUCT OWNER

**Document ID:** `QUESTIONS_FOR_CODESRIJAN_OWNER.md`  
**Date:** October 30, 2026  
**Auditor:** Principal Product Architect & CTO  
**Purpose:** These questions address foundational business models, legal governance, and operational policies that **cannot be resolved through code inspection** and require authoritative decisions from the Product Owner before the next development sprint.

---

## QUESTION 1: Single-Tenant Flagship Host vs Multi-Tenant Self-Serve SaaS

### 1. Why the Decision Matters
CodeSrijan was originally built as a dedicated platform for CodeSrijan's own flagship hackathons. If we open it to external colleges and organizations (allowing them to self-serve create, manage, and collect money for their own hackathons), we must fundamentally rewrite our user models, authentication scopes, data isolation layers, and URL structures.

### 2. Available Options
* **Option A (Flagship Model):** CodeSrijan remains the sole event brand. External colleges partner with CodeSrijan as co-hosts, but the central CodeSrijan admin team configures and publishes all events.
* **Option B (Multi-Tenant SaaS / "Devpost for India"):** Any college club, university, or tech community can sign up, create an organization profile, and host an independent hackathon with their own isolated branding, judges, and participants.

### 3. Recommendation
**Adopt a Hybrid "Verified Organizer" Model (Option B with gated approval).**  
Allow external colleges to apply for an Organizer account, but require central super-admin approval before their event can go live.

### 4. Advantages & Disadvantages
* **Option A (Flagship):**
  * *Pros:* Zero architectural complexity; high quality control; zero risk of rogue organizers scamming students.
  * *Cons:* Severe growth ceiling; heavy operational overhead on your team for every single event.
* **Option B (Multi-Tenant):**
  * *Pros:* Exponential viral network effects; colleges across India adopt CodeSrijan as their standard hackathon operating system.
  * *Cons:* Requires tenant data partitioning, organizer KYC verification, and potential dispute handling.

### 5. Architectural Impact
Requires adding `organizationId` to `User`, `Hackathon`, `Team`, and `Registration` models, introducing an `organizer` user role, and building an isolated `/organizer/*` dashboard.

---

## QUESTION 2: Payment Gateway Integration vs Manual UPI QR Verification

### 2.1 Why the Decision Matters
Currently, students scan a static UPI QR code and upload a screenshot with a 12-digit UTR number. This achieves a $0.00/month infrastructure cost with 0% payment processing fees, but requires human administrators to manually inspect every receipt.

### 2.2 Available Options
* **Option A (Keep Manual UPI QR):** Free, direct to organizer's bank, zero gateway commission, but 100% manual review.
* **Option B (Automated Payment Gateway - Razorpay/Cashfree):** Instant automatic clearance via webhooks, automated receipt generation, but incurs a ~2% + GST fee per transaction and requires a registered Indian corporate entity (Pvt Ltd / LLP) with business KYC.
* **Option C (Dual Mode):** Allow organizers to choose either automated Razorpay (if they have credentials) or manual UPI QR fallback.

### 2.3 Recommendation
**Implement Option C (Dual Mode with Manual Fallback).**  
Keep the zero-cost manual UPI QR as the default for student organizers without corporate entities, but allow institutional organizers to plug in their Razorpay API keys for instant webhook clearance.

### 2.4 Advantages & Disadvantages
* *Manual UPI:*
  * *Pros:* $0 overhead, no transaction fees, accessible to college clubs without bank accounts.
  * *Cons:* Human bottleneck; students can be blocked at 11:59 PM waiting for an admin to verify payment.
* *Automated Gateway:*
  * *Pros:* Instant verification; zero manual labor; automated refund APIs.
  * *Cons:* 2% fee; requires registered legal entity.

### 2.5 Architectural Impact
Introduces a webhook listener endpoint (`POST /api/payments/webhook`) and a `PaymentTransaction` collection.

---

## QUESTION 3: Platform Monetization & Financial Custody

### 3.1 Why the Decision Matters
If external organizers collect registration fees on CodeSrijan, who holds the money, and does CodeSrijan charge for platform usage?

### 3.2 Available Options
* **Option A (Pure Zero-Fee Platform):** CodeSrijan takes 0% commission. Organizers collect 100% of registration fees directly into their own accounts. Platform remains free or monetizes solely through enterprise sponsor placement.
* **Option B (Platform Fee / Commission):** CodeSrijan charges organizers a flat fee per event (e.g. ₹2,999/event) or takes a 5% platform fee on all paid ticket sales.
* **Option C (Escrow & Settlement):** CodeSrijan collects all registration fees into a central platform account and disburses payouts to organizers after the hackathon successfully concludes.

### 3.3 Recommendation
**Option A for student clubs, transitioning to Option B for commercial hackathons.**  
Do **NOT** take custody of funds (avoid Option C). Escrowing funds makes CodeSrijan legally liable for organizer fraud, GST compliance, and refund disputes under Indian consumer protection laws.

### 3.4 Advantages & Disadvantages
* *Option A (Direct):* Zero legal liability for refunds; zero tax withholding overhead.
* *Option C (Escrow):* Heavy accounting burden; requires payout ledger and bank KYC.

### 3.5 Architectural Impact
Option A requires zero backend accounting changes. Option C would require a complete banking reconciliation ledger and payout engine.

---

## QUESTION 4: Refund Policy & Event Cancellation Liability

### 4.1 Why the Decision Matters
If an organizer postpones or cancels an event after 200 students paid ₹100 each (₹20,000 total), what is the system workflow and legal policy?

### 4.2 Available Options
* **Option A (Strict No-Refund Policy):** Clearly stated in the Terms of Service: registration fees are non-refundable under all circumstances.
* **Option B (Organizer-Managed Refunds):** Students request refunds via the dashboard; organizers are given a refund management queue to confirm bank transfers.
* **Option C (Automated Gateway Reversal):** If an event is cancelled, the system automatically triggers API refunds via Razorpay.

### 4.3 Recommendation
**Option B (Organizer-Managed Refund Queue) with prominent Terms of Service disclaimers.**  
Display an explicit notice during registration: *"Entry fees are remitted directly to the host institution. CodeSrijan does not hold ticket funds and is not liable for organizer refunds."*

### 4.4 Advantages & Disadvantages
* Protects CodeSrijan from financial exposure while giving honest organizers a structured ledger to log refunds.

### 4.5 Architectural Impact
Adds a refund request state machine to `Registration` (`refund_requested` -> `refund_completed`).

---

## QUESTION 5: Competition Deliberation: Blind Evaluation & Score Normalization

### 5.1 Why the Decision Matters
In collegiate hackathons, judges often favor students from prestigious tier-1 institutes (e.g. IITs, BITS) over tier-3 colleges. Furthermore, variation between strict and lenient judges currently distorts rankings.

### 5.2 Available Options
* **Option A (Status Quo):** Judges see full team rosters and college affiliations; raw average score determines the leaderboard.
* **Option B (Strict Blind Judging):** All team names, member names, and college logos are completely anonymized in `/evaluations` (e.g. `Squad #104 - Web3 Track`).
* **Option C (Blind Judging + Statistical Z-Score Normalization):** Anonymized evaluation combined with statistical score normalization to equalize strict and generous judges.

### 5.3 Recommendation
**Option C.** Blind judging with z-score normalization creates the gold standard for competition integrity and positions CodeSrijan as the fairest hackathon platform in India.

### 5.4 Advantages & Disadvantages
* *Pros:* 100% fair; eliminates bias and judge variance; builds immense student trust.
* *Cons:* Requires educating judges on why raw scores are normalized before leaderboard publishing.

### 5.5 Architectural Impact
Requires adding a score normalization pipeline in `server/server.js` and an anonymity masking layer in `src/routes/evaluations.tsx`.

---

## QUESTION 6: Physical Event Operations & Attendance Check-In

### 6.1 Why the Decision Matters
If CodeSrijan is used for in-person university hackathons, how should organizers manage venue door admission, meal passes, and physical attendance?

### 6.2 Available Options
* **Option A (Pure Online Platform):** CodeSrijan handles only digital submissions, chat, and judging; physical logistics are handled via external tools or paper.
* **Option B (Integrated QR Badge & Volunteer Scanner):** Generate a dynamic QR badge on the student's dashboard; provide a `/volunteer/checkin` camera scanner route for student volunteers at venue doors.

### 6.3 Recommendation
**Option B.** QR check-in is the single most celebrated feature by on-ground college event organizers and differentiates CodeSrijan from generic web tools.

### 6.4 Advantages & Disadvantages
* *Pros:* Massive organizer delight; eliminates physical lines; provides real-time "Actual Attendees vs No-Shows" telemetry.
* *Cons:* Requires building a dedicated volunteer role and camera-based QR scanner view.

### 6.5 Architectural Impact
Adds `checkedIn: Boolean` and `checkedInAt: Date` to the `Registration` model, and creates a lightweight volunteer scanner PWA route.

---

## QUESTION 7: Post-Submission Code Plagiarism & Integrity Verification

### 7.1 Why the Decision Matters
A persistent plague of college hackathons is students submitting pre-built projects developed months prior, or copying public boilerplate repositories without modification.

### 7.2 Available Options
* **Option A (Judge Discretion):** Leave originality verification entirely up to judges inspecting GitHub repos manually.
* **Option B (Automated GitHub Commit Timeline Check):** Backend pings GitHub API upon submission to verify that commits were pushed within the official hackathon hours.
* **Option C (Full Plagiarism & AI Detection):** Compare AST (abstract syntax tree) fingerprints across all submissions in the track to detect copied codebases.

### 7.3 Recommendation
**Option B (GitHub Commit Timeline Validation).**  
Verifying that repository commits align with event timestamps provides 80% of plagiarism prevention at near-zero computational overhead.

### 7.4 Advantages & Disadvantages
* *Pros:* Prevents submission of old legacy repos; zero extra work for judges.
* *Cons:* Requires students to commit and push code with accurate git timestamps during the event.

### 7.5 Architectural Impact
Integrates GitHub REST API repository commit metadata check in `POST /api/submissions`.

---

## Summary Matrix of Required Owner Decisions

| # | Strategic Question | Owner Options | CTO Recommended Path | Business Impact |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Multi-Tenant Model | Flagship Only vs Open SaaS | **Hybrid Gated Organizer** | High Growth + Brand Safety |
| **2** | Payment Pipeline | Manual QR vs Razorpay Gateway | **Dual Mode (Manual Default)** | $0/mo Cost + Corporate Scale |
| **3** | Monetization | Free vs Commission vs Flat Fee | **Direct Remit (0% Custody)** | Zero Legal / Escrow Liability |
| **4** | Refund Responsibility | No-Refunds vs Org Ledger | **Org Refund Ledger + Disclaimer** | Legal Protection from Chargebacks |
| **5** | Judging Integrity | Raw Average vs Blind Z-Score | **Blind Judging + Z-Score** | Supreme Collegiate Trust |
| **6** | On-Site Check-In | None vs QR Volunteer Scanner | **QR Badges + Mobile Scanner** | On-Ground Venue Domination |
| **7** | Code Plagiarism | Judge Discretion vs Git Timeline| **Automated GitHub Timeline** | Fair Play Enforcement |

---

*Authored for executive discussion with the Product Owner and ChatGPT.*
