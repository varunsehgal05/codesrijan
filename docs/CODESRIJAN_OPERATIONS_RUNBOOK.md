# CODESRIJAN 1.0 — OPERATIONS & INCIDENT RESPONSE RUNBOOK
**Platform:** CodeSrijan 1.0 (Student-Run Hackathon & Tournament Platform)  
**Authoritative Frontend:** [https://codesrijan-nine.vercel.app](https://codesrijan-nine.vercel.app)  
**Authoritative Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  
**Git Remote:** `https://github.com/varunsehgal05/codesrijan.git`  
**Current Release Tag:** `v1.0.0` (Commit: `288b59e`)  
**Operating Budget:** **$0.00 / month** (MongoDB Atlas M0 Free + Render Web Service Free + Vercel Hobby + Google Apps Script Relay v5)  

---

## 1. PLATFORM ARCHITECTURE & COMPONENT DIRECTORY

CodeSrijan operates across four zero-cost infrastructure providers:

```
+-------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                               |
+-------------------------------------------------------------------------------+
           | (HTTPS Requests)                              | (API & WebSockets)
           v                                               v
+-----------------------------+                 +-------------------------------+
|     VERCEL EDGE CDN         |                 |   RENDER WEB SERVICE (FREE)   |
| codesrijan-nine.vercel.app  |                 | codesrijan-api-6tfr.onrender  |
| - TanStack Router SPA / SSR |                 | - Express REST Server (80+ ep)|
| - Instant edge cache        |                 | - Socket.io WebSocket Hub     |
+-----------------------------+                 +-------------------------------+
                                                               |
                                        +----------------------+----------------------+
                                        | (Mongoose ODM / GridFS)                     | (HMAC-SHA256 Webhook)
                                        v                                             v
                        +-------------------------------+             +-------------------------------+
                        |     MONGODB ATLAS (M0 FREE)   |             |   APPS SCRIPT EMAIL RELAY v5  |
                        | - Cluster: CodeSrijan (512MB) |             | - Google Workspace Gmail API  |
                        | - Keyspace: codesrijan        |             | - 100 emails/day free quota   |
                        | - GridFS: paymentProofs (75MB)|             | - Deployment ID: AKfycby5O... |
                        +-------------------------------+             +-------------------------------+
```

---

## 2. HEALTH CHECKING & OBSERVABILITY

### 2.1 Public Endpoint Health Check
- **Endpoint:** `GET https://codesrijan-api-6tfr.onrender.com/api/system/status`
- **Expected Status:** HTTP 200 OK
- **Expected Body:**
  ```json
  {
    "status": "operational",
    "timestamp": "2026-10-27T...",
    "database": "connected"
  }
  ```

### 2.2 Diagnosing Render Free-Tier Cold Starts vs True Service Outages
- **Cold Start Characteristic:** Render free instances spin down after 15 minutes of inactivity. When a request arrives, Render spins up the container from scratch.
  - *Symptom:* First request takes 30 to 50 seconds to respond.
  - *Browser behavior:* Loading spinner continues for ~40s, then page loads normally.
  - *Distinction:* If the request finishes with HTTP 200 after 30-50s, the service is **HEALTHY (COLD START RECOVERY)**.
- **True Outage Characteristic:**
  - *Symptom:* Request fails after 60s with HTTP 502 Bad Gateway or HTTP 504 Gateway Timeout continuously on repeat attempts.
  - *Action:* Check Render Web Service dashboard logs (`srv-db1b3ke0tbcc73ac3ea0`) for uncaught exceptions, out-of-memory crashes, or MongoDB Atlas connectivity errors.

### 2.3 Administrator Platform Health Hub (`/admin/health`)
- **Route:** `/admin/health` (Requires Administrator role)
- **API:** `GET /api/admin/health`
- **Telemetry Indicators:**
  1. **Backend Server:** Process uptime, Node.js version, memory usage (RSS, Heap Used).
  2. **Database Engine:** MongoDB Atlas readyState (`1 = Connected`).
  3. **Storage Vault:** Live GridFS `paymentProofs` ledger:
     - Hard Budget: 75.00 MB (`78,643,200 bytes`)
     - Committed Bytes vs Reserved Bytes
     - Remaining Capacity Headroom
     - Percent Allocated (Warning threshold: ≥ 80%)
  4. **Email Relay:** Google Apps Script Relay v5 configuration and readiness status.
  5. **Operational Backlogs:** Count of pending payment reviews, open/in-progress support tickets, active hackathons, and total registrations.
- **Manual Sync:** Click `SYNC TELEMETRY NOW` to force an instant refresh without reloading the browser.

---

## 3. ADMINISTRATOR OPERATIONS CONSOLE USAGE

### 3.1 Hackathon Operations Hub (`/admin/operations`)
- **Route:** `/admin/operations` (Requires Administrator role)
- **API:** `GET /api/admin/hackathon-operations`
- **Phase Classifier:** Events are categorized using server-side timestamps:
  - `upcoming`: Current time < Registration Start
  - `registration_open`: Registration Start ≤ Current time ≤ Registration Deadline
  - `hacking`: Event Start ≤ Current time ≤ Submission Deadline
  - `evaluating`: Submission Deadline < Current time ≤ Results Announcement
  - `concluded`: Event finished and winners announced
- **Roster Export (CSV):**
  - **Endpoint:** `GET /api/admin/hackathons/:id/export-csv`
  - **Security:** Requires Admin Bearer token.
  - **Formula Injection Mitigation:** Prepends single-quote `'` to cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
  - **Format:** RFC 4180 compliant CSV including Registration ID, Squad Name, Leader Name, Leader Email, Member Count, Payment Status, UTR, and Enrollment Date.

### 3.2 Audit Trail Console (`/admin/logs`)
- **Route:** `/admin/logs` (Requires Administrator role)
- **API:** `GET /api/admin/logs`
- **Immutability Protection:** Enforced at the Mongoose schema level (`server/models/secondary.js`). Updates, edits, and deletions are rejected by pre-hooks.
- **Fields Captured:**
  - `action`: Specific administrative operation (`PAYMENT_APPROVED`, `PAYMENT_REJECTED`, `UPDATE_SUPPORT_STATUS`, `DISQUALIFY_SQUAD`, `REINSTATE_SQUAD`, `BAN_SQUAD`, `REVEAL_PROBLEMS`).
  - `userId`: Email or ID of the authenticated administrator.
  - `role`: Role of the actor (`admin`).
  - `entityType`: Category (`PAYMENT`, `SUPPORT_TICKET`, `SQUAD`, `HACKATHON`).
  - `entityId`: Unique identifier of the target document.
  - `description`: Human-readable summary of the modification.
  - `ipAddress`: Client IP address from `x-forwarded-for` or socket.
  - `userAgent`: Calling browser or client environment.
  - `createdAt`: Immutable ISO 8601 server timestamp.
- **Privacy Guarantee:** Passwords, password hashes, session tokens, OTPs, and private financial credentials are never written to `ActivityLog`.

---

## 4. INCIDENT RESPONSE & TROUBLESHOOTING

### 4.1 Failed Student Logins & Account Lockouts
1. **Symptom:** Student reports "Invalid credentials" or cannot authenticate.
2. **Investigation:**
   - In MongoDB Atlas Data Explorer, inspect `users` collection:
     `{ email: "student@example.com" }`
   - Check `isVerified`: If `false`, student has not completed 6-digit OTP verification. Ask student to visit `/auth/otp` or re-trigger verification.
   - Check `isDisabled` / `isBanned`: If `true`, verify whether account was moderated.
3. **Password Reset:**
   - Have student use `/auth/forgot-password` to receive a signed reset link via Google Apps Script relay.

### 4.2 Support Ticket Escalations & Status Filtering
1. **Symptom:** Ticket missing from active list or admin cannot find ticket.
2. **Active Whitelist Policy:**
   - **Active:** strictly `open` and `in_progress`.
   - **Inactive:** `resolved` and `closed`.
   - Missing, null, empty, and unknown statuses are excluded from active views.
3. **Resolving Tickets:**
   - On `/admin/support`, select ticket -> change status dropdown to `resolved` or `closed`.
   - Backend automatically stamps `resolvedAt: new Date()` and writes to `ActivityLog`.

### 4.3 Email Delivery Failures (Google Apps Script Relay v5)
1. **Symptom:** Student does not receive OTP, password reset link, or payment review email.
2. **Root Causes & Diagnostics:**
   - **Daily Quota Reached:** Free consumer Google accounts allow 100 emails/day; Google Workspace accounts allow 1,500/day. Check Apps Script dashboard execution logs.
   - **Secret Mismatch:** Verify `EMAIL_RELAY_SECRET` in Render environment variables matches the secret configured in Google Apps Script `Script Properties`.
   - **Spam Filtering:** Instruct student to check Spam / Junk / Promotions tab in Gmail/Outlook.
3. **Manual Verification:** Test email relay via `curl`:
   ```bash
   curl -X POST "https://script.google.com/macros/s/AKfycby5O5Mebck13ZOit2vJIAXPtvwyuUsod8L6P5w1CsY59biQbgzAqPhQKHlBdwQ8P4yKkw/exec" \
     -H "Content-Type: application/json" \
     -d '{"secret":"<RELAY_SECRET>","type":"verification_otp","to":"test@example.com","data":{"otp":"123456","name":"Test User"}}'
   ```

### 4.4 Payment Proof Upload Failures & GridFS Storage Budget
1. **Symptom:** Student receives error during payment proof submission:
   - *HTTP 400 Bad Request:* File is not a raster image or contains prohibited SVG/executable content. Only JPEG, PNG, and WebP raster images are accepted.
   - *HTTP 413 Payload Too Large:* File exceeds the 5MB upload ceiling.
   - *HTTP 507 Insufficient Storage:* The 75MB GridFS storage budget is exhausted.
2. **Investigating Storage Capacity:**
   - Open `/admin/health` -> inspect **Storage Vault**.
   - If allocation exceeds 70MB, investigate whether pending or rejected payment proofs need archiving.
   - In MongoDB Atlas, query `storage_reservations` collection to inspect active vs expired leases. The automatic lease reconciler sweeps expired reservations every 10 minutes.

---

## 5. ROLLBACK & DEPLOYMENT MANAGEMENT

### 5.1 Vercel Frontend Instant Rollback
If a frontend defect is detected on `https://codesrijan-nine.vercel.app`:
1. Open Vercel Dashboard: `https://vercel.com/codesrijan/codesrijan/deployments`
2. Locate the previous verified stable deployment (e.g., commit `5f54f5c`).
3. Click the `...` menu on that deployment -> Select **Promote to Production**.
4. Vercel routes 100% of traffic to the previous deployment within 5 seconds.

### 5.2 Render Backend Rollback
If a backend defect causes API failures:
1. Open Render Web Service Dashboard: `https://dashboard.render.com/web/srv-db1b3ke0tbcc73ac3ea0/deploys`
2. Locate the last known good deploy (e.g., commit `8bbb8df`).
3. Click **Rollback to this deploy**.
4. Render immediately switches container traffic to the selected deploy artifact.

### 5.3 Git Branch Rollback Procedure
```bash
# To revert an undesirable commit cleanly without rewriting history:
git revert <faulty-commit-sha> -m 1
git push origin main master
```

---

## 6. DATABASE BACKUP & RESTORATION PROCEDURES

> [!WARNING]
> **Free-Tier Infrastructure Limitation:** MongoDB Atlas M0 clusters do **NOT** support automated continuous backups or point-in-time snapshot restoration. Backup and disaster recovery must be performed via manual or scripted exports.

### 6.1 Creating a Database Backup (`mongodump`)
To create a complete backup of the `codesrijan` keyspace:
```bash
# Requires MongoDB Database Tools installed (mongodump)
mongodump --uri="mongodb+srv://<USER>:<PASSWORD>@codesrijan.xxxx.mongodb.net/?retryWrites=true&w=majority" \
  --db="codesrijan" \
  --out="./backups/backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### 6.2 Restoring from a Backup (`mongorestore`)
> [!CAUTION]
> **Never restore directly to the live `codesrijan` keyspace without dry-run testing.**

1. **Step 1: Test Restore into Isolated Staging Keyspace:**
   ```bash
   mongorestore --uri="mongodb+srv://<USER>:<PASSWORD>@codesrijan.xxxx.mongodb.net/?retryWrites=true&w=majority" \
     --db="codesrijan_staging_test" \
     --drop \
     ./backups/backup_20261027_020000/codesrijan
   ```
2. **Step 2: Inspect Staging Data:** Verify user accounts, hackathons, and registrations in `codesrijan_staging_test`.
3. **Step 3: Production Disaster Restoration (Emergency Only):**
   ```bash
   mongorestore --uri="mongodb+srv://<USER>:<PASSWORD>@codesrijan.xxxx.mongodb.net/?retryWrites=true&w=majority" \
     --db="codesrijan" \
     --drop \
     ./backups/backup_20261027_020000/codesrijan
   ```

---

## 7. SECURITY INCIDENT RESPONSE (LOST ACCESS & CREDENTIAL ROTATION)

### 7.1 Leaked Admin Password or Compromised Session
1. **Immediate Session Invalidation:** In MongoDB Atlas, purge all sessions for the affected admin:
   ```javascript
   // In MongoDB mongosh:
   use codesrijan;
   db.sessions.deleteMany({ userId: "admin@codesrijan.com" });
   ```
2. **Update Admin Password:** Update the admin password in the `users` collection using bcrypt hashing (minimum 10 salt rounds).
3. **Rotate JWT Secret:** Update `JWT_SECRET` in Render Environment Variables and redeploy. This immediately invalidates all active tokens across the platform.

### 7.2 Leaked Database Connection String
1. Log in to MongoDB Atlas -> **Database Access** -> Update password for database user `codesrijan-app`.
2. Open Render Dashboard -> **Environment Variables** -> Update `MONGO_URI` with new password -> Trigger manual redeployment.

---

## 8. TOURNAMENT DAY OPERATIONAL LAUNCH CHECKLIST

Before opening tournament registration or kicking off hacking:

- [ ] **1. Public Catalog Verification:** Open `/hackathons`; verify event start dates, registration deadlines, and fee tiers match tournament guidelines.
- [ ] **2. Problem Statement Confidentiality:** Verify that problem statements remain classified (`STATUS: CLASSIFIED`) and cannot be accessed before tournament start time.
- [ ] **3. Payment Verification Queue:** Check `/admin/payments`; confirm all pending payment proofs submitted by squads are reviewed and approved/rejected with reasons.
- [ ] **4. Squad Roster Lock:** Verify that squad rosters for registered teams are locked (`isLocked: true`) to prevent last-minute unregistered member substitutions.
- [ ] **5. Support Coverage:** Ensure at least one designated organizer monitors `/admin/support` and the official support channel.
- [ ] **6. Email Quota:** Ensure email relay usage is well below the 100 emails/day threshold before mass announcements are dispatched.
- [ ] **7. Storage Headroom:** Check `/admin/health` to confirm GridFS storage headroom has at least 20MB remaining capacity for submission attachments.
