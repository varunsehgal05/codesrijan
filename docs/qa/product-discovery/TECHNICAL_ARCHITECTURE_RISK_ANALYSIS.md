# CODESRIJAN — TECHNICAL ARCHITECTURE & RELIABILITY RISK ANALYSIS
**Product**: CodeSrijan Hackathon Management & Competition Matrix  
**Document Code**: `DISCOVERY-DOC-14` | **Focus Area**: Cloud Infrastructure, Free-Tier Quotas & Scalability Bottlenecks  
**Executive Perspective**: Chief Technology Officer (CTO), Principal DevOps Engineer & Database Architect  

---

## 1. Executive Summary & Infrastructure Constraints
CodeSrijan currently operates under a strict **$0.00 additional monthly cloud infrastructure budget**. This zero-budget design is an immense achievement, but it introduces architectural boundaries defined by the free-tier service limits of Vercel, Render, MongoDB Atlas, and Firebase. Understanding these failure modes is essential to prevent outages during live hackathons.

```
+-----------------------------------------------------------------------------------------+
|                                ZERO-COST CLOUD TOPOLOGY                                 |
+-----------------------------------------------------------------------------------------+
|  Frontend: Vercel Edge CDN (Static React 18 SPA + TanStack Router)                      |
|  Backend: Render Free Web Service (Node.js 20 Express + Socket.io duplex channel)       |
|  Database: MongoDB Atlas Shared Tier M0 (AWS Mumbai / ap-south-1, 512MB Storage Cap)     |
|  Identity & Telemetry: Firebase Spark Tier (Auth, Cloud Messaging, Analytics)           |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Infrastructure Bottleneck & Risk Matrix

| Component | Free-Tier Quota Limit | Failure Mode During Live Event | Mitigation Implemented / Required |
| :--- | :--- | :--- | :--- |
| **Render Web Service** | Inactive sleep after 15 mins; 50-second cold start | First user visiting site experiences 45-60s API timeout | Implemented fast client cache (`store.tsx`); add automated health cron during active events |
| **MongoDB Atlas (M0)** | 512MB Storage Cap; 500 max concurrent connections | Massive file uploads (PDFs, banners) crash database quota | Store large files in external cloud object storage or compress Base64 assets |
| **Vercel Edge** | 100GB monthly bandwidth | High-traffic event banner loads exhaust monthly allowance | WebP compression, lazy loading, and CDN cache headers (`Cache-Control: max-age=86400`) |
| **Firebase Auth** | 50,000 MAUs | Exceeded free quota if platform scales nationally | Express JWT session fallback already implemented in `store.tsx` |
| **SrijanBot / Groq API**| 30 RPM / 6,000 TPM rate limit | 200 students asking SrijanBot questions simultaneously | Pre-computed knowledge base and FAQ fallback when LLM rate limit is reached |

---

## 3. Deep-Dive Subsystem Audits

### 3.1 SrijanBot Production Stability & Bug Verification
- **Historical Defects Checked**:
  1. *Decommissioned Groq Model*: Earlier builds targeted `llama3-70b-8192` which experienced deprecation notices. Current engine targets active Groq models with graceful fallback to cached answers.
  2. *Undefined `.ok` Exception*: In previous versions, handling fetch errors threw `Cannot read property 'ok' of undefined`. Resolved with structured try/catch blocks.
  3. *`ERR_HTTP_HEADERS_SENT`*: Multiple responses dispatched in asynchronous handlers caused Express crash loops. Backend route handlers now enforce strict single-return semantics: `return res.status(...).json(...)`.
- **Current Health**: **100% OPERATIONAL**.

---

### 3.2 MongoDB Atlas 512MB Storage Conservation Protocol
Because Atlas M0 caps total database size at 512MB:
1. **Never store raw 15MB PDF files directly in MongoDB BSON documents**.
2. Uploaded banners must be compressed to `< 200KB` WebP images before encoding or storage.
3. Chat message retention: Retain chat history for active hackathons; archive messages older than 60 days into exportable JSON backups to preserve database space.

---

### 3.3 Database Indexing Optimization
Without compound indexes, queries like `GET /api/teams?hackathonId=...` perform expensive collection scans (`COLLSCAN`):
- **Mandatory Production Compound Indexes**:
  ```javascript
  // Fast hackathon-scoped queries
  TeamSchema.index({ hackathonId: 1, status: 1 });
  RegistrationSchema.index({ hackathonId: 1, userId: 1 }, { unique: true });
  SubmissionSchema.index({ hackathonId: 1, teamId: 1 });
  EvaluationSchema.index({ hackathonId: 1, judgeId: 1 });
  NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
  ```

