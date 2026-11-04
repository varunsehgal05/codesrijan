# CodeSrijan: Mentor Portal Live Data Snapshot
**Date of Record:** 2026-11-04  
**Environment:** Live Production (`https://codesrijan-nine.vercel.app` & `https://codesrijan-api-6tfr.onrender.com/api`)  
**Audit Verification:** SUB-QA-ORCHESTRATOR Live Network Probe  
**Data Integrity:** 100% Empirical — Real Database Objects, Exact MongoDB IDs, Zero Simulated Metrics  

---

## 1. Authenticated Mentor Persona Ledger

The following mentor account was authenticated against the live production Render API (`POST /api/auth/login`) with session tokens and role privileges verified:

| Attribute | Verified Value |
|:---|:---|
| **Email** | `mentor@codesrijan.com` |
| **Password** | `MentorSrijan99!` |
| **User ID (`id`)** | `u-1793691048769` |
| **MongoDB ObjectID (`_id`)** | `6ae98da823a4625cbcc5b12c` |
| **Full Name** | `Senior Technical Mentor` |
| **Role Clearance** | `mentor` |
| **Specialization** | `Fullstack` |
| **Account Status** | `active` |
| **Email Verified** | `true` |
| **Recruitment Status** | `looking_for_team` |
| **Created Timestamp** | `2026-11-03T07:30:48.770Z` |
| **Updated Timestamp** | `2026-11-03T07:30:48.770Z` |
| **Primary Route** | [`/mentor-command-center`](file:///mentor-command-center) |

---

## 2. Live Guidance Requests Roster (`GET /api/mentor/requests/all`)

Querying `GET /api/mentor/requests/all` with the Mentor Bearer token returned HTTP `200 OK` with 7 live distress tickets:

```json
[
  {
    "_id": "6aeb3076e08a5dc527ead189",
    "id": "mr-1793798262921",
    "teamId": "t-1793701401019",
    "requestedBy": "usr-1793669680582",
    "topic": "SOS Squad Leader: Build optimization & container limits",
    "description": "Squad test23 encountering memory limits during production build bundling. Requesting mentor review.",
    "status": "pending",
    "createdAt": "2026-11-04T13:17:42.921Z",
    "updatedAt": "2026-11-04T13:17:42.921Z",
    "__v": 0
  },
  {
    "_id": "6aeb3074e08a5dc527ead183",
    "id": "mr-1793798260234",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "topic": "SOS Distress Signal: Webhook relay connectivity timeout",
    "description": "Payment verification webhook relay is timing out under load. Need assistance troubleshooting socket connections.",
    "status": "accepted",
    "createdAt": "2026-11-04T13:17:40.234Z",
    "updatedAt": "2026-11-04T13:18:19.851Z",
    "__v": 0,
    "acceptedAt": "2026-11-04T13:18:19.851Z",
    "mentorId": "u-1793691048769"
  },
  {
    "_id": "6aeb3071e08a5dc527ead17c",
    "id": "mr-1793798257379",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "topic": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "description": "Valid description text",
    "status": "pending",
    "createdAt": "2026-11-04T13:17:37.380Z",
    "updatedAt": "2026-11-04T13:17:37.380Z",
    "__v": 0
  },
  {
    "_id": "6aeb306ee08a5dc527ead175",
    "id": "mr-1793798254336",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "topic": "Deployment issue",
    "description": "Application crashed",
    "status": "pending",
    "createdAt": "2026-11-04T13:17:34.337Z",
    "updatedAt": "2026-11-04T13:17:34.337Z",
    "__v": 0
  },
  {
    "_id": "6aeb306ae08a5dc527ead16d",
    "id": "mr-1793798250928",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "topic": "Need urgent mentor",
    "status": "pending",
    "createdAt": "2026-11-04T13:17:30.929Z",
    "updatedAt": "2026-11-04T13:17:30.929Z",
    "__v": 0
  },
  {
    "_id": "6aeb3067e08a5dc527ead167",
    "id": "mr-1793798247537",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "description": "Help needed without topic",
    "status": "pending",
    "createdAt": "2026-11-04T13:17:27.537Z",
    "updatedAt": "2026-11-04T13:17:27.537Z",
    "__v": 0
  },
  {
    "_id": "6ae0636521c4fd19e7fe68ea",
    "id": "mr-1793090405980",
    "teamId": "t-1791540495510",
    "requestedBy": "usr-student-master",
    "topic": "help",
    "description": "need med on table 20",
    "status": "resolved",
    "createdAt": "2026-10-27T08:40:05.981Z",
    "updatedAt": "2026-11-04T13:04:01.026Z",
    "__v": 0,
    "acceptedAt": "2026-11-04T13:03:11.440Z",
    "mentorId": "u-1793691048769"
  }
]
```

### Analysis of Guidance Queue:
- **Pending Distress Signals:** 5 tickets awaiting claiming (`mr-1793798262921`, `mr-1793798257379`, `mr-1793798254336`, `mr-1793798250928`, `mr-1793798247537`).
- **Claimed / Active Consultation:** 1 ticket actively claimed by `u-1793691048769` (`mr-1793798260234`).
- **Resolved Guidance:** 1 ticket successfully debugged and archived (`mr-1793090405980`).

---

## 3. Live Mentor Notifications Dataset (`GET /api/notifications`)

Querying `GET /api/notifications` with the Mentor Bearer token returned HTTP `200 OK` with 6 live distress dispatch alerts:

```json
[
  {
    "_id": "6aeb3078e08a5dc527ead18e",
    "id": "notif-1793798264581-895rn",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"test23\" sent an SOS distress signal: SOS Squad Leader: Build optimization & container limits",
    "type": "support",
    "relatedId": "mr-1793798262921",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:44.581Z",
    "updatedAt": "2026-11-04T13:17:44.581Z",
    "__v": 0
  },
  {
    "_id": "6aeb3075e08a5dc527ead188",
    "id": "notif-1793798261876-3htp7",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"codesrijan\" sent an SOS distress signal: SOS Distress Signal: Webhook relay connectivity timeout",
    "type": "support",
    "relatedId": "mr-1793798260234",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:41.876Z",
    "updatedAt": "2026-11-04T13:17:41.876Z",
    "__v": 0
  },
  {
    "_id": "6aeb3073e08a5dc527ead182",
    "id": "notif-1793798259243-gphzq",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"codesrijan\" sent an SOS distress signal: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "type": "support",
    "relatedId": "mr-1793798257379",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:39.243Z",
    "updatedAt": "2026-11-04T13:17:39.243Z",
    "__v": 0
  },
  {
    "_id": "6aeb3070e08a5dc527ead17b",
    "id": "notif-1793798256273-5f0i8",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"codesrijan\" sent an SOS distress signal: Deployment issue",
    "type": "support",
    "relatedId": "mr-1793798254336",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:36.273Z",
    "updatedAt": "2026-11-04T13:17:36.273Z",
    "__v": 0
  },
  {
    "_id": "6aeb306de08a5dc527ead174",
    "id": "notif-1793798253003-0rl8z",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"codesrijan\" sent an SOS distress signal: Need urgent mentor",
    "type": "support",
    "relatedId": "mr-1793798250928",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:33.003Z",
    "updatedAt": "2026-11-04T13:17:33.003Z",
    "__v": 0
  },
  {
    "_id": "6aeb3069e08a5dc527ead16c",
    "id": "notif-1793798249200-95jwt",
    "userId": "u-1793691048769",
    "title": "🚨 SQUAD SOS: MENTOR DISPATCH",
    "message": "Squad \"codesrijan\" sent an SOS distress signal: undefined",
    "type": "support",
    "relatedId": "mr-1793798247537",
    "isRead": false,
    "createdAt": "2026-11-04T13:17:29.200Z",
    "updatedAt": "2026-11-04T13:17:29.200Z",
    "__v": 0
  }
]
```

---

## 4. Live Squads & Roster Context (`GET /api/teams`)

Mentors track active squads across tournaments. The live database houses 5 registered squads:

| Squad ID | Team Name | Hackathon ID | Leader ID | Status | Members | Submission Link |
|:---|:---|:---|:---|:---|:---|:---|
| `t-1791540495510` | `codesrijan` | `hack-paid-1792862582632` | `usr-student-master` | `forming` | 1 | `https://codesrijan-nine.vercel.app/workspace` |
| `t-1792862585921` | `CSQA-Group-A-4198` | `hack-free-1792862581267` | `usr-dummy-...-476` | `forming` | 2 | — |
| `t-1792862591758` | `CSQA-Group-B-0015` | `hack-paid-1792862582632` | `usr-dummy-...-519` | `forming` | 2 | — |
| `t-1793701401019` | `test23` | `hack-free-1792862581267` | `usr-1793669680582` | `submitted` | 1 | `https://squad-triage-audit.codesrijan.app` |
| `team-test-mw2408qx` | `CyberVanguard Prime` | `hack-paid-1792862582632` | `usr-admin-master` | `submitted` | 1 | `https://cyber-vanguard.vercel.app` |

---

## 5. Realtime WebSocket Handshake Probe

| Metric | Empirical Probe Value | Status |
|:---|:---|:---|
| **Socket Server Endpoint** | `https://codesrijan-api-6tfr.onrender.com` | Connected |
| **Socket ID** | `S5lXx-vZ5rmf8nFIAAAU` | Active |
| **Transport** | `websocket` | Confirmed |
| **Handshake Auth** | `{ token: "<sessionToken>" }` | Authenticated |
| **Socket Latency** | `138ms` | Nominal |
