# CODESRIJAN — PROJECT SUBMISSION & JUDGING EVALUATION GAP ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-10` | **Focus Area**: Submissions, Artifact Integrity & Multi-Judge Scoring  
**Executive Author**: Lead Competition Architect, Senior Judge & Lead Security Engineer  

---

## 1. Executive Summary
A hackathon's competitive credibility depends entirely on two pillars: **unimpeachable submission integrity** and **transparent, unbiased judging**. If submissions can be silently edited after the deadline, or if judges evaluate without structured rubrics, participant trust evaporates. This document details the gap analysis between CodeSrijan's current submission/evaluation modules and professional competition standards.

---

## 2. Project Submission Subsystem Analysis

### 2.1 Current Implementation (`workspace.tsx` & `admin.submissions.tsx`)
- **Participant Input**: Repository URL (`text`), Demo URL (`text`), Presentation/Video Link (`text`).
- **Submission Trigger**: `submitProject(teamId, repositoryUrl, demoUrl)`.
- **Administrative Review**: Table listing team name, repo link, demo link, and evaluation status.

### 2.2 Critical Vulnerabilities & Missing Capabilities
1. **Repository Verification Void**:
   - *Current State*: The platform accepts any text string as a repository URL.
   - *The Danger*: Teams can submit private repository URLs (which judges cannot view), non-existent URLs, or dummy links to beat the deadline, updating the code later.
   - *Solution*: Pre-flight API check:
     - Ping GitHub REST API: Verify repo exists, is public, has an initial commit, and was created within the hackathon window.
     - Record the exact **Git Commit SHA** at the moment of submission. Subsequent commits after the deadline are flagged to judges as `LATE_COMMITS_DETECTED`.
2. **Immutable Submission Receipts**:
   - *The Danger*: In disputes ("We submitted at 11:58 PM, but your server says 12:01 AM"), organizers have no verifiable proof.
   - *Solution*: Generate a signed JSON/PDF **Submission Cryptographic Receipt**:
     `Receipt ID: SUB-2026-XXXX • Server Timestamp: 2026-10-30T23:58:12.418Z • Payload Hash: e3b0c442...`
3. **Grace Period & Exception Handling**:
   - *The Reality*: Large file uploads fail in the final 5 minutes due to network congestion.
   - *Solution*: Configurable 5-minute soft grace period buffer. Submissions received during buffer are tagged `GRACE_PERIOD_SUBMISSION`.

---

## 3. Judging & Evaluation Subsystem Analysis

### 3.1 Current Implementation (`evaluations.tsx` & `admin.evaluations.tsx`)
- **Current State**: Evaluators assign scores across predefined fields. Admin can view aggregate evaluations.

### 3.2 Evaluation Gaps & Bias Vulnerabilities

#### A. Blind Judging Support (Anti-Bias Protection)
- **Problem**: When judges evaluate projects, viewing the team's college (e.g. "IIT Bombay" vs "Tier-3 Engineering College") or participant names introduces conscious or unconscious bias.
- **Solution**: Implement a `BLIND_JUDGING_ENABLED` toggle on `/admin/evaluations`.
  - When active, the evaluator cockpit hides participant names, avatar photos, and college affiliations, displaying only:
    `Squad ID: SQUAD-42 • Track: AI/ML • Project: Autonomous Edge Vision`.

#### B. Multi-Criterion Weighted Scoring Rubrics
- Competitions require granular weighted rubrics rather than a generic 1-10 rating:
  ```json
  {
    "rubric": [
      { "criterion": "Innovation & Originality", "weight": 0.30, "maxPoints": 30 },
      { "criterion": "Technical Depth & Architecture", "weight": 0.30, "maxPoints": 30 },
      { "criterion": "Working Implementation & Polish", "weight": 0.20, "maxPoints": 20 },
      { "criterion": "Design & User Experience", "weight": 0.10, "maxPoints": 10 },
      { "criterion": "Presentation & Documentation", "weight": 0.10, "maxPoints": 10 }
    ]
  }
  ```

#### C. Score Normalization (Z-Score Standardization)
- **The Problem**: Judge Alpha gives an average score of 88/100 (lenient), while Judge Beta gives an average score of 62/100 (strict). Teams evaluated by Judge Alpha receive an unfair advantage.
- **The Solution**: Apply statistical standard-deviation normalization (Z-score calculation) across judge cohorts before publishing leaderboard standings.

#### D. Tie-Breaking & Appeal Dispute Window
- **Tie-Breaking Hierarchy**:
  1. Highest score in "Technical Depth".
  2. Highest score in "Innovation".
  3. Earliest final submission timestamp.
- **Dispute Window**: A 2-hour provisional results window allowing teams to inspect criterion breakdowns and flag factual evaluation errors (e.g., "Judge noted demo link was broken, but demo was active").

