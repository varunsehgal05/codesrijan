# CODESRIJAN — CROSS-ROLE INTERACTION MATRIX
**Execution Date:** 2026-11-05T08:23:01.000Z  
**Target Backend:** `https://codesrijan-api-6tfr.onrender.com/api` (Render `srv-db1b3ke0tbcc73ac3ea0`)  
**Target Frontend:** `https://codesrijan-nine.vercel.app`  
**Total Role Interactions Tested:** 25  
**Passed:** 25 | **Failed:** 0 | **Pass Rate:** 100%

---

## 1. Empirical Results Table

| Test ID | Role Pair | Workflow / Assertion | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AUTH-ADMIN` | AUTH-ADMIN | Admin authentication | `200` | `200` | ✅ PASS |
| `AUTH-JUDGE` | AUTH-JUDGE | Judge authentication | `200` | `200` | ✅ PASS |
| `AUTH-MENTOR` | AUTH-MENTOR | Mentor authentication | `200` | `200` | ✅ PASS |
| `AUTH-STUDENT` | AUTH-STUDENT | Student authentication | `200` | `200` | ✅ PASS |
| `ANON-BOUNDARY-Admin_Health_Telemetry` | ANON-BOUNDARY | Anonymous request to Admin Health Telemetry | `401/403 Unauthorized` | `401` | ✅ PASS |
| `ANON-BOUNDARY-Judge_Dashboard` | ANON-BOUNDARY | Anonymous request to Judge Dashboard | `401/403 Unauthorized` | `401` | ✅ PASS |
| `ANON-BOUNDARY-Mentor_Dashboard` | ANON-BOUNDARY | Anonymous request to Mentor Dashboard | `401/403 Unauthorized` | `401` | ✅ PASS |
| `ANON-BOUNDARY-Squad_Mentor_Requests` | ANON-BOUNDARY | Anonymous request to Squad Mentor Requests | `401/403 Unauthorized` | `401` | ✅ PASS |
| `PAIR-SM-001` | PAIR-SM | Student can read squad mentor requests | `200` | `200` | ✅ PASS |
| `PAIR-SM-002` | PAIR-SM | Mentor receives guidance queue in Command Center | `200` | `200` | ✅ PASS |
| `PAIR-SM-003` | PAIR-SM | Student strictly denied from reading private mentor notes | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-SJ-001` | PAIR-SJ | Judge Command Center loads assigned submissions | `200` | `200` | ✅ PASS |
| `PAIR-SJ-002` | PAIR-SJ | Student cannot access Judge Dashboard | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-SJ-003` | PAIR-SJ | Student cannot submit evaluations | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-JA-001` | PAIR-JA | Admin can retrieve judge assignments | `200` | `200` | ✅ PASS |
| `PAIR-JA-002` | PAIR-JA | Admin can review submitted projects queue | `200` | `200` | ✅ PASS |
| `PAIR-JA-003` | PAIR-JA | Judge cannot access Admin assignment governance | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-MA-001` | PAIR-MA | Admin can retrieve mentor assignments | `200` | `200` | ✅ PASS |
| `PAIR-MA-002` | PAIR-MA | Mentor cannot call Admin mentor-assignments endpoint | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-SA-001` | PAIR-SA | Student can fetch support tickets | `200` | `200` | ✅ PASS |
| `PAIR-SA-002` | PAIR-SA | Student cannot access Admin platform health telemetry | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-MJ-001` | PAIR-MJ | Judge cannot access Mentor Command Center | `403 Forbidden` | `403` | ✅ PASS |
| `PAIR-MJ-002` | PAIR-MJ | Mentor cannot access Judge Command Center | `403 Forbidden` | `403` | ✅ PASS |
| `TIMELINE-001` | TIMELINE-001 | Public hackathon timeline endpoint status | `200` | `200` | ✅ PASS |
| `SRIJANBOT-001` | SRIJANBOT-001 | SrijanBot returns exact tournament submission deadline | `Contains date & deadline details` | `Your active tournament "CodeSrijan Impact Challenge — Free Edition" has the foll` | ✅ PASS |

---
*Verified with live cryptographic JWT tokens and live MongoDB transactions.*