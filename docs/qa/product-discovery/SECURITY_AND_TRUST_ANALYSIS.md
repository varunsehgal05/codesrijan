# CODESRIJAN — SECURITY, PRIVACY & PLATFORM TRUST AUDIT
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-13` | **Focus Area**: Cybersecurity, Privacy, OWASP Top 10 & Compliance  
**Executive Perspective**: Chief Information Security Officer (CISO) & Data Privacy Counsel  

---

## 1. Executive Security Posture
Operating an open platform where thousands of students submit external code repositories, upload images, and transfer registration fees introduces significant attack vectors. CodeSrijan's zero-budget architecture utilizes modern SaaS isolation (Vercel Edge + Render + MongoDB Atlas + Firebase), but requires robust defense-in-depth against data breaches, privilege escalation, and fraudulent manipulation.

---

## 2. Threat Vector Analysis & Hardening Blueprint

### 2.1 Multi-Tenant Tenant Crossing & Object-Level Authorization (BOLA / IDOR)
- **OWASP API Threat**: Broken Object Level Authorization (API1:2023).
- **The Threat**: Can Organizer A access Organizer B's private payments or registrations by altering the URL parameter `GET /api/organizers/:orgId/payments`?
- **Current Vulnerability**: Several administrative endpoints currently check `req.user.role === 'admin'` globally, without checking whether the requested resource belongs to the admin's specific collegiate organization.
- **Remediation**:
  - Implement Resource-Level Guard Middleware:
    ```javascript
    export const requireEventOwnership = async (req, res, next) => {
        const event = await Hackathon.findById(req.params.hackathonId || req.body.hackathonId);
        if (!event) return res.status(404).json({ error: "Event not found" });
        if (req.user.role === 'super_admin') return next();
        if (String(event.organizationId) !== String(req.user.organizationId)) {
            return res.status(403).json({ error: "Forbidden: You do not own this hackathon instance." });
        }
        next();
    };
    ```

---

### 2.2 Payment Proof Screenshot & PII File Containment
- **The Threat**: Payment proof screenshots contain sensitive personal financial information: student bank names, UPI VPAs, and personal names.
- **Current State**: Uploads are encoded as Base64 strings or stored in MongoDB GridFS / temporary storage.
- **Privacy Requirement**:
  - Payment proof images must **never** be publicly accessible via unauthenticated URLs.
  - Endpoints serving payment proofs (`GET /api/payments/:id/proof`) must require authenticated admin Bearer tokens.
  - Implement auto-purge: Once an event completes and financial audits are reconciled (e.g. 30 days post-event), raw screenshot binaries should be scrubbed while retaining the alphanumeric transaction ledger.

---

### 2.3 Code Plagiarism & Codebase Pre-Fabrication (Cheating)
- **The Threat**: In 24-hour hackathons, teams frequently submit projects that were built months before the event, or copy pre-existing GitHub repositories verbatim.
- **Anti-Cheating Safeguards**:
  1. **Git Commit History Analysis**: Require teams to connect a fresh GitHub repository created *after* the hackathon start timestamp. Inspect the initial commit timestamp and Git history graph.
  2. **Automated MOSS (Measure of Software Similarity) Pipeline**: Compare submitted project codebases within the same hackathon track to flag identical AST (Abstract Syntax Tree) structures.

---

### 2.4 Data Privacy & Compliance (DPDP Act / GDPR)
- **Student Data Rights**:
  - **Right to Access**: `/profile` allows students to view all personal information stored in the matrix.
  - **Right to Forgotten / Account Deletion**: Add self-serve `DELETE MY ACCOUNT` action in `/settings` that anonymizes past hackathon registrations while preserving competitive scoreboard integrity.
- **Minimal Collection Policy**: Do not collect government ID numbers (Aadhaar/PAN) or physical home addresses unless legally required for cash prize disbursements.

---

### 2.5 Secret & Credential Containment Audit
- **Audit Findings**:
  - Production Vite frontend bundles (`dist/assets/*.js`) contain zero MongoDB connection strings, zero Firebase Service Account private keys, and zero JWT secret keys.
  - All backend secrets remain strictly confined to Render environment variables.
- **Result**: **PASS (Zero secret leakage confirmed)**.

