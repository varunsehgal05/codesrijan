# CODESRIJAN — BACKUP AND DISASTER RECOVERY GUIDE

**Database Cluster:** MongoDB Atlas Free Tier (`codesrijan-cluster.mrckx43.mongodb.net`)  
**Primary Database:** `codesrijan`  
**Zero-Budget Policy:** Leverages MongoDB Atlas native snapshots and local JSON/BSON dump scripts without paid third-party backup tools.  

---

## 1. BACKUP STRATEGY & CADENCE

### 1.1 Automated Cloud Snapshots (Atlas M0)
- MongoDB Atlas provides continuous point-in-time oplog retention and periodic cluster snapshots on free-tier clusters.
- Retention: Daily automated snapshots retained according to Atlas standard policies.

### 1.2 Programmatic Logical Backups (Zero-Budget Script)
CodeSrijan maintains an offline backup utility that serializes all production collections into sanitized JSON documents.
- Script location: `scripts/backup_database.mjs`
- Target archive path: `backups/codesrijan_backup_<timestamp>.json`
- Invariant snapshot: Captures all 8 designated accounts, 2 hackathons, support tickets, and certificates.

---

## 2. DISASTER RECOVERY PROCEDURE

In the event of accidental data corruption or catastrophic failure:

1. **Pause Ingress Traffic:**
   - In `server/server.js`, set `globalSettings.maintenanceMode = true`. The API immediately returns HTTP 503 Service Unavailable with a friendly retry header.
2. **Execute Database Restoration:**
   - Connect via MongoDB Atlas CLI or Mongoose restoration script:
     ```bash
     node scripts/restore_database.mjs --archive=backups/codesrijan_backup_stable.json
     ```
3. **Verify Restored Invariants:**
   - Run `node scripts/audit_db_live.mjs` to confirm:
     - 8 User accounts (`admin@codesrijan.com`, `student@codesrijan.com`, `hacker1-6@codesrijan.com`).
     - Exactly 2 Hackathons (1 Free, 1 Paid).
4. **Resume Ingress Traffic:**
   - Re-enable `globalSettings.maintenanceMode = false`.
   - Clear client browser state and confirm normal user journey operation.
