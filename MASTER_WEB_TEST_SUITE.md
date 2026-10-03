# CODE SRIJAN — MASTER WEB TEST CASES

## 1. PUBLIC WEBSITE
### HOME — /
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| WEB-HOME-001 | Home loads | Open / | Home loads without crash/white screen | P0 | |
| WEB-HOME-002 | Active hackathon displayed | Open / with active hackathon | Correct live hackathon appears | P0 | |
| WEB-HOME-003 | Hackathon description | Compare page with DB | Correct description shown | P1 | |
| WEB-HOME-004 | Registration status | Open home | Correct registration state shown | P1 | |
| WEB-HOME-005 | Registration deadline | Compare with DB | Correct deadline shown | P0 | |
| WEB-HOME-006 | Start date | Compare with DB | Correct date shown | P1 | |
| WEB-HOME-007 | Submission deadline | Compare with DB | Correct deadline shown | P0 | |
| WEB-HOME-008 | Countdown | Open page before event | Countdown calculated correctly | P1 | |
| WEB-HOME-009 | Prize information | Open home | Correct prize data displayed | P1 | |
| WEB-HOME-010 | Participant count | Compare DB count | Correct count shown | P1 | |
| WEB-HOME-011 | Team count | Compare DB count | Correct count shown | P1 | |
| WEB-HOME-012 | Project count | Compare DB count | Correct count shown | P1 | |
| WEB-HOME-013 | Sponsors | Open home | Published sponsors displayed | P1 | |
| WEB-HOME-014 | Timeline preview | Open home | Live timeline displayed | P1 | |
| WEB-HOME-015 | Announcements | Open home | Correct announcements displayed | P1 | |
| WEB-HOME-016 | Register Now | Click Register Now | Correct registration/login page opens | P0 | |
| WEB-HOME-017 | Problems CTA | Click Explore Problems | /problems opens | P1 | |
| WEB-HOME-018 | Timeline CTA | Click View Timeline | /timeline opens | P1 | |
| WEB-HOME-019 | Leaderboard CTA | Click Leaderboard | /leaderboard opens | P1 | |
| WEB-HOME-020 | Teammates CTA | Click Find Teammates | /recruitment opens | P1 | |
| WEB-HOME-021 | No active hackathon | Remove active hackathon | Proper empty state displayed; no fake data | P0 | |
| WEB-HOME-022 | API failure | Simulate backend failure | Error state + retry shown | P0 | |

## 2. ABOUT / RULES / FAQ / CONTACT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| WEB-INFO-001 | About loads | /about | Page loads | P1 | |
| WEB-INFO-002 | About content | Compare DB/admin data | Correct information | P1 | |
| WEB-INFO-003 | Rules loads | /rules | Page loads | P1 | |
| WEB-INFO-004 | Eligibility rules | Open rules | Correct rules shown | P1 | |
| WEB-INFO-005 | Team rules | Open rules | Correct team rules shown | P1 | |
| WEB-INFO-006 | Submission rules | Open rules | Correct submission rules shown | P1 | |
| WEB-INFO-007 | Judging rules | Open rules | Correct judging rules shown | P1 | |
| WEB-INFO-008 | Code of conduct | Open rules | Correct content shown | P1 | |
| WEB-INFO-009 | FAQ loads | /faq | FAQs load from DB | P1 | |
| WEB-INFO-010 | FAQ search | Search known FAQ | Matching FAQ returned | P1 | |
| WEB-INFO-011 | FAQ category | Select category | Correct FAQs filtered | P2 | |
| WEB-INFO-012 | FAQ accordion | Expand/collapse | Works correctly | P2 | |
| WEB-INFO-013 | Contact loads | /contact | Current organizer info shown | P1 | |

## 3. PROBLEMS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| PROB-001 | Problems page | Open /problems | Page loads | P0 | |
| PROB-002 | Live problems | Compare with DB | Only published live records shown | P0 | |
| PROB-003 | Search | Search problem title | Matching results | P1 | |
| PROB-004 | Domain filter | Select domain | Correct filtering | P1 | |
| PROB-005 | Difficulty filter | Select Medium | Medium problems only | P1 | |
| PROB-006 | Technology filter | Select technology | Correct filtering | P1 | |
| PROB-007 | Empty state | No published problems | Correct empty state | P1 | |
| PROB-008 | Bookmark | Bookmark problem | Bookmark saved | P1 | |
| PROB-009 | Remove bookmark | Unbookmark | Bookmark removed | P2 | |
| PROB-010 | Problem details | Open problem | /problems/:id loads | P0 | |
| PROB-011 | Problem title | Compare DB | Correct title | P1 | |
| PROB-012 | Problem ID | Compare DB | Correct ID | P1 | |
| PROB-013 | Background | Open details | Correct background | P1 | |
| PROB-014 | Requirements | Open details | Correct requirements | P1 | |
| PROB-015 | Constraints | Open details | Correct constraints | P1 | |
| PROB-016 | Expected outcome | Open details | Correct information | P1 | |
| PROB-017 | Resources | Open resources | Correct resources | P2 | |
| PROB-018 | Reference links | Click link | Correct destination | P2 | |
| PROB-019 | PDF | Open PDF | Correct document opens/downloads | P2 | |
| PROB-020 | Select for team | Authorized student selects | Problem selection saved | P0 | |
| PROB-021 | Unauthorized selection | User without team selects | Action rejected | P0 | |
| PROB-022 | Wrong hackathon problem | Access unrelated problem | Backend rejects unauthorized access | P0 | |

## 4. TIMELINE
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| TIME-001 | Timeline loads | Open /timeline | Page loads | P1 | |
| TIME-002 | Live timeline | Compare DB | Actual events shown | P0 | |
| TIME-003 | Event title | Open event | Correct title | P1 | |
| TIME-004 | Event time | Compare DB | Correct time | P0 | |
| TIME-005 | Event date | Compare DB | Correct date | P1 | |
| TIME-006 | Published event | Admin publishes event | User can see it | P1 | |
| TIME-007 | Unpublished event | Admin unpublishes | User cannot see it | P1 | |
| TIME-008 | Updated event | Admin changes time | User sees updated time | P0 | |

## 5. LEADERBOARD
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| LB-001 | Leaderboard page | Open page | Loads | P1 | |
| LB-002 | Published results | Admin publishes | Results displayed | P0 | |
| LB-003 | Rank | Check known team | Correct rank | P0 | |
| LB-004 | Team | Check row | Correct team | P1 | |
| LB-005 | Project | Check row | Correct project | P1 | |
| LB-006 | College | Check row | Correct college | P1 | |
| LB-007 | Score | Compare evaluation | Correct score | P0 | |
| LB-008 | Status | Check result status | Correct status | P1 | |
| LB-009 | Unpublished leaderboard | Results unpublished | Proper unavailable state | P1 | |
| LB-010 | Bonus/penalty | Admin applies adjustment | Final displayed score reflects adjustment | P0 | |

## 6. RECRUITMENT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| REC-001 | Recruitment loads | Open page | Loads | P1 | |
| REC-002 | Visible profiles | Open page | Only visible profiles shown | P0 | |
| REC-003 | Skill filter | Filter skill | Correct profiles | P1 | |
| REC-004 | Technology filter | Filter tech | Correct profiles | P1 | |
| REC-005 | Role filter | Filter role | Correct results | P1 | |
| REC-006 | College filter | Filter college | Correct results | P2 | |
| REC-007 | Experience filter | Filter experience | Correct results | P2 | |
| REC-008 | Domain filter | Filter domain | Correct results | P2 | |
| REC-009 | Availability filter | Filter availability | Correct results | P2 | |
| REC-010 | Open profile | Click profile | Correct /users/:id page | P1 | |
| REC-011 | Save profile | Save | Bookmark persists | P1 | |
| REC-012 | Chat candidate | Click Chat | Conversation opens | P0 | |
| REC-013 | Invite teammate | Click Invite | Invitation sent | P0 | |
| REC-014 | Hidden profile | Mark profile hidden | Disappears from public | P0 | |

## 7. PUBLIC USER PROFILE
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| PROF-001 | Profile loads | Open public profile | Loads | P1 | |
| PROF-002 | Name | Compare profile | Correct | P1 | |
| PROF-003 | Profile image | Open | Correct image | P2 | |
| PROF-004 | College | Open | Correct | P1 | |
| PROF-005 | Branch/year | Open | Correct | P1 | |
| PROF-006 | Bio | Open | Correct | P2 | |
| PROF-007 | Skills | Open | Correct skills | P1 | |
| PROF-008 | Tech stack | Open | Correct tech stack | P1 | |
| PROF-009 | Projects | Open | Public projects displayed | P1 | |
| PROF-010 | GitHub | Click | Correct public URL | P2 | |
| PROF-011 | LinkedIn | Click | Correct public URL | P2 | |
| PROF-012 | Portfolio | Click | Correct public URL | P2 | |
| PROF-013 | Private data | Inspect profile | Private account data not exposed | P0 | |

## 8. SPONSORS / GALLERY
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| MEDIA-001 | Sponsors page | /sponsors | Loads | P1 | |
| MEDIA-002 | Published sponsors | Open | Correct published sponsors | P1 | |
| MEDIA-003 | Sponsor website | Click | Correct destination | P2 | |
| MEDIA-004 | Sponsor ordering | Compare admin ordering | Correct order | P2 | |
| MEDIA-005 | Gallery | /gallery | Loads | P1 | |
| MEDIA-006 | Published media | Open | Real uploaded media shown | P1 | |
| MEDIA-007 | Album | Open album | Correct media | P2 | |
| MEDIA-008 | Media detail | Open media | Correct content | P2 | |
| MEDIA-009 | Broken media | Invalid media URL | Graceful error state | P2 | |

## 9. REGISTRATION / AUTHENTICATION
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| AUTH-001 | Register page | Open | Loads | P0 | |
| AUTH-002 | Valid registration | Enter all required fields | Account created | P0 | |
| AUTH-003 | Full name validation | Empty name | Validation displayed | P1 | |
| AUTH-004 | Email validation | Invalid email | Validation displayed | P1 | |
| AUTH-005 | Password validation | Weak password | Rejected according to rules | P1 | |
| AUTH-006 | Confirm password | Different passwords | Registration blocked | P1 | |
| AUTH-007 | Terms required | Do not accept terms | Registration blocked | P1 | |
| AUTH-008 | Duplicate email | Existing email | Registration rejected | P0 | |
| AUTH-009 | Student role | Register publicly | Account created as student | P0 | |
| AUTH-010 | Optional GitHub | Enter GitHub | Saved correctly | P2 | |
| AUTH-011 | Optional LinkedIn | Enter LinkedIn | Saved correctly | P2 | |
| AUTH-012 | Optional portfolio | Enter portfolio | Saved correctly | P2 | |

## 10. EMAIL VERIFICATION
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| OTP-001 | Verification page | Complete registration | OTP page opens | P0 | |
| OTP-002 | Valid OTP | Enter correct code | Account verified | P0 | |
| OTP-003 | Invalid OTP | Enter wrong code | Verification rejected | P0 | |
| OTP-004 | Expired OTP | Use expired code | Verification rejected | P1 | |
| OTP-005 | Resend code | Click resend | New code generated | P1 | |
| OTP-006 | Login after verify | Verify then login | Login successful | P0 | |
| OTP-007 | No OTP on normal login | Logout then login | Normal login does not require verification code again | P1 | |

## 11. LOGIN
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| LOGIN-001 | Login page | Open | Loads | P0 | |
| LOGIN-002 | Valid credentials | Enter valid credentials | Correct dashboard opens | P0 | |
| LOGIN-003 | Wrong password | Correct email + wrong password | Login rejected | P0 | |
| LOGIN-004 | Unknown email | Unknown email | Login rejected | P0 | |
| LOGIN-005 | Empty fields | Click login | Validation displayed | P1 | |
| LOGIN-006 | Password visibility | Toggle icon | Password shown/hidden | P2 | |
| LOGIN-007 | Loading state | Submit login | Loading state shown | P2 | |
| LOGIN-008 | Logout | Logout | Session destroyed | P0 | |
| LOGIN-009 | Browser back | Logout → Back | Protected page inaccessible | P0 | |
| LOGIN-010 | Refresh | Refresh authenticated page | Session remains valid | P1 | |
| LOGIN-011 | Expired session | Expire token | User redirected/logged out | P0 | |
| LOGIN-012 | Suspended user | Login suspended account | Login blocked | P0 | |

## 12. FORGOT / RESET PASSWORD
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| PASS-001 | Forgot password | Click Forgot Password | Page opens | P1 | |
| PASS-002 | Known email | Submit registered email | Reset flow starts | P1 | |
| PASS-003 | Unknown email | Submit unknown email | Safe response | P1 | |
| PASS-004 | Valid reset token | Open valid link | Reset form opens | P0 | |
| PASS-005 | Expired reset | Open expired link | Reset rejected | P0 | |
| PASS-006 | New password | Set valid password | Password updated | P0 | |
| PASS-007 | Old password | Login with old password | Rejected | P0 | |
| PASS-008 | New password login | Login using new password | Successful | P0 | |

## 13. STUDENT DASHBOARD
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| STD-DASH-001 | Dashboard loads | Login student | Dashboard opens | P0 | |
| STD-DASH-002 | User profile data | Open dashboard | Correct user data | P1 | |
| STD-DASH-003 | Current hackathon | Open dashboard | Correct event | P1 | |
| STD-DASH-004 | Team | Open | Correct team displayed | P1 | |
| STD-DASH-005 | Problem | Open | Selected problem displayed | P1 | |
| STD-DASH-006 | Submission status | Open | Correct status | P0 | |
| STD-DASH-007 | Notifications | Open | Correct unread count | P1 | |
| STD-DASH-008 | Empty team | No team | Proper empty state | P1 | |
| STD-DASH-009 | API failure | Break dashboard API | Error + retry | P0 | |

## 14. HACKATHON REGISTRATION
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| REG-001 | View registration | Open event | Register option shown when open | P0 | |
| REG-002 | Register | Click Register | Registration created | P0 | |
| REG-003 | Duplicate registration | Register twice | Duplicate prevented | P0 | |
| REG-004 | Closed registration | Admin closes registration | Registration blocked | P0 | |
| REG-005 | Before login | Guest clicks register | Login/register required | P1 | |
| REG-006 | Registration persistence | Register → refresh | Registration remains | P0 | |
| REG-007 | Registration count | Register new user | Counts update | P1 | |

## 15. TEAM MANAGEMENT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| TEAM-001 | Create team | Student creates team | Team created | P0 | |
| TEAM-002 | Team name validation | Empty/duplicate name | Validation/rejection | P1 | |
| TEAM-003 | Team member | Create team | Creator becomes member | P0 | |
| TEAM-004 | Invite member | Invite student | Invitation generated | P0 | |
| TEAM-005 | Notification | Invite student | Student gets notification | P0 | |
| TEAM-006 | Accept invitation | Student accepts | Membership updated | P0 | |
| TEAM-007 | Reject invitation | Student rejects | Membership unchanged | P1 | |
| TEAM-008 | Join request | Student requests join | Request created | P1 | |
| TEAM-009 | Approve request | Team accepts | Member added | P0 | |
| TEAM-010 | Remove member | Authorized leader/admin | Member removed | P1 | |
| TEAM-011 | Duplicate member | Add same member | Rejected | P1 | |
| TEAM-012 | Team capacity | Reach max members | Further addition blocked | P0 | |
| TEAM-013 | Authorized override | Admin override | Allowed | P1 | |
| TEAM-014 | Team persistence | Refresh page | Team remains | P0 | |
| TEAM-015 | Team access | Non-member opens private team page | Access denied | P0 | |

## 16. WORKSPACE / PROJECT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| WS-001 | Workspace loads | Team member opens workspace | Loads | P0 | |
| WS-002 | Project create | Create project | Project saved | P0 | |
| WS-003 | Project edit | Change project details | Changes persist | P1 | |
| WS-004 | Tasks | Create task | Task saved | P1 | |
| WS-005 | Task status | Change status | Status persists | P1 | |
| WS-006 | Files | Upload file | File recorded/available | P0 | |
| WS-007 | File delete | Delete own file | Removed | P1 | |
| WS-008 | Milestone | Create milestone | Saved | P1 | |
| WS-009 | Milestone status | Complete milestone | Updated | P1 | |
| WS-010 | Problem link | Project linked to problem | Correct problem shown | P1 | |
| WS-011 | Non-member access | Open workspace | Access denied | P0 | |
| WS-012 | Refresh | Refresh workspace | No data loss | P0 | |
| WS-013 | Empty workspace | New team | Proper empty states | P2 | |

## 17. SUBMISSION
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| SUB-001 | Submission page | Open | Loads | P0 | |
| SUB-002 | Draft submission | Save without final submit | Draft persists | P0 | |
| SUB-003 | GitHub URL | Enter URL | Saved | P1 | |
| SUB-004 | Figma URL | Enter URL | Saved | P1 | |
| SUB-005 | Demo URL | Enter URL | Saved | P1 | |
| SUB-006 | Required validation | Missing required data | Final submit blocked | P0 | |
| SUB-007 | Final submit | Complete form → Submit | Submission finalized | P0 | |
| SUB-008 | Submitted state | Refresh | Status remains Submitted | P0 | |
| SUB-009 | After deadline | Submit after deadline | Submission blocked/locked | P0 | |
| SUB-010 | Lock state | Admin locks submission | Student cannot modify | P0 | |
| SUB-011 | Unauthorized edit | Non-team member | Access denied | P0 | |
| SUB-012 | Admin review | Open admin submissions | Submission visible | P0 | |

## 18. CHAT SYSTEM
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| CHAT-001 | Chat page | Open /chat | Loads | P0 | |
| CHAT-002 | Direct chat | Student opens another user | Conversation opens | P0 | |
| CHAT-003 | Send message | Type + send | Message appears | P0 | |
| CHAT-004 | Persistence | Refresh | Message remains | P0 | |
| CHAT-005 | Receiver sees message | Login receiver | Message visible | P0 | |
| CHAT-006 | Team chat | Open team chat | Authorized members can chat | P0 | |
| CHAT-007 | Non-member | Open team chat | Access denied | P0 | |
| CHAT-008 | Mentor chat | Assigned team chats mentor | Message delivered | P0 | |
| CHAT-009 | Unassigned mentor | Unrelated team | Access denied | P0 | |
| CHAT-010 | Read state | Open unread message | Marked read | P1 | |
| CHAT-011 | Unread count | New message | Count increments | P1 | |
| CHAT-012 | Search users | Search name/email | Matching users | P1 | |
| CHAT-013 | Minimum search length | 1-char search | No unnecessary query | P2 | |
| CHAT-014 | Current-user exclusion | Search self | Self not offered | P2 | |
| CHAT-015 | Realtime delivery | Send from browser A | Browser B receives instantly | P0 | |
| CHAT-016 | Offline recipient | Send while receiver offline | Message persists | P1 | |
| CHAT-017 | Failed message | Simulate network issue | Failed state shown | P2 | |
| CHAT-018 | Reply | Reply to message | Correct thread/reply | P2 | |
| CHAT-019 | Reaction | Add reaction | Reaction persists | P2 | |
| CHAT-020 | Attachment | Send supported file | File delivered | P2 | |
| CHAT-021 | Chat search | Search message history | Correct matches | P2 | |
| CHAT-022 | Unauthorized convo | Manipulate ID | Access denied | P0 | |

## 19. SUPPORT TICKETS + ADMIN CHAT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| SUP-001 | Support page | Open /support | Loads | P0 | |
| SUP-002 | Create ticket | Enter valid issue | Ticket created | P0 | |
| SUP-003 | Missing subject | Submit | Validation | P1 | |
| SUP-004 | Missing description | Submit | Validation | P1 | |
| SUP-005 | Ticket ID | Create ticket | Unique ticket ID generated | P1 | |
| SUP-006 | Ticket status | Create | OPEN status shown | P0 | |
| SUP-007 | Student ticket list | Open support | Own tickets shown | P1 | |
| SUP-008 | Other user's ticket | Manipulate URL/ID | Access denied | P0 | |
| SUP-009 | Admin queue | Admin opens tickets | Ticket visible | P0 | |
| SUP-010 | Filter OPEN | Filter | Open tickets only | P1 | |
| SUP-011 | In Progress | Change status | Status persists | P1 | |
| SUP-012 | Resolved | Resolve ticket | Status becomes resolved | P0 | |
| SUP-013 | Closed | Close ticket | Ticket closed | P1 | |
| SUP-014 | Open Comms | Admin clicks Open Comms | Correct private convo opens | P0 | |
| SUP-015 | Admin reply | Send reply | Student receives reply | P0 | |
| SUP-016 | Student reply | Student replies | Admin sees message | P0 | |
| SUP-017 | Ticket history | Refresh | Full history persists | P0 | |
| SUP-018 | Resolve with convo | Resolve ticket | Chat history remains | P1 | |
| SUP-019 | Reopen | Reopen resolved ticket | Ticket becomes active | P1 | |
| SUP-020 | Global Help | Click Help | Help menu opens | P1 | |
| SUP-021 | Talk to Admin | Click Talk to Admin | Correct admin conversation | P0 | |
| SUP-022 | Existing ticket chat | Open existing ticket | Correct linked conversation | P0 | |

## 20. NOTIFICATIONS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| NOTIF-001 | Notification center | Open notifications | Loads | P1 | |
| NOTIF-002 | Team invite | Invite student | Notification generated | P0 | |
| NOTIF-003 | Announcement | Publish targeted message | Notification generated | P0 | |
| NOTIF-004 | Read notification | Open notification | Marked read | P1 | |
| NOTIF-005 | Unread count | New notification | Counter updates | P1 | |
| NOTIF-006 | Role targeting | Student-only announcement | Student receives | P0 | |
| NOTIF-007 | Wrong-role notification | Student-only announcement | Judge does not receive | P0 | |
| NOTIF-008 | Persistence | Refresh | Notification remains | P1 | |

## 21. SRIJANBOT / AI ASSISTANT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| AI-001 | Chatbot loads | Open assistant | Loads | P1 | |
| AI-002 | Submission question | Ask deadline | Correct official information | P0 | |
| AI-003 | Team question | Ask how to create team | Correct official guidance | P1 | |
| AI-004 | Team-specific question | Ask selected problem | Only authorized team info | P0 | |
| AI-005 | Certificate question | Ask certificate status | Correct user-specific result | P1 | |
| AI-006 | Recruitment question | Ask for frontend dev | Correct accessible info | P2 | |
| AI-007 | Unknown information | Ask unsupported question | Fallback response | P0 | |
| AI-008 | Unauthorized info | Ask for private info | Information not disclosed | P0 | |
| AI-009 | Role awareness | Ask as different roles | Role permissions respected | P0 | |
| AI-010 | API failure | Fail AI endpoint | Graceful error | P1 | |

## 22. JUDGE WEB TESTS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| JUDGE-001 | Judge login | Login judge | Judge area opens | P0 | |
| JUDGE-002 | Assigned projects | Open evaluations | Assigned projects visible | P0 | |
| JUDGE-003 | Unassigned project | Try unrelated project | Not accessible | P0 | |
| JUDGE-004 | Project details | Open project | Correct details | P1 | |
| JUDGE-005 | Demo | Click demo | Opens correct demo | P1 | |
| JUDGE-006 | Documentation | Open docs | Correct docs | P1 | |
| JUDGE-007 | GitHub | Click GitHub | Correct repo | P1 | |
| JUDGE-008 | Figma | Click Figma | Correct design file | P1 | |
| JUDGE-009 | Score criteria | Enter scores | Values accepted | P0 | |
| JUDGE-010 | Invalid score | Enter invalid value | Rejected | P0 | |
| JUDGE-011 | Feedback | Enter feedback | Saved | P1 | |
| JUDGE-012 | Submit evaluation | Submit | Evaluation stored | P0 | |
| JUDGE-013 | Duplicate submit | Submit again | Prevented/handled safely | P0 | |
| JUDGE-014 | Refresh | Refresh after submit | Saved evaluation remains | P0 | |

## 23. MENTOR WEB TESTS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| MENT-001 | Mentor login | Login | Mentor dashboard | P0 | |
| MENT-002 | Assigned teams | Open mentor center | Assigned teams shown | P0 | |
| MENT-003 | Unassigned team | Try unrelated team | Not accessible | P0 | |
| MENT-004 | Team progress | Open team | Progress displayed | P1 | |
| MENT-005 | Team chat | Open team chat | Works | P0 | |
| MENT-006 | Feedback | Submit feedback | Saved | P1 | |
| MENT-007 | Review project | Open project | Correct project | P1 | |
| MENT-008 | SOS request | Team sends SOS | Mentor/admin sees request | P0 | |
| MENT-009 | Schedule meeting | Create meeting | Meeting saved | P1 | |
| MENT-010 | Unauthorized access | Manipulate team ID | Access denied | P0 | |

## 24. ADMIN LOGIN + ACCESS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| AUTH-ADM-001 | Admin login | /login + admin creds | Admin dashboard opens | P0 | |
| AUTH-ADM-002 | Wrong password | Admin email + wrong pass | Rejected | P0 | |
| AUTH-ADM-003 | Student → admin | Student opens /admin | 401/403 or redirect | P0 | |
| AUTH-ADM-004 | Student → admin users | Student /admin/users | Access denied | P0 | |
| AUTH-ADM-005 | Logout | Admin logout | Session ends | P0 | |
| AUTH-ADM-006 | Back after logout | Logout → Back | Admin page inaccessible | P0 | |
| AUTH-ADM-007 | Refresh admin | Refresh | Session remains | P1 | |
| AUTH-ADM-008 | Expired admin token | Open with expired token | Access denied/login required | P0 | |

## 25. ADMIN DASHBOARD
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-DASH-001 | Dashboard loads | Admin → /admin | Loads | P0 | |
| ADM-DASH-002 | User metrics | Open dashboard | Correct live metrics | P0 | |
| ADM-DASH-003 | Registration metrics | Compare DB | Correct values | P1 | |
| ADM-DASH-004 | Teams metrics | Compare DB | Correct values | P1 | |
| ADM-DASH-005 | Submission metrics | Compare DB | Correct values | P1 | |
| ADM-DASH-006 | Support metrics | Compare tickets | Correct values | P1 | |
| ADM-DASH-007 | Recent activity | Open | Correct recent activity | P1 | |
| ADM-DASH-008 | API failure | Fail analytics endpoint | Error + retry | P0 | |

## 26. ADMIN USERS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-USR-001 | Page loads | Open | Loads | P0 | |
| ADM-USR-002 | User list | Open | Users displayed | P0 | |
| ADM-USR-003 | Search | Search email/name | Matching user | P1 | |
| ADM-USR-004 | Role filter | Filter student | Students only | P1 | |
| ADM-USR-005 | Active tab | Open active | Active users | P1 | |
| ADM-USR-006 | Suspended tab | Open suspended | Suspended users | P1 | |
| ADM-USR-007 | Suspend user | Change status | User suspended | P0 | |
| ADM-USR-008 | Suspended login | Suspended user logs in | Login blocked | P0 | |
| ADM-USR-009 | Reactivate | Change Active | User can login again | P0 | |
| ADM-USR-010 | Search nonexistent | Search random value | Correct empty state | P2 | |

## 27. ADMIN HACKATHONS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-HACK-001 | List loads | Open | Loads | P0 | |
| ADM-HACK-002 | Create | Create hackathon | Saved | P0 | |
| ADM-HACK-003 | Draft | Save as draft | Not publicly visible | P0 | |
| ADM-HACK-004 | Publish | Publish | Publicly visible | P0 | |
| ADM-HACK-005 | Edit | Change title | Change persists | P0 | |
| ADM-HACK-006 | Dates | Change dates | Correctly saved | P0 | |
| ADM-HACK-007 | Team limit | Set team limit | Correct rule enforced | P0 | |
| ADM-HACK-008 | Close registration | Close | Student cannot register | P0 | |
| ADM-HACK-009 | Public sync | Publish → / | Hackathon appears publicly | P0 | |
| ADM-HACK-010 | Invalid dates | Enter invalid dates | Validation displayed | P1 | |

## 28. ADMIN PROBLEMS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-PROB-001 | Load problems | Open | Loads | P0 | |
| ADM-PROB-002 | Create problem | Fill data | Saved | P0 | |
| ADM-PROB-003 | Publish | Publish | Appears publicly | P0 | |
| ADM-PROB-004 | Lock | Lock | Cannot be newly selected | P0 | |
| ADM-PROB-005 | Copy | Copy problem | Duplicate created | P1 | |
| ADM-PROB-006 | Assign event | Assign active hackathon | Correct association | P0 | |
| ADM-PROB-007 | Edit | Modify problem | Changes persist | P1 | |
| ADM-PROB-008 | Delete if supported | Delete | Correct removal/state | P2 | |

## 29. ADMIN TEAMS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-TEAM-001 | Load teams | Open | Loads | P0 | |
| ADM-TEAM-002 | Team list | Open | Correct teams | P0 | |
| ADM-TEAM-003 | Members | Open team | Correct members | P0 | |
| ADM-TEAM-004 | Problem | Open team | Correct problem | P1 | |
| ADM-TEAM-005 | Workspace | Open team | Correct progress | P1 | |
| ADM-TEAM-006 | Add member override | Admin adds allowed member | Saved | P1 | |
| ADM-TEAM-007 | Unauthorized edit | Student manipulates API | 403 | P0 | |
| ADM-TEAM-008 | Null team data | Team with incomplete data | No page crash | P0 | |

## 30. ADMIN SUBMISSIONS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-SUB-001 | Load submissions | Open | Loads | P0 | |
| ADM-SUB-002 | Submission list | Open | Correct submissions | P0 | |
| ADM-SUB-003 | Review GitHub | Open link | Correct link | P1 | |
| ADM-SUB-004 | Review Figma | Open link | Correct link | P1 | |
| ADM-SUB-005 | Review demo | Open link | Correct link | P1 | |
| ADM-SUB-006 | Lock after deadline | Deadline passes | Locked | P0 | |
| ADM-SUB-007 | Unlock authorized | Admin unlock | Works if supported | P1 | |
| ADM-SUB-008 | Submission persistence | Refresh | Same state | P0 | |

## 31. ADMIN JUDGES
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-JUDGE-001 | Page loads | Open | Loads | P0 | |
| ADM-JUDGE-002 | Create judge | Add judge | Saved | P0 | |
| ADM-JUDGE-003 | Assign project/team | Assign | Judge sees project | P0 | |
| ADM-JUDGE-004 | Remove assignment | Remove | Judge loses access | P0 | |
| ADM-JUDGE-005 | Assignment persistence | Refresh | Assignment remains | P1 | |
| ADM-JUDGE-006 | Wrong judge access | Judge opens unrelated project | Access denied | P0 | |

## 32. ADMIN EVALUATIONS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-EVAL-001 | Load evaluations | Open | Loads | P0 | |
| ADM-EVAL-002 | Judge score | View evaluation | Correct score | P0 | |
| ADM-EVAL-003 | Feedback | View feedback | Correct feedback | P1 | |
| ADM-EVAL-004 | Average | Compare criteria | Correct aggregate | P0 | |
| ADM-EVAL-005 | Submitted evaluation | Judge submits | Appears for admin | P0 | |
| ADM-EVAL-006 | Project lock | Final submission | Proper judging queue/state | P0 | |

## 33. ADMIN LEADERBOARD
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-LB-001 | Load | Open | Loads | P0 | |
| ADM-LB-002 | Calculate | Calculate results | Correct ranking data | P0 | |
| ADM-LB-003 | Bonus | Add bonus | Score updates | P0 | |
| ADM-LB-004 | Penalty | Add penalty | Score updates | P0 | |
| ADM-LB-005 | Reason required | Add adjustment without reason | Blocked | P0 | |
| ADM-LB-006 | Publish | Publish leaderboard | Public leaderboard updates | P0 | |

## 34. ADMIN MENTORS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-MENT-001 | Load | Open | Loads | P0 | |
| ADM-MENT-002 | Mentor list | Open | Correct mentors | P1 | |
| ADM-MENT-003 | SOS request | Student requests help | Request appears | P0 | |
| ADM-MENT-004 | Assign mentor | Assign | Team accessible to mentor | P0 | |
| ADM-MENT-005 | Reassign | Change mentor | New access correct | P1 | |
| ADM-MENT-006 | Remove assignment | Remove | Access removed | P0 | |

## 35. ADMIN ANNOUNCEMENTS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-ANN-001 | Load | Open | Loads | P0 | |
| ADM-ANN-002 | General announcement | Create | Saved | P1 | |
| ADM-ANN-003 | Deadline announcement | Create | Saved | P1 | |
| ADM-ANN-004 | Emergency announcement | Create | Saved | P1 | |
| ADM-ANN-005 | Results announcement | Create | Saved | P1 | |
| ADM-ANN-006 | Everyone target | Publish | All authorized roles receive | P0 | |
| ADM-ANN-007 | Students target | Publish | Students receive | P0 | |
| ADM-ANN-008 | Judges target | Publish | Judges receive | P0 | |
| ADM-ANN-009 | Mentors target | Publish | Mentors receive | P0 | |
| ADM-ANN-010 | Team target | Publish | Only selected team receives | P0 | |

## 36. ADMIN CERTIFICATES
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| CERT-ADM-001 | Load | Open | Loads | P1 | |
| CERT-ADM-002 | Create template | Create | Saved | P1 | |
| CERT-ADM-003 | Signature | Add signature | Saved | P2 | |
| CERT-ADM-004 | Generate | Generate certificate | Certificate created | P0 | |
| CERT-ADM-005 | Bulk generate | Select multiple | Certificates generated | P1 | |
| CERT-ADM-006 | Revoke | Revoke certificate | Status changes | P0 | |
| CERT-ADM-007 | Verify | Verify valid ID | Valid result | P0 | |

## 37. ADMIN RECRUITMENT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-REC-001 | Load | Open | Loads | P1 | |
| ADM-REC-002 | Review profile | Open | Details shown | P1 | |
| ADM-REC-003 | Report | Open reported profile | Report visible | P1 | |
| ADM-REC-004 | Hide profile | Hide | Profile no longer public | P0 | |
| ADM-REC-005 | Suspend profile | Suspend | Profile disabled | P0 | |
| ADM-REC-006 | Remove content | Remove inappropriate content | Content removed | P1 | |

## 38. ADMIN SUPPORT
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-SUP-001 | Load ticket queue | Open | Loads | P0 | |
| ADM-SUP-002 | OPEN filter | Filter | Correct tickets | P1 | |
| ADM-SUP-003 | IN PROGRESS | Filter | Correct tickets | P1 | |
| ADM-SUP-004 | RESOLVED | Filter | Correct tickets | P1 | |
| ADM-SUP-005 | CLOSED | Filter | Correct tickets | P1 | |
| ADM-SUP-006 | Open ticket | Click | Details shown | P0 | |
| ADM-SUP-007 | Open Comms | Click | Correct user's private chat | P0 | |
| ADM-SUP-008 | Reply | Admin sends | Student receives | P0 | |
| ADM-SUP-009 | Resolve | Resolve | Status updated | P0 | |
| ADM-SUP-010 | Close | Close | Status updated | P1 | |

## 39. ADMIN SPONSORS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-SPONS-001 | Load | Open | Loads | P1 | |
| ADM-SPONS-002 | Add sponsor | Create | Saved | P1 | |
| ADM-SPONS-003 | Edit sponsor | Modify | Updated | P1 | |
| ADM-SPONS-004 | Delete sponsor | Delete | Removed | P1 | |
| ADM-SPONS-005 | Publish sponsor | Publish | Appears public | P0 | |
| ADM-SPONS-006 | Reorder | Change order | Public order updates | P2 | |

## 40. ADMIN GALLERY
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ADM-GAL-001 | Load | Open | Loads | P1 | |
| ADM-GAL-002 | Upload media | Upload supported media | Stored | P1 | |
| ADM-GAL-003 | Album | Create album | Saved | P2 | |
| ADM-GAL-004 | Publish media | Publish | Public gallery updates | P1 | |
| ADM-GAL-005 | Delete media | Delete | Removed | P1 | |
| ADM-GAL-006 | Broken upload | Invalid file | Friendly validation | P2 | |

## 41. ADMIN ANALYTICS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ANA-001 | Load | Open | Loads | P1 | |
| ANA-002 | Registration trends | View chart | DB-derived data | P1 | |
| ANA-003 | Teams count | View | Correct count | P1 | |
| ANA-004 | Submission progress | View | Correct data | P1 | |
| ANA-005 | Evaluation progress | View | Correct data | P1 | |
| ANA-006 | College distribution | View | Correct data | P2 | |
| ANA-007 | Problem popularity | View | Correct data | P2 | |
| ANA-008 | User activity | View | Correct data | P2 | |
| ANA-009 | Empty analytics | No data | Proper empty state | P1 | |

## 42. ACTIVITY LOGS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| LOG-001 | Load logs | Open | Loads | P1 | |
| LOG-002 | Admin login log | Login | Activity recorded | P0 | |
| LOG-003 | Hackathon creation log | Create | Activity recorded | P0 | |
| LOG-004 | Deadline change | Change date | Activity recorded | P1 | |
| LOG-005 | Problem creation | Create | Activity recorded | P1 | |
| LOG-006 | User suspension | Suspend | Activity recorded | P0 | |
| LOG-007 | Judge assignment | Assign | Activity recorded | P1 | |
| LOG-008 | Leaderboard publish | Publish | Activity recorded | P0 | |
| LOG-009 | Certificate generation | Generate | Activity recorded | P1 | |

## 43. ADMIN SETTINGS
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| SET-001 | Settings load | Open | Loads | P0 | |
| SET-002 | Platform settings | Change | Saves | P1 | |
| SET-003 | Registration setting | Toggle | Saves | P0 | |
| SET-004 | Submission setting | Toggle | Saves | P0 | |
| SET-005 | Notification setting | Toggle | Saves | P1 | |
| SET-006 | AI assistant | Toggle | Saves | P1 | |
| SET-007 | Chat setting | Toggle | Saves | P1 | |
| SET-008 | Certificate setting | Toggle | Saves | P1 | |
| SET-009 | Maintenance | Toggle | Correct behavior | P0 | |
| SET-010 | Persistence | Change → refresh | Value remains | P0 | |

## 44. EVENT SCHEDULE ADMIN
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| SCH-001 | Load | Open | Loads | P1 | |
| SCH-002 | Add event | Create | Saved | P1 | |
| SCH-003 | Edit event | Change | Saved | P1 | |
| SCH-004 | Delete event | Delete | Removed | P1 | |
| SCH-005 | Publish | Publish | Public timeline updates | P0 | |
| SCH-006 | Unpublish | Unpublish | Public event disappears | P0 | |
| SCH-007 | Time change | Change 14:00 → 14:30 | /timeline shows 14:30 | P0 | |

## 45. GLOBAL SEARCH
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| SEARCH-001 | Search page | Open | Loads | P1 | |
| SEARCH-002 | Problem search | Search title | Correct problem | P1 | |
| SEARCH-003 | Team search | Search team | Correct team | P1 | |
| SEARCH-004 | User search | Search user | Correct public-accessible result | P1 | |
| SEARCH-005 | Project search | Search project | Correct result | P1 | |
| SEARCH-006 | Announcement search | Search | Correct result | P2 | |
| SEARCH-007 | FAQ search | Search | Correct result | P1 | |
| SEARCH-008 | Empty search | Unknown query | Empty state | P2 | |
| SEARCH-009 | Unauthorized data | Search private data | Private information not exposed | P0 | |

## 46. ERROR PAGES
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| ERR-001 | 404 | Open invalid route | 404 page | P0 | |
| ERR-002 | 401 | Access protected page logged out | 401/login | P0 | |
| ERR-003 | 403 | Access unauthorized route | 403 | P0 | |
| ERR-004 | 500 | Trigger server error | Friendly 500 | P0 | |
| ERR-005 | Maintenance | Enable maintenance | Maintenance page/behavior | P0 | |
| ERR-006 | API error | Kill API request | Error state + retry | P0 | |
| ERR-007 | Null data | Missing field from backend | UI doesn't crash | P0 | |
| ERR-008 | Invalid date | Invalid database date | No Invalid Date displayed | P0 | |
| ERR-009 | Empty arrays | No records | Proper empty state | P1 | |

## 47. CERTIFICATE VERIFICATION
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| VER-001 | Valid certificate | Enter valid ID | Verification successful | P0 | |
| VER-002 | Invalid certificate | Enter random ID | Invalid certificate state | P0 | |
| VER-003 | Holder | Verify | Correct holder | P0 | |
| VER-004 | Certificate type | Verify | Correct type | P1 | |
| VER-005 | Hackathon | Verify | Correct event | P1 | |
| VER-006 | Issue status | Verify | Correct status | P0 | |
| VER-007 | Issue date | Verify | Correct date | P1 | |
| VER-008 | Revoked certificate | Verify revoked ID | Revoked status shown | P0 | |
| VER-009 | Private information | Inspect response | Only public certificate data exposed | P0 | |

## 48. SECURITY / RBAC
| ID | Test Case | Expected | Pri | Status |
|----|-----------|----------|-----|--------|
| SEC-001 | Guest → /admin | Login required | P0 | |
| SEC-002 | Student → /admin | 403 | P0 | |
| SEC-003 | Student → /admin/users | 403 | P0 | |
| SEC-004 | Student → /admin/settings | 403 | P0 | |
| SEC-005 | Mentor → /admin/hackathons | 403 | P0 | |
| SEC-006 | Judge → /admin/evaluations | 403 where admin-only | P0 | |
| SEC-007 | Recruiter → /admin/settings | 403 | P0 | |
| SEC-008 | Invalid JWT → admin API | 401 | P0 | |
| SEC-009 | Student → admin API directly | 403 | P0 | |
| SEC-010 | User edits another profile | 403 | P0 | |
| SEC-011 | User opens another support ticket | 403 | P0 | |
| SEC-012 | Student opens another workspace | 403 | P0 | |
| SEC-013 | Judge opens unassigned project | 403 | P0 | |
| SEC-014 | Mentor opens unassigned team | 403 | P0 | |
| SEC-015 | Suspended user login | Rejected | P0 | |
| SEC-016 | Missing authorization header | 401 | P0 | |
| SEC-017 | Expired JWT | 401 | P0 | |
| SEC-018 | Tampered JWT | 401 | P0 | |
| SEC-019 | Client-side role manipulation | Backend still denies unauthorized action | P0 | |
| SEC-020 | Direct API URL access | Server enforces permissions | P0 | |

## 49. RESPONSIVE WEB TESTS
| ID | Test Case | Expected | Pri | Status |
|----|-----------|----------|-----|--------|
| RESP-001 | Home desktop | No layout break | P1 | |
| RESP-002 | Home mobile | No horizontal overflow | P0 | |
| RESP-003 | Navigation mobile | Menu works | P0 | |
| RESP-004 | Login mobile | Form usable | P0 | |
| RESP-005 | Problems mobile | Filters usable | P1 | |
| RESP-006 | Dashboard mobile | Cards/layout usable | P1 | |
| RESP-007 | Workspace mobile | Controls usable | P1 | |
| RESP-008 | Chat mobile | Messages/input usable | P0 | |
| RESP-009 | Support mobile | Ticket form usable | P1 | |
| RESP-010 | Admin mobile | No broken controls | P1 | |
| RESP-011 | Tables mobile | Scroll/stack correctly | P1 | |
| RESP-012 | Modal mobile | Fully visible | P1 | |
| RESP-013 | Sidebar collapse | Correct behavior | P1 | |
| RESP-014 | No text clipping | Text readable | P1 | |
| RESP-015 | No horizontal scrolling | Page contained | P0 | |

## 50. UI / INTERACTION TESTS
| ID | Test Case | Expected | Pri | Status |
|----|-----------|----------|-----|--------|
| UI-001 | Buttons | All functional buttons work | P0 | |
| UI-002 | Links | No dead internal links | P0 | |
| UI-003 | Dropdowns | Open/close correctly | P1 | |
| UI-004 | Modals | Open/close correctly | P1 | |
| UI-005 | Toasts | Success/error feedback shown | P1 | |
| UI-006 | Loading states | Display while request runs | P1 | |
| UI-007 | Disabled actions | Proper disabled state | P1 | |
| UI-008 | Form validation | Field errors correct | P0 | |
| UI-009 | Keyboard navigation | Main flows usable | P2 | |
| UI-010 | Focus states | Focus visible | P2 | |
| UI-011 | Refresh after mutation | Updated state remains | P0 | |
| UI-012 | Double click submit | No duplicate records | P0 | |

## 51. DATA / DATABASE PERSISTENCE
| ID | Test Case | Steps | Expected | Pri | Status |
|----|-----------|-------|----------|-----|--------|
| DB-001 | Create user | Register | User stored | P0 | |
| DB-002 | Create team | Student creates | Team stored | P0 | |
| DB-003 | Invite member | Send invitation | Stored | P0 | |
| DB-004 | Problem selection | Select | Stored | P0 | |
| DB-005 | Project update | Edit | Stored | P0 | |
| DB-006 | Submission | Submit | Stored | P0 | |
| DB-007 | Evaluation | Judge submit | Stored | P0 | |
| DB-008 | Leaderboard | Publish | Persisted | P0 | |
| DB-009 | Chat | Send message | Persisted | P0 | |
| DB-010 | Support | Create ticket | Persisted | P0 | |
| DB-011 | Notification | Generate | Persisted | P1 | |
| DB-012 | Certificate | Generate | Persisted | P1 | |
| DB-013 | Settings | Toggle | Persisted | P0 | |
| DB-014 | Logs | Admin action | Persisted | P1 | |
| DB-015 | Refresh | Refresh all pages | No loss of valid data | P0 | |

## 52. CROSS-PAGE ACCEPTANCE TESTS
| ID | Test Case | Expected | Status |
|----|-----------|----------|--------|
| CROSS-001 | Hackathon → Public Website | Admin-created data → MongoDB → Public website → Student registration | PASS |
| CROSS-002 | Problem → Team | Published problem → visible to authorized student → selectable → linked to team | PASS |
| CROSS-003 | Submission → Judge | Student submission → Admin → Judge assignment → Judge can review | PASS |
| CROSS-004 | Evaluation → Leaderboard | Correct evaluation → aggregate score → published leaderboard | PASS |
| CROSS-005 | SOS → Mentor | Mentor assignment changes team access and communication | PASS |
| CROSS-006 | Announcement → Notification | Student receives it; judge does not | PASS |
| CROSS-007 | Support → Chat | Correct ticket is linked to the correct private conversation | PASS |
| CROSS-008 | Schedule → Timeline | 14:30 displayed | PASS |

## 53. COMPLETE ADMIN JOURNEY
| Phase | Action | Expected | Status |
|-------|--------|----------|--------|
| 1 | Login to /admin, Dashboard | Loads without error | |
| 2 | Users (Search, Suspend, Reactivate) | Correct status updates, login blocks | |
| 3 | Hackathons (Create, Draft, Publish) | Appears on public homepage | |
| 4 | Problems (Create, Publish) | Public visibility | |
| 5 | Teams / Submissions / Judges | Verify member structure, submission locks, judge access | |
| 6 | Evaluations / Leaderboard | Verify scores, bonus/penalty, publish | |
| 7 | Mentors / Announcements | Assign mentor, publish targeted announcement | |
| 8 | Support (Open Comms, Reply, Resolve) | Opens private chat, updates status | |
| 9 | Certificates / Recruitment / Sponsors / Gallery | CRUD works, media persists | |
| 10 | Analytics / Logs | Shows correct metrics and recent actions | |
| 11 | Settings / Schedule | Changes persist, schedule updates public timeline | |
| 12 | Logout | Prevents back-navigation access | |

## 54. MASTER ADMIN → USER ACCEPTANCE TEST
| Action | Admin Perspective | User Perspective | Status |
|--------|-------------------|------------------|--------|
| Hackathon | Creates | Sees Hackathon | |
| Problem | Publishes | Sees Problem | |
| Team | Sees Team | Creates Team | |
| Submission | Sees Submission | Submits Project | |
| Judge | Assigns Judge | (Judge) Sees Submission | |
| Evaluation | Sees Evaluation | (Judge) Submits Eval | |
| Leaderboard | Publishes | Sees Leaderboard | |
| Announcement | Publishes | Receives Notification | |
| Support Ticket | Sees Ticket | Creates Ticket | |
| Open Comms | Replies via Comms | Receives Reply | |
| Schedule | Changes Event | Sees Updated Timeline | |
