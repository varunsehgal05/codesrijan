# LIVE QA EVIDENCE INDEX

**Platform Tested:** CodeSrijan Deployed Live Platform  
**Live Frontend:** `https://codesrijan-nine.vercel.app`  
**Canonical API:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Audit Date:** 2026-10-24  
**Auditor / Agent Role:** QA Coordinator & Lead Release Auditor  
**Artifact Storage Location:** `artifacts/live-e2e-qa/`  

---

## 1. Directory Inventory & Artifact Manifest

All artifacts listed below were generated during live automated browser execution and direct REST API audits on the production CodeSrijan platform.

| Artifact Filename | File Size | Description & Verification Target | Primary Test Cases Supported |
| :--- | :---: | :--- | :--- |
| **`01_live_hackathons_directory.png`** | 144.8 KB | Full-page capture of live `/hackathons` catalog displaying newly created tournaments | `CS-001`, `CS-002`, `CS-035` |
| **`02_live_home_landing.png`** | 341.8 KB | Full-page capture of live landing page (`/`) showing hero, metrics, and navigation | `CS-001`, `CS-034` |
| **`03_live_admin_payments_queue.png`** | 84.8 KB | Live administrator review queue (`/admin/payments`) with UTR, fees, and audit buttons | `CS-010`, `CS-016`, `CS-017`, `CS-018` |
| **`04_live_notifications_center.png`** | 43.9 KB | Live Notification Center (`/notifications`) with tabs, batch controls, and action links | `CS-020`, `CS-021`, `CS-022` |
| **`05_viewport_mobile_320x700.png`** | 27.9 KB | Responsive layout verification at 320 × 700 (Ultra-compact mobile) | `CS-034` |
| **`05_viewport_mobile_375x812.png`** | 37.3 KB | Responsive layout verification at 375 × 812 (iPhone X/12 resolution) | `CS-034` |
| **`05_viewport_tablet_768x1024.png`** | 63.7 KB | Responsive layout verification at 768 × 1024 (iPad / Tablet portrait) | `CS-034` |
| **`05_viewport_laptop_1280x800.png`** | 62.1 KB | Responsive layout verification at 1280 × 800 (Compact laptop / MacBook Air) | `CS-034` |
| **`05_viewport_desktop_1440x900.png`** | 72.0 KB | Responsive layout verification at 1440 × 900 (Standard high-res desktop) | `CS-034` |
| **`mission_execution_summary.json`** | 13.5 KB | Raw JSON telemetry log from automated mission runner documenting all API mutations | All test cases |
| **`live_browser_audit_results.json`** | 12.4 KB | DOM metrics, network response statuses, and route audit log | All test cases |

---

## 2. Automated Regression Test Evidence Manifest

| Automated Test Suite | Execution Command | Result | Pass/Fail Breakdown | Integrity & Security Focus |
| :--- | :--- | :---: | :---: | :--- |
| **Admin Team & Payment Rejection** | `node --test server/test_admin_team_and_rejection.mjs` | **PASS** | 3 / 3 PASS | Rejection reason enforcement, in-app notifications, team verification |
| **Audit Journeys & Security** | `node server/test_audit_journeys.mjs` | **PASS** | 27 / 27 PASS | Roster locks, team invites, status transitions, token security |
| **Atomic Concurrency & Races** | `node server/test-security-atomic.js` | **PASS** | 1 / 1 PASS | Atomic payment decision race conditions (HTTP 409 immunity) |
| **Paid Acceptance Test** | `node server/test_final_paid_acceptance.mjs` | **PASS** | 1 / 1 PASS | End-to-end paid tournament enrollment & admin clearance |
| **Data Isolation & QA Guard** | `node server/test-qa-data-isolation.mjs` | **PASS** | 7 / 7 PASS | QA test records filtering from production metrics |
| **TypeScript & Bundle Build** | `npm run build` | **PASS** | 0 errors | Production client bundle generation across all 67 routes |

---

## 3. Security & Non-Disclosure Assertion

In accordance with strict security requirements:
- No passwords, passkeys, JWT bearer tokens, session hashes, database connection URIs, or private keys are present in any of the above evidence artifacts or documentation reports.
- All references to student test accounts use the standardized anonymized labels: **User 1**, **User 2**, **User 3**, and **User 4**.
