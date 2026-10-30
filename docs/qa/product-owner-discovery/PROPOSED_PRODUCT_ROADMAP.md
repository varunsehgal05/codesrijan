# CODESRIJAN — PROPOSED PRODUCT ROADMAP (PHASED EXECUTION)

**Roadmap Version:** 3.0  
**Date:** October 30, 2026  
**Architect:** Chief Technology Officer & Principal Systems Architect  
**Engineering Constraints:** Strict Zero-Cost Operating Model ($0.00/month infrastructure budget)  

---

## Roadmap Overview & Strategic Horizon

```
[Phase 1: Integrity & Security Hardening] ──► [Phase 2: Live Venue Operations & UX]
                       │                                      │
                       ▼                                      ▼
[Phase 3: Multi-Tenant Organizer Engine]  ──► [Phase 4: Ecosystem & Enterprise Scale]
```

---

## Phase 1: Security Hardening, Competition Integrity & Zero-Budget Resilience
* **Objective:** Close critical security boundaries, eliminate judge grading bias, and bulletproof the platform against data loss and quota exhaustion without spending a single dollar.
* **Duration:** 2 Weeks
* **Deliverables:**
  1. **Automated Database Disaster Recovery:** Nightly GitHub Action cron executing encrypted `mongodump` and storing archives in redundant secure object storage.
  2. **Atlas M0 Quota Sentinel & Image Compression:** Automatic WebP compression on all uploaded payment slips (max 200KB) and automated 60-day purge cycle for verified receipts.
  3. **Blind Judging Mode:** Anonymization toggle in `/evaluations` masking student identities and college names during scoring.
  4. **Z-Score Scoring Normalization:** Mathematical baseline correction balancing strict and lenient judges before computing leaderboard ranks.
  5. **Deterministic Tie-Breaking Engine:** Multi-tier tie resolution (Primary Criterion Score -> Submission Timestamp).
  6. **Public Certificate Verification Portal:** Standalone route `/verify/:id` rendering cryptographic verification hash and issuer validation.

---

## Phase 2: Live Event Operations, Venue Check-In & UX Consolidation
* **Objective:** Enable flawless 48-hour on-site event execution for 500+ participants and streamline the fragmented student journey.
* **Duration:** 3 Weeks
* **Deliverables:**
  1. **Digital Access Badge & QR Check-In:**
     - Dynamic attendee QR code on student `/dashboard`.
     - Lightweight mobile PWA `/volunteer/checkin` allowing student volunteers to scan badges and log physical attendance.
  2. **Unified Squad Management Deck:**
     - Consolidate squad recruitment (`/recruitment`), roster management (`/team`), and task execution (`/workspace`) into a cohesive HUD drawer.
  3. **Emergency Squad Co-Leader Succession:**
     - Provide a 1-click administrative leadership transfer action and automated majority-vote succession if a captain disconnects.
  4. **GitHub Submission Validator:**
     - Real-time API check validating that submitted repositories are public and contain active commits during the hackathon timeframe.
  5. **Financial CSV Export Studio:**
     - 1-click export of verified payment transactions, UTR numbers, student emails, and audit timestamps for instant bank reconciliation.

---

## Phase 3: Multi-Tenant Organizer Engine & Self-Serve Event Portal
* **Objective:** Transition CodeSrijan from a single-tenant flagship host to a multi-university hackathon SaaS platform.
* **Duration:** 4 Weeks
* **Deliverables:**
  1. **Multi-Tenant Schema Migration:**
     - Introduce `organizationId` and tenant scoping middleware across all admin and event routes.
  2. **Organizer Onboarding & Verification:**
     - Organizer registration portal with university domain verification (`.edu`, `.ac.in`) and KYC document upload.
     - Super-admin organizer approval dashboard.
  3. **Isolated Organizer Dashboard:**
     - Dedicated portal `/organizer` granting event leads full control over their own registrations, judges, problems, and announcements without platform super-admin access.
  4. **Dual-Mode Payment Configuration:**
     - Allow organizers to toggle between their personal UPI QR code (0% fee) and their own institutional Razorpay gateway keys.

---

## Phase 4: SrijanBot Ecosystem, Community & Enterprise Sponsor Portals
* **Objective:** Deepen AI copilot integration, corporate sponsor engagement, and post-event talent discovery.
* **Duration:** 3 Weeks
* **Deliverables:**
  1. **SrijanBot Semantic Caching & Vector Document Search:**
     - In-memory response caching for zero-latency event FAQ answers, protecting Groq free-tier rate limits.
     - Vector indexing of problem statement PDF rubrics for intelligent architecture advice.
  2. **Corporate Sponsor Talent Portal:**
     - Dedicated sponsor view allowing verified recruiters to filter hackathon finalists by tech stack, inspect public project repos, and download resume books.
  3. **Post-Event Retrospective & Participant Feedback:**
     - Structured 3-question Net Promoter Score (NPS) survey integrated into certificate claiming.

---

## Timeline & Dependency Matrix

```
Week 1-2:   [Phase 1] Security Hardening & Statistical Judging
Week 3-5:   [Phase 2] QR Check-In PWA & Unified Squad HUD
Week 6-9:   [Phase 3] Multi-Tenant Architecture & Organizer Portals
Week 10-12: [Phase 4] SrijanBot Semantic Cache & Sponsor Hub
```

---

*Verified and aligned with CodeSrijan zero-budget operating architecture.*
