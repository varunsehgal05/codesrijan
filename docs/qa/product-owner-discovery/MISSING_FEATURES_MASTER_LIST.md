# CODESRIJAN — PRIORITIZED MISSING-WORK MASTER LIST

**Audit Date:** October 30, 2026  
**Auditor:** Principal Software Architect & Release Manager  
**Priority Legend:**
* **P0 — Critical:** Security vulnerability, financial leakage, or data corruption risk.
* **P1 — Essential:** Core hackathon functionality required for smooth event execution.
* **P2 — Important:** User experience, operational efficiency, and workflow consolidation.
* **P3 — Optional:** Long-term future enhancements and enterprise integrations.

---

## Prioritized Missing Feature Inventory

| ID | Feature / Module | Existing State | Missing Capability | Evidence & Source | User Impact | Recommendation | Complexity | Priority | Owner Approval Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **SEC-01** | Multi-Tenant Data Isolation | Global flat collection queries | Scoped queries by `organizationId` or `eventScopeId` | `server/server.js` | One organizer could view or modify another organizer's event data | Enforce tenant scoping middleware across all admin routes | High | **P0** | **YES** |
| **FIN-01** | Duplicate Payment Slip Check | Only checks 12-digit UTR string | Perceptual image hashing (pHash) on uploaded screenshots | `server/services/storage.js` | Students could reuse identical payment slips with different UTRs | Implement perceptual image hash check against verified slip index | Medium | **P0** | NO |
| **REL-01** | Automated Database Backup | Manual script only | Daily scheduled cron backup | `server/export_backup_free.mjs` | Risk of permanent data loss if Atlas M0 cluster fails | Set up GitHub Action nightly cron running encrypted mongodump | Low | **P0** | NO |
| **OPS-01** | Physical Venue QR Check-In | No check-in route exists | PWA QR badge scanner for door volunteers | Absent in `src/routes/` | Long manual queues and paper spreadsheets at physical venue entrance | Build `/volunteer/checkin` route with smartphone camera QR scanning | Medium | **P1** | **YES** |
| **JUD-01** | Blind Judging Mode | Judges see team & college names | De-identified evaluation cards (anonymous team codes) | `src/routes/evaluations.tsx` | Unconscious bias favoring prestigious universities | Add a toggle to mask student and college names in judge portal | Low | **P1** | **YES** |
| **JUD-02** | Score Normalization (Z-Score) | Naive arithmetic averaging | Statistical normalization across judge panels | `server/server.js` | Teams assigned to strict judges unfairly lose to lenient judges | Implement z-score or min-max normalization formula | Medium | **P1** | **YES** |
| **SUB-01** | GitHub Visibility Verification | Accepts any URL string | Automated GitHub API check for repository public access | `src/routes/workspace.tsx` | Students submit private repos that judges cannot evaluate | Ping GitHub API on submit to verify repo is public | Low | **P1** | NO |
| **TM-01** | Abandoned Squad Leader Fix | Only leader can submit | Emergency co-leader promotion or majority vote | `src/routes/team.tsx` | Squad blocked from submitting if leader's laptop dies at 11:59 PM | Add 1-click admin transfer and teammate succession vote | Medium | **P1** | NO |
| **CRT-01** | Public Certificate Verification | Client-side download only | Public URL `/verify/:id` with cryptographic signature | `src/routes/certificates.tsx` | Employers cannot verify student certificate authenticity | Implement public verification route with immutable hash | Medium | **P1** | NO |
| **FIN-02** | 1-Click CSV Financial Export | Admin table view only | Export audited payments to Excel/CSV | `src/routes/admin.payments.tsx` | Organizers spend hours reconciling bank statements manually | Add CSV export button with transaction timestamps and reviewer | Low | **P2** | NO |
| **UX-01** | Squad Management Consolidation | Fragmented across 4 routes | Unified squad hub inside `/workspace` | `/dashboard`, `/recruitment`, `/team`, `/workspace` | High student confusion and excessive navigation clicks | Consolidate squad controls into a unified HUD drawer | Medium | **P2** | NO |
| **NOT-01** | Foreground Push Notifications | Backend FCM wired; service worker missing | Active service worker receiving browser push | `server/services/fcm.js` | Students miss critical announcements when browser tab is closed | Register service worker for background push delivery | Medium | **P2** | NO |
| **SRJ-01** | SrijanBot Semantic Caching | Calls Groq API on every query | Local in-memory cache for common event queries | `server/services/srijanbot.js` | Risk of hitting Groq 30 RPM rate limit during peak hours | Cache static event answers in memory with 5-minute TTL | Low | **P2** | NO |
| **EVT-01** | Calendar Subscription (.ics) | Static timeline only | 1-click "Add to Google Calendar" for milestone deadlines | `src/routes/timeline.tsx` | Students miss submission deadline due to time zone confusion | Generate downloadable `.ics` file with all event milestones | Low | **P3** | NO |
| **FDB-01** | Post-Event Participant Survey | No feedback route exists | Post-hackathon Net Promoter Score (NPS) modal | Absent in `src/routes/` | Organizers gain no structured feedback to improve next event | Trigger optional 3-question survey upon certificate unlock | Low | **P3** | **YES** |

---

*Classified according to operational impact, implementation complexity, and governance necessity.*
