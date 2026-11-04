# CodeSrijan: Judge Portal Live Data Snapshot
**Date of Record:** 2026-11-04  
**Environment:** Live Production (`https://codesrijan-nine.vercel.app` & `https://codesrijan-api-6tfr.onrender.com/api`)  
**Audit Verification:** SUB-QA-ORCHESTRATOR Live Network Probe  
**Data Integrity:** 100% Empirical — Real Database Objects, Exact MongoDB IDs, Zero Simulated Metrics  

---

## 1. Authenticated Judge Persona Ledger

The following judge account was authenticated against the live production Render API (`POST /api/auth/login`) with session tokens and role privileges verified:

| Attribute | Verified Value |
|:---|:---|
| **Email** | `judge@codesrijan.com` |
| **Password** | `JudgeSrijan99!` |
| **User ID (`id`)** | `u-1793691052262` |
| **MongoDB ObjectID (`_id`)** | `6ae98dac23a4625cbcc5b12d` |
| **Full Name** | `Chief Evaluation Justice` |
| **Role Clearance** | `judge` |
| **Specialization** | `Fullstack` |
| **Account Status** | `active` |
| **Email Verified** | `true` |
| **Recruitment Status** | `looking_for_team` |
| **Created Timestamp** | `2026-11-03T07:30:52.262Z` |
| **Updated Timestamp** | `2026-11-03T07:30:52.262Z` |
| **Primary Route** | [`/judge-command-center`](file:///judge-command-center) |

---

## 2. Live Submissions Dataset (`GET /api/submissions`)

Querying `GET /api/submissions` with the verified Judge Bearer token returned HTTP `200 OK` with 2 active squad submissions:

```json
[
  {
    "_id": "6ae9b61923a4625cbcc5b15d",
    "id": "t-1793701401019",
    "hackathonId": "hack-free-1792862581267",
    "name": "test23",
    "description": "",
    "leaderId": "usr-1793669680582",
    "memberIds": [
      "usr-1793669680582"
    ],
    "problemStatementId": "",
    "recruitmentOpen": true,
    "status": "submitted",
    "adminNote": "",
    "isLocked": false,
    "isSubmitted": true,
    "bonusPoints": 0,
    "penaltyPoints": 0,
    "isTest": false,
    "createdAt": "2026-11-03T10:23:21.020Z",
    "updatedAt": "2026-11-04T13:17:55.424Z",
    "__v": 0,
    "demoUrl": "https://squad-triage-audit.codesrijan.app",
    "repositoryUrl": "https://github.com/codesrijan/squad-triage-audit"
  },
  {
    "_id": "6aeb28d3e08a5dc527ead126",
    "id": "team-test-mw2408qx",
    "hackathonId": "hack-paid-1792862582632",
    "name": "CyberVanguard Prime",
    "leaderId": "usr-admin-master",
    "memberIds": [
      "usr-admin-master"
    ],
    "status": "submitted",
    "adminNote": "",
    "isLocked": false,
    "repositoryUrl": "https://github.com/codesrijan/cyber-vanguard",
    "demoUrl": "https://cyber-vanguard.vercel.app",
    "isSubmitted": true,
    "bonusPoints": 0,
    "penaltyPoints": 0,
    "isTest": true,
    "createdAt": "2026-11-04T12:45:07.253Z",
    "updatedAt": "2026-11-04T12:45:07.253Z",
    "__v": 0
  }
]
```

### Analysis of Project Payloads:
1. **Submission 1 (`t-1793701401019`)**:
   - **Squad Name:** `test23`
   - **Tournament:** CodeSrijan Impact Challenge — Free Edition (`hack-free-1792862581267`)
   - **Artifact Links:**
     - GitHub: [https://github.com/codesrijan/squad-triage-audit](https://github.com/codesrijan/squad-triage-audit)
     - Working Demo: [https://squad-triage-audit.codesrijan.app](https://squad-triage-audit.codesrijan.app)
   - **Submission State:** `isSubmitted: true`, `status: "submitted"`
2. **Submission 2 (`team-test-mw2408qx`)**:
   - **Squad Name:** `CyberVanguard Prime`
   - **Tournament:** CodeSrijan 24-Hour Innovation Hackathon (`hack-paid-1792862582632`)
   - **Artifact Links:**
     - GitHub: [https://github.com/codesrijan/cyber-vanguard](https://github.com/codesrijan/cyber-vanguard)
     - Working Demo: [https://cyber-vanguard.vercel.app](https://cyber-vanguard.vercel.app)
   - **Submission State:** `isSubmitted: true`, `status: "submitted"`

---

## 3. Live Evaluations Dataset (`GET /api/evaluations`)

Querying `GET /api/evaluations` with the Judge Bearer token returned HTTP `200 OK` with 1 active historical evaluation:

```json
[
  {
    "_id": "6ae9a68823a4625cbcc5b14b",
    "id": "evl-1793697416507",
    "judgeId": "u-1793691052262",
    "scores": [],
    "status": "submitted",
    "createdAt": "2026-11-03T09:16:56.508Z",
    "updatedAt": "2026-11-03T09:16:56.508Z",
    "__v": 0
  }
]
```

---

## 4. Associated Hackathon Context (`GET /api/hackathons`)

The judge portal links submission IDs to tournament metadata. The live database houses 2 active hackathons:

| Field | Hackathon 1 (Paid Tier) | Hackathon 2 (Free Tier) |
|:---|:---|:---|
| **Hackathon ID** | `hack-paid-1792862582632` | `hack-free-1792862581267` |
| **MongoDB `_id`** | `6adce97892d2eb4667ac5893` | `6adce97792d2eb4667ac5892` |
| **Title** | CodeSrijan 24-Hour Innovation Hackathon | CodeSrijan Impact Challenge — Free Edition |
| **Theme** | Smart Campus Ecosystem & Automation | Student Welfare & Productivity |
| **Entry Type** | `paid` (₹100 INR per participant) | `free` (₹0) |
| **Status** | `registration_open` | `registration_open` |
| **Registration Deadline** | 2026-11-18T22:06:51.693Z | 2026-11-11T22:06:51.693Z |
| **Submission Deadline** | 2026-11-19T23:06:51.693Z | 2026-11-13T22:06:51.693Z |
| **Team Size Limits** | 2 to 4 Operatives | 1 to 4 Operatives |
| **Problem Statements** | Revealed (`true`) | Revealed (`true`) |

---

## 5. Live Judge Notifications Dataset (`GET /api/notifications`)

Querying `GET /api/notifications` with the Judge Bearer token returned HTTP `200 OK`:
- **Current Count:** `0 unread / 0 total` (Clean inbox state).
- **Socket Stream:** Realtime Socket.IO channel authenticated and listening on room `u-1793691052262`.

---

## 6. Realtime WebSocket Handshake Probe

| Metric | Empirical Probe Value | Status |
|:---|:---|:---|
| **Socket Server Endpoint** | `https://codesrijan-api-6tfr.onrender.com` | Connected |
| **Socket ID** | `rmCs64MRX2LjqD0VAAAT` | Active |
| **Transport** | `websocket` | Confirmed |
| **Handshake Auth** | `{ token: "<sessionToken>" }` | Authenticated |
| **Socket Latency** | `142ms` | Nominal |
