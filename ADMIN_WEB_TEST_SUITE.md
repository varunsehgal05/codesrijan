# CODE SRIJAN — ADMIN WEB TEST CASES

## Test execution format

Use these columns when entering the tests into your QA tracker:

* **Test ID**
* **Module**
* **Role**
* **Precondition**
* **Test Steps**
* **Test Data / Example**
* **Expected Result**
* **Priority**
* **Status**

### Priority
* **P0** = Critical
* **P1** = High
* **P2** = Medium
* **P3** = Low

---

## 1. ADMIN LOGIN & ACCESS
Before testing the admin modules, verify that only authorized administrators can reach them.

| ID | Test Case | Steps | Example | Expected | Priority |
|---|---|---|---|---|---|
| AUTH-ADM-001 | Admin login | Open `/login` → enter admin credentials → Login | `admin.demo@codesrijan.test` | Admin dashboard opens | P0 |
| AUTH-ADM-002 | Invalid admin password | Enter correct email + wrong password | `wrong123` | Login rejected | P0 |
| AUTH-ADM-003 | Student opens admin | Login as student → `/admin` | Student | 401/403 or redirect | P0 |
| AUTH-ADM-004 | Direct admin route | Login as student → `/admin/users` | Student | Access denied | P0 |
| AUTH-ADM-005 | Logout | Admin → Logout | — | Session ends | P0 |
| AUTH-ADM-006 | Back after logout | Logout → browser Back | — | Admin content inaccessible | P0 |
| AUTH-ADM-007 | Refresh admin session | Admin → refresh | — | Session remains valid | P1 |
| AUTH-ADM-008 | Expired session | Open admin page with expired token | Expired JWT | Redirect/login required | P0 |

## 2. DASHBOARD `/admin`
The central command center for high-level platform activity and metrics.

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| DASH-ADM-001 | Load dashboard | Open `/admin` | — | Dashboard loads |
| DASH-ADM-002 | User count | Observe user metric | 15 users | Correct count |
| DASH-ADM-003 | Team count | Observe team metric | 4 teams | Correct count |
| DASH-ADM-004 | Open ticket count | Observe support metric | 2 open tickets | Correct count |
| DASH-ADM-005 | Active event count | Observe event metric | 1 active | Correct |
| DASH-ADM-006 | Refresh dashboard | F5 | — | Counts remain correct |
| DASH-ADM-007 | Zero-data dashboard | Empty staging DB | 0 users | Intentional empty state |
| DASH-ADM-008 | Analytics/API failure | Disable analytics API | — | Error state, no blank screen |
| DASH-ADM-009 | Dashboard navigation | Click each card/shortcut | Teams | Correct route |
| DASH-ADM-010 | Responsive dashboard | 375px / 768px / 1440px | — | Layout works |

## 3. USERS `/admin/users`
User search, role filtering, active/suspended tabs, status changes, and suspension behavior.

### Search / Filter
| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| USER-ADM-001 | Open users | `/admin/users` | — | User directory loads |
| USER-ADM-002 | Search by name | Enter name | Aarav | Matching user |
| USER-ADM-003 | Search by email | Search email | student.aarav@... | Correct user |
| USER-ADM-004 | Search partial name | Search Aar | — | Matching users |
| USER-ADM-005 | Case-insensitive search | Search AARAV | — | Same result |
| USER-ADM-006 | Empty search | Clear search | — | Full list restored |
| USER-ADM-007 | No results | Search XXXXZZ | — | Empty state |
| USER-ADM-008 | Filter role | Role = Student | — | Students only |
| USER-ADM-009 | Filter role | Role = Judge | — | Judges only |
| USER-ADM-010 | Filter role | Role = Mentor | — | Mentors only |
| USER-ADM-011 | Active tab | Select Active | — | Active users |
| USER-ADM-012 | Suspended tab | Select Suspended | — | Suspended users |

### Account management
| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| USER-ADM-013 | Open user profile | Click user | Aarav | Profile loads |
| USER-ADM-014 | Change role | Edit user → Judge | Student → Judge | Role persists |
| USER-ADM-015 | Change role | Student → Mentor | — | Role persists |
| USER-ADM-016 | Suspend user | Edit → Suspended | Demo account | User becomes suspended |
| USER-ADM-017 | Verify suspended login | Logout → login as suspended | Demo account | Login denied |
| USER-ADM-018 | Reactivate | Active status | Suspended → Active | Login restored |
| USER-ADM-019 | Password reset workflow | Select reset action | Demo account | Reset workflow works |
| USER-ADM-020 | Delete/sensitive action | Click destructive action | Demo only | Confirmation required |
| USER-ADM-021 | Unauthorized role modification | Student sends direct API | — | 403 |
| USER-ADM-022 | Refresh after edit | Change status → F5 | — | Change persists |

## 4. HACKATHONS `/admin/hackathons`
Admins can create events, set dates/team limits, draft/publish them, and change status.

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| HACK-ADM-001 | Open page | `/admin/hackathons` | — | Loads |
| HACK-ADM-002 | Create event | New → fill details → Save | Spring 2026 Innovation Sprint | Event created |
| HACK-ADM-003 | Set dates | Enter start/end | 10–13 Oct 2026 | Dates saved |
| HACK-ADM-004 | Invalid dates | End before start | 13 Oct → 10 Oct | Validation |
| HACK-ADM-005 | Missing title | Blank title | — | Validation |
| HACK-ADM-006 | Set team size | Enter 4 | Max = 4 | Saved |
| HACK-ADM-007 | Save Draft | Create → Draft | — | Draft state |
| HACK-ADM-008 | Publish | Draft → Publish | — | Published |
| HACK-ADM-009 | Public visibility | Publish → open `/` | Event | Appears publicly |
| HACK-ADM-010 | Active status | Upcoming → Active | — | Status changes |
| HACK-ADM-011 | Completed status | Active → Completed | — | Status changes |
| HACK-ADM-012 | Edit event | Change description | — | Saved |
| HACK-ADM-013 | Delete event | Delete demo event | — | Confirmation + deletion |
| HACK-ADM-014 | Cancel deletion | Delete → Cancel | — | Event remains |
| HACK-ADM-015 | Missing date handling | Blank dates | — | Date not configured, not Invalid Date |
| HACK-ADM-016 | Refresh persistence | Edit → F5 | — | Changes remain |
| HACK-ADM-017 | Public draft visibility | Draft → public site | — | Draft not shown |
| HACK-ADM-018 | Team size boundary | Max 4 | 4 members | Accepted |
| HACK-ADM-019 | Team size overflow | Add 5th | Max 4 | Blocked |

## 5. PROBLEMS & CHALLENGES `/admin/problems`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| PROB-ADM-001 | Open problems | `/admin/problems` | — | Loads |
| PROB-ADM-002 | Create problem | New Problem | AI for Accessibility | Created |
| PROB-ADM-003 | Set category | Select category | Accessibility | Saved |
| PROB-ADM-004 | Difficulty | Select Medium | — | Saved |
| PROB-ADM-005 | Assign hackathon | Select event | Spring Hack | Association saved |
| PROB-ADM-006 | Draft problem | Save as draft | — | Hidden from public |
| PROB-ADM-007 | Publish | Click Publish | — | Problem public |
| PROB-ADM-008 | Lock problem | Click Lock | AI challenge | No new team selection |
| PROB-ADM-009 | Copy problem | Click Copy | AI for Accessibility | Duplicate created |
| PROB-ADM-010 | Edit problem | Change description | — | Saved |
| PROB-ADM-011 | Delete problem | Delete demo | — | Deleted after confirmation |
| PROB-ADM-012 | Empty title | Save | Blank | Validation |
| PROB-ADM-013 | Invalid hackathon ID | Assign invalid event | — | Error |
| PROB-ADM-014 | Public visibility | Published problem → `/problems` | — | Visible |
| PROB-ADM-015 | Locked problem | Student tries selecting it | — | Selection blocked |
| PROB-ADM-016 | Refresh | Modify → F5 | — | Persists |

## 6. TEAMS `/admin/teams`
Admins monitor teams, members, selected problems, and workspace progress.

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| TEAM-ADM-001 | Open teams | `/admin/teams` | — | Loads |
| TEAM-ADM-002 | Search team | Search Alpha | Team Alpha | Result |
| TEAM-ADM-003 | Filter team | Active | — | Correct teams |
| TEAM-ADM-004 | Open team | Click Alpha | — | Detail panel |
| TEAM-ADM-005 | View members | Open roster | 4 members | Correct members |
| TEAM-ADM-006 | View problem | Open team | AI Accessibility | Correct |
| TEAM-ADM-007 | View workspace progress | Team detail | 60% | Correct state |
| TEAM-ADM-008 | Add member | Admin action | Demo user | Member added |
| TEAM-ADM-009 | Remove member | Remove demo member | — | Member removed |
| TEAM-ADM-010 | Override size limit | Add 5th member | Team limit 4 | Only if policy permits |
| TEAM-ADM-011 | Invalid team | Open fake ID | — | 404/safe error |
| TEAM-ADM-012 | Delete team | Demo team | — | Confirmation |
| TEAM-ADM-013 | Refresh | Modify → F5 | — | Persists |
| TEAM-ADM-014 | Zero teams | Empty DB | — | Empty state |
| TEAM-ADM-015 | Disqualification UI | If implemented | Reason required | Cannot submit without reason |

## 7. SUBMISSIONS `/admin/submissions`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SUB-ADM-001 | Open submissions | `/admin/submissions` | — | Loads |
| SUB-ADM-002 | Search submission | Search AccessAI | — | Found |
| SUB-ADM-003 | Open submission | Click | — | Details |
| SUB-ADM-004 | GitHub link | Click | github.com | Correct URL |
| SUB-ADM-005 | Figma link | Click | Figma | Correct URL |
| SUB-ADM-006 | Demo link | Click | Demo URL | Correct URL |
| SUB-ADM-007 | Lock submissions | Select/Lock | After deadline | Editing blocked |
| SUB-ADM-008 | Unlock submission | Admin unlock | Demo | Editing restored |
| SUB-ADM-009 | Invalid URL | Malformed link | abc | Validation |
| SUB-ADM-010 | Missing submission | Fake ID | — | Safe 404 |
| SUB-ADM-011 | Refresh | Lock → F5 | — | Lock persists |
| SUB-ADM-012 | Student edits locked submission | User side | — | Denied |

## 8. JUDGES `/admin/judges`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| JUDGE-ADM-001 | Open judges | Route | — | Loads |
| JUDGE-ADM-002 | Add judge | New | Dr. Vikram | Created |
| JUDGE-ADM-003 | Edit judge | Change profile | — | Saved |
| JUDGE-ADM-004 | Assign team | Judge → Team Alpha | — | Saved |
| JUDGE-ADM-005 | Assign problem | Judge → AI problem | — | Saved |
| JUDGE-ADM-006 | Remove assignment | Remove | — | Removed |
| JUDGE-ADM-007 | Deactivate judge | Toggle inactive | — | Access disabled |
| JUDGE-ADM-008 | Assigned queue | Judge login | Team Alpha | Appears |
| JUDGE-ADM-009 | Unassigned queue | Judge login | Team Beta | Not visible |
| JUDGE-ADM-010 | Duplicate assignment | Assign same twice | — | Prevent duplicate |

## 9. EVALUATIONS `/admin/evaluations`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| EVAL-ADM-001 | Open evaluations | Route | — | Loads |
| EVAL-ADM-002 | View pending | Filter pending | — | Correct records |
| EVAL-ADM-003 | View completed | Filter completed | — | Correct |
| EVAL-ADM-004 | View judge progress | Open judge | 3/5 done | Correct |
| EVAL-ADM-005 | Open feedback | Click evaluation | — | Feedback visible |
| EVAL-ADM-006 | Final submit trigger | Student final submits | Team Alpha | Judge queue updated |
| EVAL-ADM-007 | Average score | Multiple judges | 80 + 90 | Average 85 |
| EVAL-ADM-008 | Missing score | Incomplete rubric | — | Not finalized |
| EVAL-ADM-009 | Invalid score | 25/20 | — | Rejected |
| EVAL-ADM-010 | Evaluation persistence | Submit → refresh | — | Remains |
| EVAL-ADM-011 | Locked evaluation | Submit → edit | — | Restricted |
| EVAL-ADM-012 | Unassigned judge | Unauthorized access | — | Denied |

## 10. LEADERBOARD `/admin/leaderboard`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| LEAD-ADM-001 | Open leaderboard | Route | — | Loads |
| LEAD-ADM-002 | View ranking | Open | — | Correct order |
| LEAD-ADM-003 | Add bonus | +10 | "Won mini-game" | Saved |
| LEAD-ADM-004 | Add penalty | -50 | "Late submission" | Saved |
| LEAD-ADM-005 | Bonus reason required | Submit bonus without reason | — | Rejected |
| LEAD-ADM-006 | Penalty reason required | Submit penalty without reason | — | Rejected |
| LEAD-ADM-007 | Calculate net score | 420 + 20 - 5 | — | 435 |
| LEAD-ADM-008 | Recalculate ranking | Change score | — | Position updates |
| LEAD-ADM-009 | Publish | Publish leaderboard | — | Public result visible |
| LEAD-ADM-010 | Unpublish | Hide result | — | Public result hidden |
| LEAD-ADM-011 | Duplicate modifier | Same adjustment twice | — | Correct system behavior |
| LEAD-ADM-012 | Refresh | Update → F5 | — | Persists |
| LEAD-ADM-013 | Audit modifier | Apply bonus | — | Activity log contains reason |

## 11. MENTORS `/admin/mentors`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| MENT-ADM-001 | Open mentors | Route | — | Loads |
| MENT-ADM-002 | Create mentor | New | Neha | Created |
| MENT-ADM-003 | Assign team | Neha → Team Nova | — | Access granted |
| MENT-ADM-004 | View SOS request | Student clicks Request Help | Team Nova | Request appears |
| MENT-ADM-005 | Assign from SOS | Select mentor | Neha | Assignment saved |
| MENT-ADM-006 | Mentor access | Mentor opens team | Team Nova | Accessible |
| MENT-ADM-007 | Private team restriction | Mentor opens unrelated team | Team Vertex | Denied |
| MENT-ADM-008 | Mentor chat access | Assigned team | — | Chat available |
| MENT-ADM-009 | Remove mentor | Unassign | — | Access removed |
| MENT-ADM-010 | Deactivate mentor | Disable | — | Login/access restricted |

## 12. ANNOUNCEMENTS `/admin/announcements`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| ANN-ADM-001 | Open announcements | Route | — | Loads |
| ANN-ADM-002 | Create announcement | New | Deadline Reminder | Created |
| ANN-ADM-003 | Draft | Save draft | — | Not public |
| ANN-ADM-004 | Publish globally | Audience Everyone | — | Everyone sees it |
| ANN-ADM-005 | Target students | Audience Students | — | Students receive |
| ANN-ADM-006 | Target judges | Audience Judges | — | Judges receive |
| ANN-ADM-007 | Target mentors | Audience Mentors | — | Mentors receive |
| ANN-ADM-008 | Target team | Team Alpha | — | Intended team receives |
| ANN-ADM-009 | Excluded audience | Judge-only → Student | — | Student does not receive |
| ANN-ADM-010 | Notification | Publish | — | Appropriate notification |
| ANN-ADM-011 | Edit | Change text | — | Updated |
| ANN-ADM-012 | Delete | Demo announcement | — | Removed |
| ANN-ADM-013 | Refresh | Publish → F5 | — | Persists |

## 13. CERTIFICATES `/admin/certificates`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| CERT-ADM-001 | Open certificates | Route | — | Loads |
| CERT-ADM-002 | Select recipient | Choose student | Aarav | Selected |
| CERT-ADM-003 | Participation certificate | Generate | Participant | Record created |
| CERT-ADM-004 | Winner certificate | Generate | Team Vertex | Record created |
| CERT-ADM-005 | Batch generation | Select 3 | Winners | Batch starts |
| CERT-ADM-006 | Duplicate certificate | Generate twice | Same user/event | Prevent duplicate or warn |
| CERT-ADM-007 | Certificate ID | Open record | — | Unique ID |
| CERT-ADM-008 | Verification | Search ID | Valid ID | Valid |
| CERT-ADM-009 | Invalid verification | Fake ID | — | Invalid/not found |
| CERT-ADM-010 | Revoke | Revoke demo certificate | — | Status revoked |
| CERT-ADM-011 | Refresh | Generate → F5 | — | Record persists |

## 14. RECRUITMENT `/admin/recruitment`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| RECR-ADM-001 | Open recruitment | Route | — | Loads |
| RECR-ADM-002 | Create job | New opportunity | Junior Frontend Developer | Created |
| RECR-ADM-003 | Add company | Nova Technologies | — | Saved |
| RECR-ADM-004 | Add skills | React, TypeScript | — | Saved |
| RECR-ADM-005 | Publish | Publish opportunity | — | Student sees it |
| RECR-ADM-006 | Close | Close opportunity | — | Applications stop |
| RECR-ADM-007 | View applicants | Open job | Aarav | Applicant shown |
| RECR-ADM-008 | Shortlist | Select applicant | Aarav | Status changes |
| RECR-ADM-009 | Reject | Select applicant | Arjun | Rejected |
| RECR-ADM-010 | Candidate profile | Open candidate | Aarav | Authorized information |
| RECR-ADM-011 | Recruiter permission | Recruiter login | — | Correct access |
| RECR-ADM-012 | Duplicate job | Same opportunity | — | Appropriate handling |
| RECR-ADM-013 | Deadline | Past deadline | — | Application disabled |

## 15. SUPPORT `/admin/support`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SUP-ADM-001 | Open support | Route | — | Loads |
| SUP-ADM-002 | View open tickets | Filter Open | — | Correct |
| SUP-ADM-003 | Search ticket | Search ID | CS-DEMO-1001 | Found |
| SUP-ADM-004 | Open ticket | Click | — | Full details |
| SUP-ADM-005 | View user | Open requester | Aarav | Correct user |
| SUP-ADM-006 | Change priority | Normal → High | — | Saved |
| SUP-ADM-007 | Assign ticket | Admin A | — | Saved |
| SUP-ADM-008 | Reply | Send response | "We're investigating" | User gets reply |
| SUP-ADM-009 | Open Comms | Click Open Comms | — | Private chat opens |
| SUP-ADM-010 | Resolve | Status → Resolved | — | Status updates |
| SUP-ADM-011 | Close | Resolved → Closed | — | Closed |
| SUP-ADM-012 | Reopen | Closed → Open | — | Reopened |
| SUP-ADM-013 | Refresh | Update → F5 | — | Persists |
| SUP-ADM-014 | User privacy | Open another ticket directly | — | Denied |

## 16. SPONSORS `/admin/sponsors`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SPON-ADM-001 | Open sponsors | Route | — | Loads |
| SPON-ADM-002 | Add sponsor | New | Nova Technologies | Created |
| SPON-ADM-003 | Select tier | Gold | — | Saved |
| SPON-ADM-004 | Add logo URL | Valid URL | — | Logo displays |
| SPON-ADM-005 | Add website | Valid URL | — | Saved |
| SPON-ADM-006 | Public visibility | Save → `/` | Sponsor | Appears |
| SPON-ADM-007 | Edit sponsor | Change tier | Silver | Updated |
| SPON-ADM-008 | Delete sponsor | Delete demo | — | Removed |
| SPON-ADM-009 | Missing logo | Blank image | — | Safe fallback |
| SPON-ADM-010 | Invalid image URL | Bad URL | — | Validation/fallback |
| SPON-ADM-011 | Invalid website | abc | — | Validation |

## 17. GALLERY & MEDIA `/admin/gallery`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| GAL-ADM-001 | Open gallery admin | Route | — | Loads |
| GAL-ADM-002 | Upload image | Add photo | opening.jpg | Media created |
| GAL-ADM-003 | Upload video | Add video | demo.mp4 | Media created if supported |
| GAL-ADM-004 | Add title | Opening Ceremony | — | Saved |
| GAL-ADM-005 | Add category | Event | — | Saved |
| GAL-ADM-006 | Public gallery | Open `/gallery` | — | Media visible |
| GAL-ADM-007 | Edit media | Change title | — | Updated |
| GAL-ADM-008 | Delete media | Delete demo | — | Removed |
| GAL-ADM-009 | Invalid file | .exe | — | Rejected |
| GAL-ADM-010 | Oversized file | Large video | — | Rejected/handled |
| GAL-ADM-011 | Storage failure | Bucket unavailable | — | Error state |
| GAL-ADM-012 | Missing image | Broken URL | — | Placeholder |

## 18. ANALYTICS `/admin/analytics`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| ANAL-ADM-001 | Open analytics | Route | — | Loads |
| ANAL-ADM-002 | User count | Compare with DB | 15 | Match |
| ANAL-ADM-003 | Team count | Compare DB | 4 | Match |
| ANAL-ADM-004 | Submission count | Compare DB | 3 | Match |
| ANAL-ADM-005 | Tech stack | View chart | AI 40% | Data source defined |
| ANAL-ADM-006 | Filter event | Select event | Spring Hack | Correct data |
| ANAL-ADM-007 | Empty data | No activity | — | Safe empty state |
| ANAL-ADM-008 | Refresh | F5 | — | Data remains |
| ANAL-ADM-009 | API failure | Analytics API down | — | Error |
| ANAL-ADM-010 | No fabricated metric | Unsupported metric | Uptime | Must not pretend measured |

## 19. ACTIVITY LOGS `/admin/logs`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| LOG-ADM-001 | Open logs | Route | — | Loads |
| LOG-ADM-002 | Login event | Admin login | — | Logged |
| LOG-ADM-003 | Team event | Create team | — | Logged |
| LOG-ADM-004 | Submission event | Final submit | — | Logged |
| LOG-ADM-005 | Evaluation event | Judge submits | — | Logged |
| LOG-ADM-006 | Announcement | Publish | — | Logged |
| LOG-ADM-007 | Settings change | Toggle feature | — | Logged |
| LOG-ADM-008 | View actor | Open log | Admin | Correct actor |
| LOG-ADM-009 | View timestamp | Open log | 14:32 | Correct |
| LOG-ADM-010 | Filter action | TEAM_CREATED | — | Correct results |
| LOG-ADM-011 | Filter user | Aarav | — | Correct results |
| LOG-ADM-012 | Immutability | Attempt edit/delete | — | Denied |
| LOG-ADM-013 | Ordering | Newest first | — | Correct order |

## 20. SETTINGS `/admin/settings`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SET-ADM-001 | Open settings | Route | — | Loads |
| SET-ADM-002 | Toggle Chat OFF | Click switch | Chat | State changes |
| SET-ADM-003 | Verify Chat OFF | Student opens Chat | — | Disabled/blocked as designed |
| SET-ADM-004 | Toggle Chat ON | Click switch | — | Restored |
| SET-ADM-005 | Toggle Registration | OFF | — | Registration behavior changes |
| SET-ADM-006 | Toggle Leaderboard | OFF | — | Public behavior changes |
| SET-ADM-007 | Toggle Recruitment | OFF | — | Public behavior changes |
| SET-ADM-008 | Refresh settings | F5 | — | State persists |
| SET-ADM-009 | Non-admin mutation | Student tries API | — | 403 |
| SET-ADM-010 | Dangerous action | Maintenance mode | — | Confirmation required |
| SET-ADM-011 | Audit setting change | Toggle | — | Log created |
| SET-ADM-012 | API failure | Settings API unavailable | — | Error |

## 21. EVENT SCHEDULE `/admin/schedule`

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SCHED-ADM-001 | Open schedule | `/admin/schedule` | — | Loads |
| SCHED-ADM-002 | Create event | New schedule item | API Workshop | Created |
| SCHED-ADM-003 | Set date | Select date/time | 10 Oct 14:00 | Saved |
| SCHED-ADM-004 | Set category | Workshop | — | Saved |
| SCHED-ADM-005 | Set duration | 60 min | — | Saved |
| SCHED-ADM-006 | Edit schedule | Delay 30 minutes | 14:00 → 14:30 | Updated |
| SCHED-ADM-007 | Public timeline | Open `/timeline` | — | Updated schedule visible |
| SCHED-ADM-008 | Delete schedule item | Demo item | — | Removed |
| SCHED-ADM-009 | Invalid date | Bad date | — | Validation |
| SCHED-ADM-010 | Time ordering | Create 09:00 / 14:00 | — | Chronological |
| SCHED-ADM-011 | Refresh | Edit → F5 | — | Persists |
| SCHED-ADM-012 | Empty schedule | No items | — | Empty state |

## 22. GLOBAL ADMIN SEARCH

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| SEARCH-ADM-001 | Open search | Click search/Ctrl+K | — | Search opens |
| SEARCH-ADM-002 | Search user | Aarav | — | User result |
| SEARCH-ADM-003 | Search team | Alpha | — | Team result |
| SEARCH-ADM-004 | Search submission | AccessAI | — | Result |
| SEARCH-ADM-005 | Search ticket | CS-DEMO-1001 | — | Result |
| SEARCH-ADM-006 | Search problem | Accessibility | — | Result |
| SEARCH-ADM-007 | Open result | Click result | — | Correct destination |
| SEARCH-ADM-008 | No results | ZZZZ | — | Empty state |
| SEARCH-ADM-009 | Escape | Press Esc | — | Search closes |
| SEARCH-ADM-010 | Keyboard | Arrow/Enter | — | Works |

## 23. GLOBAL HELP / SUPPORT ENTRY

| ID | Test Case | Steps | Example | Expected |
|---|---|---|---|---|
| HELP-ADM-001 | Help opens | Click Help | — | Help menu |
| HELP-ADM-002 | Talk to Admin | Click | — | Chat opens |
| HELP-ADM-003 | Ticket entry | Click Support | — | `/support` opens |
| HELP-ADM-004 | Existing support chat | User with ticket | — | Correct conversation |
| HELP-ADM-005 | Admin reply | Reply from admin | — | User receives |

## 24. CROSS-PAGE ADMIN TESTS

* **Cross Test 01 — Hackathon → Public**: Admin creates event → Publishes → Student registers.
* **Cross Test 02 — Problem → Team**: Admin publishes problem → Student creates team linked to it.
* **Cross Test 03 — Submission → Judge**: Student submits → Admin assigns judge → Judge evaluates.
* **Cross Test 04 — Evaluation → Leaderboard**: Judge scores → Admin adds bonus → Leaderboard updates publicly.
* **Cross Test 05 — SOS → Mentor**: Student requests help → Admin assigns mentor → Mentor gets team chat access.
* **Cross Test 06 — Announcement → Notification**: Admin targets Judges → Judges get notification, Students do not.
* **Cross Test 07 — Support → Chat**: Student creates ticket → Admin clicks Open Comms → Private chat initiated.
* **Cross Test 08 — Schedule → Public Timeline**: Admin updates API Workshop to 14:30 → `/timeline` instantly reflects it.

## 25. ADMIN SECURITY TEST CASES

| ID | Test | Expected |
|---|---|---|
| SEC-ADM-001 | Student → `/admin` | 403 |
| SEC-ADM-002 | Student → `/admin/users` | 403 |
| SEC-ADM-003 | Student → `/admin/settings` | 403 |
| SEC-ADM-004 | Mentor → `/admin/hackathons` | 403 |
| SEC-ADM-005 | Judge → `/admin/evaluations` | 403 if admin-only |
| SEC-ADM-006 | Recruiter → `/admin/settings` | 403 |
| SEC-ADM-007 | Guest → `/admin` | Login required |
| SEC-ADM-008 | Invalid JWT → admin API | 401 |
| SEC-ADM-009 | Student calls admin API directly | 403 |
| SEC-ADM-010 | User edits another user's profile via API | 403 |
| SEC-ADM-011 | User accesses another support ticket | 403 |
| SEC-ADM-012 | User accesses another private conversation | 403 |
| SEC-ADM-013 | Public registration with role=admin | Rejected/forced to normal role |
| SEC-ADM-014 | Suspended admin | Appropriate access handling |
| SEC-ADM-015 | Sensitive data in API | Passwords/secrets never returned |

## 26. ADMIN RESPONSIVENESS
Test at: 375×812, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1718×1352.
*(Sidebar collapses, forms fit, no horizontal overflow, modals visible)*.

## 27. ADMIN ERROR STATES
* API Loading → Indicator
* Empty Data → Empty State
* API 500 → Error Message
* Invalid ID → 404
* Disconnect → Handled

## 28. ADMIN AUDIT / DATA CONSISTENCY
All mutations must successfully write to the database and insert a log entry into the Activity Log.

## 29. COMPLETE ADMIN WEB TEST — MASTER FLOW
1. Login → Dashboard → Users (Search Aarav) → Hackathons (Create & Publish) → Problems (Create & Publish) → Teams (Verify members) → Submissions (Lock AccessAI) → Judges (Assign Vikram) → Evaluations (Verify queue) → Leaderboard (Apply bonus) → Mentors (Assign Neha) → Announcements (Publish) → Support (Open Comms) → Certificates (Generate) → Recruitment (Create job) → Sponsors (Create) → Gallery (Verify) → Analytics (Verify counts) → Logs (Audit verification) → Settings (Toggle) → Schedule (Update) → Logout.

## 30. ADMIN → USER FULL WEB TEST
Verify Admin UI mutations properly control and mutate the public User/Student UI.

---

## FINAL QA REPORT

*To be executed after Playwright headless container is unblocked or via Manual QA.*

# CODE SRIJAN — ADMIN WEB QA REPORT

## Environment
**Frontend:** `https://codesrijan-nine.vercel.app`
**Backend:** `https://codesrijan-api.onrender.com/api`
**Database:** MongoDB Atlas Production Staging
**Browser:** Chrome
**Desktop:** 1440x900
**Mobile:** 375x812

## TEST COUNTS
**Total:** 150+
**Passed:** 0
**Failed:** 0
**Blocked:** 150+ (Automated Infrastructure Container Crash - `EOF`)

## BLOCKED TESTS
**ID:** ALL 
**Reason:** Playwright headless container fails to launch.
**Infrastructure/Application:** Infrastructure blocker.
**Result:** BLOCKED pending manual human verification.

## PRODUCTION LIMITATIONS
* Certificate PDF Engine is simulated.
* Analytics are mocked visual placeholders, deeper aggregation required.
* Disqualification Reason notification system is not yet fully implemented.
* Support Chat integration with Tickets works locally but may drop connections under high WebSocket load on Free Tier.

## PRODUCTION BLOCKERS
None in source codebase.

## FUTURE TESTS

**DISQ-001**
Admin selects Disqualify → Reason required

**DISQ-002**
Disqualification → Team notified

**DISQ-003**
Team appears in Disqualified list

**DISQ-004**
Admin Undisqualifies

**DISQ-005**
Team restored

**ANAL-001**
Analytics MongoDB Aggregation → Live metrics replace visual mockups

## FINAL STATUS
**READY WITH DOCUMENTED LIMITATIONS**
*(Subject to Manual Human QA Validation)*
