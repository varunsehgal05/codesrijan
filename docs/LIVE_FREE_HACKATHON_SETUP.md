# LIVE FREE HACKATHON SETUP REPORT

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** Agent 2 — Hackathon Creation & Scheduling Engineer  
**Artifact Manifest:** `artifacts/live-e2e-qa/`  

---

## 1. Hackathon A: Specification & Configuration

- **Event Name:** `CodeSrijan Impact Challenge — Free Edition`
- **Identifier:** `hack-free-1792862581267`
- **Slug:** `codesrijan-impact-challenge-free-edition`
- **Participation Mode:** Online
- **Entry Fee:** ₹0 (Zero)
- **Fee Basis:** `per_team`
- **Team Size Bounds:** 2 to 4 members
- **Eligibility:** Students and developers satisfying CodeSrijan requirements
- **Theme:** Student Welfare & Productivity
- **Problem Statement Release Mode:** Immediate (`problemRevealMode: "immediate"`, `problemStatementsRevealed: true`)

---

## 2. Schedule and Timeline

| Event Milestone | ISO 8601 Timestamp | Offset Relative to Test Start |
| :--- | :--- | :--- |
| **Registration Start** | `2026-10-24T17:23:01.267Z` | Immediate upon setup |
| **Registration End** | `2026-10-24T19:23:01.267Z` | +2 hours from setup |
| **Official Start Date** | `2026-10-24T19:23:01.267Z` | +2 hours from setup |
| **Submission Deadline**| `2026-10-26T15:23:01.267Z` | +44 hours from official start |
| **Official End Date** | `2026-10-26T19:23:01.267Z` | +48 hours from official start |

---

## 3. Problem Statement & Deliverables

### Challenge Theme
> **Build technology that improves student life**  
> Students often struggle with fragmented academic resources, missed deadlines, poor team coordination, and difficulty finding the right information. Build a practical digital solution that helps students solve at least one of these problems.

### Required Deliverables
1. Project Name & Problem Statement Addressed
2. Target Users & Solution Overview
3. Key Features & Working Prototype Demo
4. Source Code Repository Link (GitHub/GitLab)
5. Demonstration Video or Presentation Link
6. Technology Stack & Architecture
7. Team Member Contribution Breakdown

### 100-Point Transparent Judging Rubric
| Criterion | Max Points |
| :--- | :---: |
| Problem relevance and user understanding | 20 |
| Innovation | 20 |
| Technical implementation | 25 |
| User experience and accessibility | 15 |
| Feasibility and potential impact | 10 |
| Presentation and demonstration | 10 |
| **Total** | **100** |

---

## 4. Empirical Verification & Evidence

- **Creation Verification:** HTTP 200 OK via `POST /api/hackathons`
- **Publish & Open Registration:** HTTP 200 OK via `POST /api/hackathons/hack-free-1792862581267/publish` (Status: `registration_open`)
- **Problem Statement Visibility:** Verified visible immediately in event details API response (`isLocked: false`, `isPublished: true`).
- **Registration Fee:** Verified ₹0 fee enforced by backend during team registration.
- **Evidence Screenshot:** `artifacts/live-e2e-qa/01_live_hackathons_directory.png`
- **Status:** **PASS**
