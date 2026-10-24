# LIVE PAID HACKATHON SETUP REPORT

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** Agent 2 — Hackathon Creation & Scheduling Engineer  
**Artifact Manifest:** `artifacts/live-e2e-qa/`  

---

## 1. Hackathon B: Specification & Configuration

- **Event Name:** `CodeSrijan 24-Hour Innovation Hackathon`
- **Identifier:** `hack-paid-1792862582632`
- **Slug:** `codesrijan-24-hour-innovation-hackathon`
- **Participation Mode:** Online
- **Entry Fee:** ₹100 per participant
- **Fee Basis:** `per_participant`
- **Currency:** INR
- **Payment Collection UPI:** `codesrijan@okhdfcbank`
- **Payee Name:** `CodeSrijan Hackathon Society`
- **Team Size Bounds:** 2 to 4 members
- **Duration:** Exactly 24 hours of rapid development
- **Problem Statement Release Mode:** Hidden until official start time (`problemRevealMode: "manual"`, `problemStatementsRevealed: false`)

---

## 2. Schedule and Non-Overlapping Alignment

To ensure non-conflicting schedules with Hackathon A (which runs through `2026-10-26T19:23:01.267Z`), Hackathon B was scheduled 24 hours after Hackathon A concludes:

| Milestone | ISO 8601 Timestamp | Offset Relative to Test Run |
| :--- | :--- | :--- |
| **Registration Start** | `2026-10-24T17:23:01.267Z` | Immediate upon setup |
| **Registration End** | `2026-10-27T19:23:01.267Z` | At official competition start |
| **Official Start Date** | `2026-10-27T19:23:01.267Z` | +72 hours after test setup |
| **Submission Deadline**| `2026-10-28T19:23:01.267Z` | Start time + 24 Hours building period |
| **Official End Date** | `2026-10-28T19:23:01.267Z` | Exactly 24 building hours |

---

## 3. Confidential Problem Statement & Judging Rubric

### Hidden Challenge Text (Confidential Until Start)
> **The challenge: Build a smarter campus ecosystem**  
> Universities rely on separate systems for academic updates, student collaboration, events, opportunities, campus services, and communication. Students frequently have difficulty discovering information, coordinating with their teams, and taking action before deadlines. Build a digital solution that makes at least one important campus workflow more efficient, accessible, or reliable.

### Leak Prevention Verification
- **API Response:** `problemStatementsRevealed` returned `false`.
- **Linked Problem Statement Object:** Returned `isLocked: true`, `isPublished: false`.
- **Public Event Page:** Challenge text not leaked into public HTML or client bundle.

### 100-Point Transparent Judging Rubric
| Criterion | Max Points |
| :--- | :---: |
| Technical implementation | 25 |
| Innovation | 20 |
| Problem relevance | 20 |
| User experience | 15 |
| Feasibility and impact | 10 |
| Presentation and demo | 10 |
| **Total** | **100** |

---

## 4. Empirical Verification & Evidence

- **Creation Verification:** HTTP 200 OK via `POST /api/hackathons`
- **Publish & Open Registration:** HTTP 200 OK via `POST /api/hackathons/hack-paid-1792862582632/publish` (Status: `registration_open`)
- **Per-Participant Fee Calculation:** Group B (2 members) calculated fee as ₹200 (Verified via `POST /api/hackathons/:id/register`).
- **Evidence Screenshot:** `artifacts/live-e2e-qa/01_live_hackathons_directory.png`
- **Status:** **PASS**
