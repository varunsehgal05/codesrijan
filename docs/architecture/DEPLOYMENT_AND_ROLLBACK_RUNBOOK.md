# CODESRIJAN — DEPLOYMENT AND ROLLBACK RUNBOOK

---

## 1. PRODUCTION DEPLOYMENT WORKFLOW

CodeSrijan uses a continuous integration and automated deployment pipeline triggered by changes pushed to `origin/main`.

```
Local Development / Fix
         |
    npm run build (Vite & SSR test)
         |
    node server/test_focused_regression.mjs (19 Scenarios)
         |
    git commit -m "..." && git push origin main
         |
   +-----+-------------------------+
   |                               |
   v                               v
[ Vercel Edge Build ]     [ Render API Deployment ]
   - Auto-detected push     - Webhook or Manual Trigger
   - Duration: ~28s         - Duration: ~46s
   - Target: Production     - Target: srv-db1b3ke0tbcc73ac3ea0
```

---

## 2. STEP-BY-STEP ROLLBACK INSTRUCTIONS

### 2.1 Vercel Frontend Rollback
1. Open the Vercel Deployments dashboard: `https://vercel.com/codesrijan/codesrijan/deployments`.
2. Locate the deployment preceding the faulty release (e.g., `5a4ed39`).
3. Click the context menu `...` on the target card.
4. Select **Instant Rollback**.
5. Vercel automatically routes all global edge traffic to the previous deployment within 10-15 seconds.

### 2.2 Render Backend Rollback
1. Open the Render Dashboard: `https://dashboard.render.com/web/srv-db1b3ke0tbcc73ac3ea0/deploys`.
2. Locate the last known good deployment card.
3. Click the options menu on that card and select **Rollback to this deploy**.
4. Render switches traffic to the container image of that commit immediately without rebuilding.

---

## 3. POST-DEPLOYMENT VERIFICATION GATE
Following every production release, run the automated verification suite:
```bash
node scripts/audit_db_live.mjs
node scripts/test_live_api_suite.mjs
```
Confirm:
- MongoDB contains strictly 8 users and exactly 2 hackathons.
- Health endpoint returns HTTP 200 OK.
- Auth endpoints issue valid JWT tokens for both admin and student.
