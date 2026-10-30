# CODESRIJAN — MISSING FEATURES MASTER LIST & PRIORITIZED GAP CATALOG
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-15` | **Total Features Cataloged**: 35  
**Priority Tiers**: P0 (Critical Security & Finance), P1 (Essential Core Workflow), P2 (Important UX/Operations), P3 (Future Horizons)  

---

## 1. Master Missing Features Catalog

| Feature ID | Domain | Feature Name & Scope | Target Users | Priority | Impact | Complexity | Dependencies |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **FEAT-SEC-01** | Security | Multi-Tenant Resource Guard Middleware | Admins / Org | **P0** | Prevents cross-organizer data traversal (BOLA/IDOR) | Medium | Multi-tenant schema |
| **FEAT-FIN-01** | Finance | Duplicate UTR Transaction Detection | All | **P0** | Prevents double-spending of identical UPI reference IDs | Low | MongoDB Unique Index |
| **FEAT-FIN-02** | Finance | Atomic Payment Approval Lock | Admins | **P0** | Eliminates race conditions during concurrent admin approvals | Low | Mongoose `findOneAndUpdate` |
| **FEAT-FIN-03** | Finance | Exportable Financial Transaction Ledger | Accountants | **P0** | Generates CSV/Excel balance sheets for event reconciliation | Medium | `FinancialLedger` model |
| **FEAT-CORE-01**| Multi-Tenancy | Organization Data Model & Multi-Organizer Onboarding | Organizers | **P1** | Allows universities and clubs to host independent hackathons | High | RBAC refactor |
| **FEAT-CORE-02**| Hackathons | Multi-Event Discovery & Search Filters | Students | **P1** | Search by tech stack, online/offline, free/paid, college | Medium | Indexing & UI pills |
| **FEAT-CORE-03**| Hackathons | Event Draft vs Published Lifecycle Gate | Organizers | **P1** | Organizers configure events without premature public leak | Low | Event status enum |
| **FEAT-TEAM-01**| Teams | Compound Multi-Team Enrollment Guard | Students | **P1** | Restricts student to max 1 team per active event | Low | Unique compound index |
| **FEAT-TEAM-02**| Teams | Captain Leadership Delegation & Succession | Captains | **P1** | Prevents orphaned squads when a captain leaves | Medium | Team transfer API |
| **FEAT-TEAM-03**| Teams | Post-Deadline Roster Freezing Protocol | All | **P1** | Disables team mutations once registration closes | Low | Wall-clock check |
| **FEAT-SUBM-01**| Submissions | Public GitHub Repository Pre-Flight Check | Builders | **P1** | Verifies repo exists, is public, and records exact Git commit SHA | Medium | GitHub Public API |
| **FEAT-SUBM-02**| Submissions | Cryptographic Submission Receipts | Builders | **P1** | Generates verifiable receipt with timestamp and hash | Low | SHA-256 generator |
| **FEAT-SUBM-03**| Submissions | 5-Minute Network Buffer Grace Period | Builders | **P1** | Protects builders from last-second upload drops | Low | Server timestamp logic |
| **FEAT-JUDG-01**| Judging | Blind Judging Anti-Bias Mode | Judges | **P1** | Hides team name and college during evaluation | Medium | Evaluator view filter |
| **FEAT-JUDG-02**| Judging | Multi-Criterion Weighted Scoring Rubrics | Judges | **P1** | Evaluates projects by weighted criteria (Innovation, Tech, Polish) | Medium | Rubric engine |
| **FEAT-JUDG-03**| Judging | Formal Tie-Breaking Protocol | Admins | **P1** | Automated tie-breaking based on technical depth and timestamp | Low | Leaderboard sorter |
| **FEAT-CERT-01**| Certificates | Unauthenticated Public Certificate Verification Gateway | Public / HR | **P1** | Allows LinkedIn viewers and recruiters to verify credentials | Low | `/verify/$id` route |
| **FEAT-CERT-02**| Certificates | 1-Click "Add to LinkedIn Profile" Deep Link | Students | **P1** | Builders share verified achievements on professional networks | Low | LinkedIn URL schema |
| **FEAT-OPS-01** | Operations | Dynamic QR Venue Attendance Scanner | Staff | **P2** | Check-in participant badges and track physical presence | Medium | HTML5 QR scanner |
| **FEAT-OPS-02** | Operations | Synchronized Dynamic Schedule / Sessions Manager | All | **P2** | Live "Happening Now" milestone ticker with meeting links | Medium | Schedule collection |
| **FEAT-OPS-03** | Operations | SOS Mentor Dispatch Concurrency Lock | Mentors | **P2** | Prevents multiple mentors from claiming the same ticket | Low | Atomic claim status |
| **FEAT-OPS-04** | Operations | Urgent Screen-Takeover Broadcast Modal | All | **P2** | Alerts participants to emergency schedule extensions | Low | Socket.io + Audio chime |
| **FEAT-COMM-01**| Comms | Support Ticket Assignment & Triage Matrix | Admins | **P2** | Assigns helpdesk tickets to specific staff/mentors | Medium | Support schema update |
| **FEAT-COMM-02**| Comms | Participant Notification Preference Center | Students | **P2** | Granular controls for email, push, and in-app alerts | Low | User settings schema |
| **FEAT-REP-01** | Analytics | Unified Single-Screen Organizer Operations Cockpit | Organizers | **P2** | Real-time telemetry for registrations, payments, and judging | Medium | Aggregation pipeline |
| **FEAT-POST-01**| Post-Event | Project Hall of Fame & Gallery Showcase | Public | **P2** | Permanent public gallery of winning projects and demos | Low | `/gallery` update |
| **FEAT-POST-02**| Post-Event | In-App Participant NPS Feedback Survey | Organizers | **P2** | Collects feedback on venue, food, mentors, and platform | Low | Survey modal |
| **FEAT-GROW-01**| Growth | Event Bookmarks & Saved Challenges | Students | **P3** | Bookmark hackathons and problem statements | Low | Bookmark collection |
| **FEAT-GROW-02**| Growth | Personalized Teammate Matchmaking Recommendations | Students | **P3** | Suggests candidates matching missing team skills | Medium | Vector/cosine similarity |
| **FEAT-GROW-03**| Growth | Verified Organizer Trust Badges | Organizers | **P3** | Verified collegiate society badge (e.g. "ACM Verified") | Low | Org badge property |
| **FEAT-GROW-04**| Growth | Event Referral & Squad Share Links | Students | **P3** | Generates tracked invite cards for WhatsApp and Twitter | Low | URL query parser |
| **FEAT-JUDG-04**| Judging | Statistical Score Normalization (Z-Score) | Judges | **P3** | Normalizes scores between strict and lenient judges | High | Statistical pipeline |
| **FEAT-AUTH-01**| Identity | Google / GitHub 1-Click OAuth Sign-In | All | **P3** | Frictionless developer authentication | Medium | Firebase OAuth |
| **FEAT-AUTO-01**| Automation | Automated Code Plagiarism Similarity Scan | Organizers | **P3** | AST-based repository comparison to detect copied code | High | MOSS background job |
| **FEAT-FIN-04** | Finance | Razorpay / Cashfree Automated Payment Gateway | Organizers | **P3** | Instant online fee clearance and automated refunds | High | Payment webhooks |

---

## 2. Priority Distribution Summary
- **P0 (Critical Security & Finance)**: 4 Features (11.4%) — Must be resolved prior to handling public funds.
- **P1 (Essential Core Workflows)**: 14 Features (40.0%) — Required for reliable multi-tenant hackathon operations.
- **P2 (Important Operations & UX)**: 9 Features (25.7%) — Maximizes organizer efficiency and day-of-event reliability.
- **P3 (Future Growth & Horizons)**: 8 Features (22.9%) — Long-term competitive differentiators.

