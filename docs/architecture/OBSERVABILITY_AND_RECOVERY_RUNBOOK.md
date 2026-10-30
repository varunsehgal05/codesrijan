# CODESRIJAN — OBSERVABILITY AND INCIDENT RECOVERY RUNBOOK

**Target Infrastructure:** Vercel Edge + Render Service `srv-db1b3ke0tbcc73ac3ea0` + MongoDB Atlas Cluster `codesrijan-cluster`  
**Budget Policy:** $0.00 / Month (Native platform logs, in-process probes, and safe administrative diagnostics).  

---

## 1. HEALTH CHECKS & PROBING ARCHITECTURE

### 1.1 Public Liveness Probe (`GET /health`)
- **Route:** `https://codesrijan-api-6tfr.onrender.com/health`
- **Output Schema:**
```json
{
  "status": "healthy",
  "uptime": 14205.42,
  "timestamp": "2026-10-30T06:30:00.000Z",
  "database": "connected",
  "keyspace": "codesrijan",
  "version": "3.4.0"
}
```
- **Security Check:** Zero connection string or credential disclosure. Discloses process readiness only.

### 1.2 Administrative Deep Telemetry (`GET /api/admin/health`)
- **Route:** Accessible only to `admin@codesrijan.com` with valid JWT.
- **Diagnostics:** Active socket count, memory utilization (heapUsed vs heapTotal), MongoDB collection document counts, and SrijanBot provider latency.

---

## 2. RECOVERY PROCEDURES

### Scenario A: Vercel Frontend Deployment Failure / Build Error
1. Open the Vercel Dashboard (`https://vercel.com/codesrijan/codesrijan/deployments`).
2. Identify the broken build marked with "Status: Error".
3. Locate the latest stable deployment (e.g. `5a4ed39` or `7057b05`).
4. Click the three dots `...` on the stable card and select **Promote to Production / Instant Rollback**.
5. The rollback executes across Vercel edge within 15 seconds without rebuild overhead.

### Scenario B: Render Free Tier Service Cold-Start / Dormancy
1. Free instances spin down after 15 minutes of inactivity.
2. The initial request to `https://codesrijan-api-6tfr.onrender.com/api` may take 30-50 seconds to wake the container.
3. The React client displays an authentic Neo-Brutalist loading indicator: `CONNECTING TO MAINFRAME // SPINNING UP RUNTIME`.
4. Once the `/health` probe returns 200 OK, the client transparently retries and resumes execution.

### Scenario C: Database Integrity Desync
1. Run direct audit script: `node scripts/audit_db_live.mjs`.
2. Confirm the 8 designated user accounts and 2 official hackathons are present.
3. If an unauthorized duplicate document is detected, execute targeted remediation via `node server/scripts/clean_db.mjs`.
