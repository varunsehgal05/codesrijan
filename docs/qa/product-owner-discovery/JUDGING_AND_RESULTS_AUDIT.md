# CODESRIJAN — JUDGING AND COMPETITION INTEGRITY AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal Competition Integrity Officer & Chief Judge  
**Focus:** Fairness, mathematical integrity, scoring formulas, conflict of interest handling, and result approval workflows.  

---

## 1. Existing Scoring Architecture & Winner Calculation

### 1.1 The Mathematical Evaluation Model
The current score for any given team submission is calculated in `server/server.js` using the following formula:

$$\text{Final Team Score} = \left( \frac{\sum_{j=1}^{N} S_j}{N} \right) + \text{Bonus Points} - \text{Penalty Points}$$

Where:
* $N$ is the number of evaluations submitted by assigned judges.
* $S_j$ is the total score awarded by Judge $j$, derived from their criteria rubric:
  $$S_j = \sum_{c=1}^{K} \text{score}_{j,c}$$
* $\text{score}_{j,c}$ is the numerical rating (0 to 100) awarded for Criterion $c$.
* $\text{Bonus Points}$ and $\text{Penalty Points}$ are administrative overrides set via `/admin/teams`.

---

## 2. Integrity and Fairness Audit Checklist

| Competition Integrity Area | Implemented? | Existing Behavior & Limitations | Risk Level |
| :--- | :---: | :--- | :---: |
| **1. Judge Assignment to Tracks** | ✅ YES | Super-admin assigns judges to specific hackathons and category domains via `/admin/judges`. | LOW |
| **2. Multi-Criteria Rubric** | ✅ YES | Configurable criteria: Technical Complexity, Innovation, UI/UX, Completeness, Presentation. | LOW |
| **3. Qualitative Critique** | ✅ YES | Judges provide written strengths, weaknesses, and improvement commentary. | LOW |
| **4. Blind Evaluation (De-identification)**| ❌ **NO** | Judges see squad names, team member names, and college affiliations, creating unconscious bias. | **HIGH** |
| **5. Score Normalization (Z-Score)** | ❌ **NO** | Naive arithmetic averaging. If Judge A grades strictly (average score 65) and Judge B grades generously (average score 92), teams assigned to Judge B have an unfair mathematical advantage. | **HIGH** |
| **6. Missing Evaluation Handling** | ⚠️ PARTIAL | Teams with only 1 judge evaluation are sorted against teams with 3 evaluations. The arithmetic mean masks missing judge submissions. | **MEDIUM** |
| **7. Tie-Breaking Algorithm** | ❌ **NO** | When two teams have identical total scores (e.g., both 94.5), the leaderboard sorts by MongoDB document insertion order. | **MEDIUM** |
| **8. Conflict-of-Interest Disclosures** | ❌ **NO** | No mechanism for a judge to declare a conflict (e.g. "I am a professor at this team's college") and recuse themselves. | **HIGH** |
| **9. Score Modification Audit Trail** | ⚠️ PARTIAL | When a judge updates an evaluation, the previous score is overwritten. No historical revision ledger is maintained for individual score adjustments. | **MEDIUM** |
| **10. Deliberation & Leaderboard Freeze**| ✅ YES | Admin can freeze public leaderboard visibility while final evaluations are reviewed. | LOW |
| **11. Participant Appeal & Dispute Portal**| ❌ **NO** | Competitors have no formal route to request a scoring review or dispute an evaluation error. | **MEDIUM** |

---

## 3. Mathematical Flaw Demonstration: The Lenient Judge Effect

Consider two top-tier teams in the AI Track evaluated under the current CodeSrijan engine:

* **Team Alpha:** Assigned to **Strict Judge A** (who gives them 88/100, their highest score of the day).  
  $$\text{Final Score (Team Alpha)} = 88.0$$
* **Team Beta:** Assigned to **Lenient Judge B** (who routinely hands out 95s and gives them 93/100).  
  $$\text{Final Score (Team Beta)} = 93.0$$

**Result:** Team Beta wins 1st Place, even though Judge A considered Team Alpha a far superior engineering artifact.  
**Fix Required:** Implement **Z-Score Normalization** across all judge scorecards:

$$Z_{i,j} = \frac{X_{i,j} - \mu_j}{\sigma_j}$$

Where $\mu_j$ is Judge $j$'s mean score and $\sigma_j$ is their standard deviation. This standardizes all judge score distributions to an identical baseline before computing final ranks.

---

## 4. Recommended Competition Governance Enhancements

1. **Anonymous / Blind Evaluation Mode:**
   - In `/evaluations`, hide team names, member names, and college names. Replace with anonymous codes (e.g. `Squad #42 [AI Track]`).
2. **Deterministic Tie-Breaking Rules:**
   - In the event of a tie:
     - Tie-Breaker 1: Highest score in the primary criterion (e.g., "Technical Architecture & Complexity").
     - Tie-Breaker 2: Earliest submission timestamp.
3. **Judge Recusal Button:**
   - Add a 1-click "Recuse / Conflict of Interest" button in the judge portal that reassigns the submission to another judge on the panel.

---

*Verified from evaluation schema and leaderboard sorting controllers.*
