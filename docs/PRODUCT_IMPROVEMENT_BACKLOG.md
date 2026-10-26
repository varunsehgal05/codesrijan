# CODESRIJAN — POST-RELEASE 1.0 PRODUCT IMPROVEMENT BACKLOG
**Platform:** CodeSrijan 1.0  
**Repository:** `C:/Users/Varun/Downloads/interactive-showcase-main/interactive-showcase-main`  
**Budget Constraint:** **$0.00 / month strictly maintained** (Zero-cost infrastructure)  

---

## 1. BACKLOG RANKING METHODOLOGY

Issues and operational improvements are evaluated against a standardized 5-factor scoring model (1 to 5 scale):

$$\text{Priority Score} = (\text{User Impact} \times 3) + (\text{Security/Integrity Risk} \times 3) + (\text{Frequency} \times 2) - (\text{Effort} \times 1) - (\text{Regression Risk} \times 1)$$

- **User Impact (1-5):** Extent of disruption or benefit to student hackers, mentors, judges, and organizers.
- **Security / Data Integrity Risk (1-5):** Exposure of private records, financial discrepancies, or data loss potential.
- **Frequency (1-5):** How often participants encounter the flow during active competition.
- **Effort (1-5):** Engineering complexity and development hours required.
- **Regression Risk (1-5):** Likelihood of breaking existing 74/74 green regression test contracts.

---

## 2. RANKED IMPROVEMENT REGISTER

| Rank | Issue ID | Title & Summary | Category | Impact | Security | Freq | Effort | Reg Risk | Priority Score | Proposed Solution & Safe Approach |
|:---:|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **1** | `PERF-001` | **Tournament Hours Warm-Up Ping for Render Free Tier** | Infrastructure | 5 | 2 | 5 | 1 | 1 | **29** | Schedule a lightweight cron ping (e.g. GitHub Action running `GET /api/system/status` every 14 mins strictly during tournament competition windows 08:00–22:00 IST) to prevent 30-50s cold-start delays for participants. Zero extra cost. |
| **2** | `DATA-001` | **Automated Zero-Cost Database Snapshot Workflow** | Reliability | 4 | 5 | 2 | 2 | 1 | **28** | Implement a weekly GitHub Actions workflow that executes `mongodump` with encrypted archive storage as repository release assets, providing disaster recovery for the Atlas M0 free keyspace without third-party paid backups. |
| **3** | `STOR-001` | **Concluded Tournament Proof Archiving & Vault Pruning** | Storage | 4 | 3 | 4 | 2 | 2 | **25** | Admin tool to archive payment proofs of concluded hackathons into compressed export bundles and reclaim GridFS ledger capacity, ensuring the 75MB free storage budget never blocks upcoming tournaments. |
| **4** | `FIN-001` | **Duplicate UTR & Cross-Squad Transaction Collision Check** | Security | 4 | 4 | 2 | 1 | 1 | **26** | Add unique index constraint or pre-save query on `paymentProofSchema.utrNumber` to reject duplicate transaction reference numbers across squads, preventing multiple teams from submitting the same UPI receipt. |
| **5** | `A11Y-001` | **Touch-Optimized Kanban Workspace for Mobile Devices** | Usability | 3 | 1 | 4 | 3 | 2 | **15** | On `/workspace`, enhance Kanban board touch-and-hold gestures for mobile screens (320px–375px) with accessible move-up / move-down button fallbacks for screen reader and touch-only users. |
| **6** | `NOTIF-001` | **Browser Service Worker Web Push Notifications** | Feature | 3 | 1 | 3 | 3 | 2 | **13** | Integrate standard HTML5 Web Push API to notify students of payment verification, squad invites, and problem statement announcements directly in browser, bypassing Google Apps Script daily email relay limits. |
| **7** | `JUDGE-001` | **Judge Offline Scorecard Draft Caching (IndexedDB)** | Reliability | 3 | 2 | 2 | 3 | 1 | **15** | Cache in-progress evaluation scorecards in browser `IndexedDB` so judges in lecture halls with intermittent WiFi do not lose rubric drafts before final submission to `/api/admin/evaluations`. |

---

## 3. SCOPE BOUNDARIES & ANTI-GOALS

To maintain stability and the $0.00/month operating guarantee:
- **No Paid Infrastructure:** Reject any proposal requiring AWS S3, Vercel Pro, Render Starter/Standard, Datadog, Sentry, or third-party paid SaaS.
- **No Heavy Frontend Framework Migrations:** Preserve TanStack Router, Zustand, and TailwindCSS v4 design system.
- **No Unsafe Production Data Alterations:** All future schema changes must include backward-compatible Mongoose migration guards.
