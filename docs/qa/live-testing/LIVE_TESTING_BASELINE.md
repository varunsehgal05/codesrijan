# CODESRIJAN — LIVE TESTING BASELINE AUDIT
**Execution Date:** 2026-10-30T03:15:00Z  
**Primary Auditor:** LIVE-CHROME-MASTER-QA-01  
**Target Environments:**
- Production Frontend: `https://codesrijan-nine.vercel.app` (Vercel Edge, verified commit `8207b73`)
- Production API Gateway: `https://codesrijan-api-6tfr.onrender.com/api` (Render `srv-db1b3ke0tbcc73ac3ea0`)
- Database: MongoDB Atlas (`codesrijan-cluster.mrckx43.mongodb.net`, keyspace `codesrijan`)
- Zero-Budget Requirement: Strict $0.00 / month budget maintained

---

## 1. INFRASTRUCTURE & STARTING STATE VERIFICATION

| Component | Target Identifier | Observed Health | Details |
|---|---|---|---|
| **Git Repository** | `main` @ `8207b73` | Synchronized | Working tree clean, synced with `origin/main` |
| **Vercel Frontend** | `codesrijan-nine.vercel.app` | HTTP 200 OK | Serves brand icon `codesrijan-icon.png`, elevated bot trigger |
| **Render API** | `srv-db1b3ke0tbcc73ac3ea0` | HTTP 200 OK | `/api/health` reports status "healthy", uptime > 600s |
| **MongoDB Atlas** | `codesrijan` cluster | Connected (1) | Connected to keyspace `codesrijan`, readyState 1 |
| **Chrome Automation** | CDP Port `9222` | Connected | Google Chrome 156.0.8078.47 connected over DevTools Protocol |

---

## 2. DISCOVERED ROLES & TEST CREDENTIALS MATRIX

Sensitive credentials (passwords, JWT secrets, raw keys) are strictly masked.

| Role | Discovered Profile | Account Identifier | Authorization Scope |
|---|---|---|---|
| **Anonymous** | Guest Builder | Unauthenticated | Browse landing, catalog, sponsors, announcements, FAQ, about |
| **Student** | Vanguard Hacker | `student@codesrijan.com` | Dashboard, recruitment, team formation, submissions, certificates, support |
| **Admin** | CodeSrijan Administrator | `admin@codesrijan.com` | Full governance, event creation, DIQ/bans, problem inspection, certificate issuance |
| **Judge** | Evaluation Official | Evaluator role | Judge portal (`/evaluations`), rubric grading |
| **Mentor** | Technical Mentor | Mentor role | Mentor hub (`/mentor`, `/mentor/command-center`), SOS response |

---

## 3. TEST INVENTORY & REPOSITORY SCRIPTS

- `server/test_focused_regression.mjs`: 19 focused test scenarios verifying:
  - Admin support ticket permissions & tenant isolation (Scenarios 1–3, 9, 11)
  - Student support initiation, conversation thread resolution, status normalization (Scenarios 4–8, 10, 12, 13)
  - Notification category badges, Leaderboard metrics, Recruitment restrictions (Scenarios 14–17)
  - Route state caching and CORS security (Scenarios 18–19)
- Real-browser automated suite: `master_architecture_qa_suite.cjs` & specialized live Chrome scripts.

---

## 4. PREVIOUS DEFECTS & VERIFIED RESOLUTION STATUS

1. **Floating SrijanBot Elevation**: Shifting up from bottom edge (`bottom-24 sm:bottom-28`, 112px clearance) resolved in commit `8207b73`.
2. **Platform Branding & Emblems**: Full logo with graduation cap and blue shield `</>` symbol deployed in commit `024f281`.
3. **Admin Hackathon Governance**: Admins govern instead of compete; Lone Wolf suppressed; certificates matrix overhaul; file upload pipelines (1200x630 banner, 15MB spec document, 500x500 UPI QR); admin problem inspection without squad requirements.
4. **Platform Auto-Scroll Cured**: Autofocus removed from root and chatbot widget.

---

## 5. SAFE LIVE TEST DATA STRATEGY

- Database contains exactly **2 hackathons** and strictly **8 user accounts**.
- Zero destructive actions will be performed against production records.
- Any temporary verification records will be scoped, reversible, and cleaned up cleanly.
- Strict $0.00/month budget policy is strictly enforced.
