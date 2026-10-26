# CODESRIJAN 1.0 — PAYMENTS, GRIDFS VAULT & EMAIL RELAY QA REPORT
**Subagent Designation:** Subagent E (Financial Workflow, GridFS Storage & Transactional Email QA)  
**Document Version:** 1.0.0-RELEASE  
**Production Backend API:** [https://codesrijan-api-6tfr.onrender.com/api](https://codesrijan-api-6tfr.onrender.com/api)  
**Storage Architecture:** MongoDB GridFS `paymentProofs` bucket with Atomic Ledger  
**Email Gateway:** Google Apps Script Relay v5 (Gmail API, Deployment ID: `AKfycby5...`)  

---

## 1. FINANCIAL WORKFLOW & FEE CALCULATION VERIFICATION

| Tournament Scenario | Authoritative Fee | Solo Operative Fee | 4-Person Squad Fee | Verification Status |
|---|---|---|---|---|
| **Free Edition** (`HACK-FREE-1792862581267`) | ₹0 | ₹0 (Instant Enrollment) | ₹0 (Instant Enrollment) | **PASS — LIVE VERIFIED** |
| **Paid Edition** (`HACK-PAID-1792862582632`) | ₹100 / participant | ₹100 | ₹400 | **PASS — LIVE VERIFIED** |

### Key Invariant:
Payment fee calculation is strictly enforced on the server in `server/server.js`. Modifying client-side state or manipulating DOM values cannot alter the authoritative registration fee or clearance threshold.

---

## 2. GRIDFS STORAGE ADAPTER & CAPACITY ADMISSION TESTS

### 2.1 Storage Budget Constraints
- **Keyspace Limit:** MongoDB Atlas M0 (512MB shared storage).
- **Proof Vault Ceiling:** 75.00 MB (`PROOF_STORAGE_BUDGET_BYTES = 78643200`).
- **Headroom Verified Live:** Committed 31.93 KB, Headroom 74.97 MB (0.04% allocated), verified on `/admin/health` (`admin_health_loaded_1793052322656.png`).

### 2.2 Automated Capacity & Concurrency Checks
Executed across 3 specialized storage suites:
1. `node --test server/test_gridfs_storage.mjs`: **15/15 PASS**
   - Validates upload chunking, download streaming, security headers (`Content-Disposition: inline`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`), and query-token authentication rejection.
2. `node --test server/test_gridfs_concurrency.mjs`: **4/4 PASS**
   - 8 concurrent parallel uploads against tight budget: exactly 3 admitted, 5 rejected with `HTTP 413 / 507`.
   - Released reservations immediately restore ledger capacity.
   - Orphaned and abandoned reservations swept automatically without ledger corruption.
3. `node --test server/test_gridfs_lease_lifecycle.mjs`: **4/4 PASS**
   - Active lease renewal during slow uploads prevents premature lease expiration.
   - Expired leases trigger automatic abort and chunk cleanup.
   - Ledger non-negative invariant enforced under heavy mixed concurrent database writes.

---

## 3. FILE VALIDATION & SECURITY CHECKS

Executed via `node --test server/test_firebase_and_catalog_regression.mjs` (8/8 PASS):
- **Raster Formats Accepted:** JPEG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`).
- **Vector Formats Blocked:** SVG strictly rejected with `HTTP 400 Bad Request` (prevents stored XSS).
- **Size Bounds:** Files > 5MB rejected with `HTTP 413 Payload Too Large`.
- **Magic Byte Verification:** Text files renamed to `.jpg` or `.png` rejected via buffer header inspection.

---

## 4. EMAIL RELAY ARCHITECTURE & DEPLOYMENT v5

### 4.1 Zero-Cost Email Dispatch
- Transports transactional emails (Verification OTP, Password Reset, Payment Review Notifications).
- Authenticated via server-side HMAC-SHA256 signature in `X-Codesrijan-Signature`.
- Production Deployment: **Version 5** confirmed active on Google Apps Script (`AKfycby5O5Mebck13ZOit2vJIAXPtvwyuUsod8L6P5w1CsY59biQbgzAqPhQKHlBdwQ8P4yKkw`).
- Visual Proof: `apps_script_manage_deployments_1793046205707.png`.
- Quota: 100 emails/day free rolling quota; fails gracefully with fallback logs if quota exceeded.

---

## 5. CONCLUSION
The financial, file vault, and email notification pipelines strictly protect the $0/month budget while preventing storage denial-of-service and unauthorized receipt access.
