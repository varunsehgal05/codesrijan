# CODESRIJAN — SECURITY AND OPERATIONAL RELIABILITY AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal Information Security Officer & Site Reliability Engineer (SRE)  
**Security Standard:** OWASP Top 10 API Security Risks & Data Integrity Standards  

---

## 1. Vulnerability Findings & Security Posture

### 1.1 Multi-Tenant Data Isolation (Critical Finding)
* **Status:** **ABSENT**.
* **Finding:** All hackathon data (users, teams, submissions, payment records) resides in a single, un-partitioned MongoDB Atlas database without tenant boundary enforcement.
* **Risk:** Any authenticated administrator has unrestricted query access to all college registrations nationwide. An organizer from College A could inadvertently inspect payment receipts, student phone numbers, and judge scores from College B.
* **Remediation:** Introduce `organizationId` or `eventScopeId` on all administrative API queries and enforce tenant ownership in middleware.

---

### 1.2 Student-to-Student Data Isolation & Privacy
* **Status:** **SECURE FOR SENSITIVE ASSETS; LEAKY FOR PROFILES**.
* **Sensitive Assets Protected:**
  - Password hashes are completely excluded from JSON serialization (`toJSON` transform in `User` schema).
  - Payment proof images in GridFS can only be viewed by the user who uploaded them or an authenticated administrator via time-limited signed proxy URLs.
* **Leaky Attributes:**
  - The public recruitment marketplace (`/recruitment`) returns student emails in certain API payload responses.
  - Student emails should be masked or de-identified (e.g. `v***@codesrijan.com`) to prevent scraping by third-party recruiters.

---

### 1.3 Submission Privacy Prior to Judging
* **Status:** **PARTIALLY PROTECTED**.
* **Current Mechanism:** Submissions cannot be viewed by other competing students until the evaluation period concludes.
* **Vulnerability:** If a student inputs a public GitHub repository URL, another student who guesses or finds the repository on GitHub could inspect code prior to the deadline.
* **Recommendation:** Encourage competitors to keep repositories private during development and invite a dedicated CodeSrijan robot account as a collaborator, or require repositories to be made public only upon submission freeze.

---

### 1.4 API Authentication & Token Security
* **Session Storage:** Tokens are stored in secure HTTP headers / client storage and validated against SHA-256 hashes in MongoDB `Session` collection.
* **Brute-Force Protection:** Rate limiting is enforced via Express `express-rate-limit` on `/api/auth/*` routes, preventing OTP brute-forcing.
* **App Check Enforcement:** Firebase App Check is integrated to verify client origin, defending backend endpoints from unauthorized automated curl scripts.

---

### 1.5 Database Security & Quota Resilience
* **Cluster:** MongoDB Atlas M0 (Free Tier).
* **Connection Security:** Enforces TLS/SSL with strict Mongoose connection string credentials.
* **Reliability Risk (512MB Quota Boundary):**
  - Atlas M0 enforces a hard 512MB storage cap.
  - At 1,000 teams uploading 500KB payment screenshots, storage consumption reaches 500MB, threatening to trigger cluster read-only lockouts.
  - **Mitigation:** Enforce aggressive image compression (max 200KB) at upload time and schedule automatic purging of verified receipts after 60 days.

---

### 1.6 Audit History & Compliance Logging
* **Status:** **IMPLEMENTED**.
* **Audit Mechanism (`server/models/index.js` & `server/routes/admin.logs.tsx`):**
  - Administrative actions (role changes, payment verifications, team disqualifications, problem statement edits) generate immutable audit records in the database.
  - The `/admin/logs` dashboard allows super-admins to inspect who authorized each action, the target user/team ID, and the exact timestamp.

---

### 1.7 Backup & Disaster Recovery
* **Current State:** Manual backup script available (`server/export_backup_free.mjs`).
* **Vulnerability:** Atlas M0 Free Tier **does not provide automated point-in-time continuous backups**.
* **Remediation:** Implement a daily automated GitHub Action cron that runs `mongodump` and pushes an encrypted archive to an offsite secure storage location.

---

*Verified from security middleware, auth controllers, and database models.*
