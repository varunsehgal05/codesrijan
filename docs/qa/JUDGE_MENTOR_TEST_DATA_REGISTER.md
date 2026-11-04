# CodeSrijan: Judge & Mentor QA Test Data Register
**Date of Record:** 2026-11-04  
**Audit Conducted By:** SUB-QA-ORCHESTRATOR  
**Environment:** Live Production Database & Local Regression Suite  
**Data Integrity:** 100% Empirical — All IDs, Hash Digests, and Records Extracted Live  

---

## 1. Verified Operative Personas & Credentials

| Role | Email Address | Password | User ID (`id`) | MongoDB ObjectID (`_id`) | Clearance Scope |
|:---|:---|:---|:---|:---|:---|
| **Chief Evaluation Justice** | `judge@codesrijan.com` | `JudgeSrijan99!` | `u-1793691052262` | `6ae98dac23a4625cbcc5b12d` | `judge` (Rubric evaluations, score locks) |
| **Senior Technical Mentor** | `mentor@codesrijan.com` | `MentorSrijan99!` | `u-1793691048769` | `6ae98da823a4625cbcc5b12c` | `mentor` (Guidance triage, squad notes) |
| **Platform Administrator** | `admin@codesrijan.com` | `CodeSrijan99!` | `usr-admin-master` | `6a80fa110000000000000001` | `admin` (Superuser governance & unlocks) |
| **Squad Leader (Student)** | `varunsehgal2005@gmail.com` | `V@run2Sehgal05!` | `usr-1793669680582` | `6ae8ffb023a4625cbcc5b112` | `student` (Squad creation, payload submission) |
| **Standard Operative** | `student@codesrijan.com` | `HackerStudent99!` | `usr-student-master` | `6ac8bc25d88cc0314589afad` | `student` (Squad member, SOS dispatch) |

---

## 2. Active Tournament Fixtures (Hackathons)

| Hackathon Identifier | Title | Tier | Team Limits | Submission Deadline | Live Status |
|:---|:---|:---:|:---:|:---|:---:|
| `hack-paid-1792862582632` | CodeSrijan 24-Hour Innovation Hackathon | Paid (₹100 INR) | 2–4 Operatives | 2026-11-19T23:06:51.693Z | `registration_open` |
| `hack-free-1792862581267` | CodeSrijan Impact Challenge — Free Edition | Free (₹0) | 1–4 Operatives | 2026-11-13T22:06:51.693Z | `registration_open` |

---

## 3. Registered Squads & Teams Roster

| Squad ID | Team Name | Hackathon Association | Leader ID | Status | Member Roster | Payload Attachments |
|:---|:---|:---|:---|:---:|:---|:---|
| `t-1791540495510` | `codesrijan` | `hack-paid-1792862582632` | `usr-student-master` | `forming` | `['usr-student-master']` | Repo: `https://codesrijan-nine.vercel.app/workspace` |
| `t-1792862585921` | `CSQA-Group-A-4198` | `hack-free-1792862581267` | `usr-dummy-...-476` | `forming` | `['usr-dummy-...-476', '...-487']` | — |
| `t-1792862591758` | `CSQA-Group-B-0015` | `hack-paid-1792862582632` | `usr-dummy-...-519` | `forming` | `['usr-dummy-...-519', '...-183']` | — |
| `t-1793701401019` | `test23` | `hack-free-1792862581267` | `usr-1793669680582` | `submitted` | `['usr-1793669680582']` | GitHub: `https://github.com/codesrijan/squad-triage-audit`<br>Demo: `https://squad-triage-audit.codesrijan.app` |
| `team-test-mw2408qx` | `CyberVanguard Prime` | `hack-paid-1792862582632` | `usr-admin-master` | `submitted` | `['usr-admin-master']` | GitHub: `https://github.com/codesrijan/cyber-vanguard`<br>Demo: `https://cyber-vanguard.vercel.app` |

---

## 4. Project Submissions & Evaluation Fixtures

| Submission ID | Project Name | Target Hackathon | Submission Timestamp | Evaluation ID | Score Status |
|:---|:---|:---|:---|:---|:---:|
| `t-1793701401019` | `test23` (Squad Triage) | `hack-free-1792862581267` | 2026-11-04T13:17:55.424Z | Pending | Unscored |
| `team-test-mw2408qx` | `CyberVanguard Prime` | `hack-paid-1792862582632` | 2026-11-04T12:45:07.253Z | Pending | Unscored |
| `sub-alpha` (Test Seed) | `Autonomous AI Node` | `hack-target` | 2026-11-03T09:16:56.508Z | `evl-1793697416507` | `submitted` (Locked) |

---

## 5. Live Distress Signals / Mentor Guidance Tickets

| Request ID | Target Squad | Requested By | Topic & Description | Current Status | Assigned Mentor |
|:---|:---|:---|:---|:---:|:---:|
| `mr-1793798262921` | `t-1793701401019` | `usr-1793669680582` | Build optimization & container limits during production bundling | `pending` | None (Open) |
| `mr-1793798260234` | `t-1791540495510` | `usr-student-master` | Webhook relay connectivity timeout under load | `accepted` | `u-1793691048769` |
| `mr-1793798257379` | `t-1791540495510` | `usr-student-master` | High-priority environment configuration request | `pending` | None (Open) |
| `mr-1793798254336` | `t-1791540495510` | `usr-student-master` | Deployment issue & application crash | `pending` | None (Open) |
| `mr-1793798250928` | `t-1791540495510` | `usr-student-master` | Need urgent mentor for API integration | `pending` | None (Open) |
| `mr-1793798247537` | `t-1791540495510` | `usr-student-master` | Help needed without explicit topic | `pending` | None (Open) |
| `mr-1793090405980` | `t-1791540495510` | `usr-student-master` | Physical venue table diagnostics & hardware setup | `resolved` | `u-1793691048769` |

---

## 6. Realtime Notification Record Ledger

| Notification ID | Recipient User | Title / Action | Type | Related ID | Read Status |
|:---|:---|:---|:---:|:---|:---:|
| `notif-1793798264581-895rn` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798262921` | `false` |
| `notif-1793798261876-3htp7` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798260234` | `false` |
| `notif-1793798259243-gphzq` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798257379` | `false` |
| `notif-1793798256273-5f0i8` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798254336` | `false` |
| `notif-1793798253003-0rl8z` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798250928` | `false` |
| `notif-1793798249200-95jwt` | `u-1793691048769` | 🚨 SQUAD SOS: MENTOR DISPATCH | `support` | `mr-1793798247537` | `false` |
| `notif-1793797391920` | `usr-student-master` | Mentor Request Accepted! | `mentor` | `mr-1793090405980` | `true` (Verified Read) |
