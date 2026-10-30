# CODESRIJAN — FINAL SYSTEM ARCHITECTURE SPECIFICATION
**Version:** 3.4.0 (Production Verified)  
**Target Environment:** Vercel Global Edge (Client) + Render Web Service (API) + MongoDB Atlas Free Tier (Cluster)  
**Security Posture:** Zero-Trust Ingress, Strict Role-Based Access Control, App Check Verification, and Tokenized Sessions.  
**Budget Policy:** Strict $0.00 / Month (Permanent Free-Tier Guarantee)  

---

## 1. SYSTEM TOPOLOGY & DEPLOYMENT ARCHITECTURE

CodeSrijan is engineered as a decoupled modern web application with high responsiveness and robust fault isolation:

```
[ User Browser / Client ]
           |
   (HTTPS / WSS Ingress)
           |
    +------+----------------------------------------+
    |                                               |
    v                                               v
[ Vercel Global Edge ]                   [ Render Backend Node Service ]
  - React 18 + Vite SPA                   - Express.js v4.x (Port 5001)
  - TanStack Router v1.x                  - Socket.IO Realtime Server
  - Tailwind CSS + Brutalist Design       - Security Middleware Pipeline
  - Client-Side State (Zustand)           - Controller & Business Logic Layer
  - PWA / Service Worker Assets           - In-Memory Route Caching
                                                    |
                                          +---------+---------+
                                          |                   |
                                          v                   v
                               [ MongoDB Atlas Cluster ]  [ External APIs ]
                                 - Primary Keyspace         - Groq Cloud LLM
                                 - GridFS Storage Bucket    - Firebase Admin SDK
                                 - Mongoose ODM Layer       - Google Apps Script
```

---

## 2. LAYER RESPONSIBILITIES & ENFORCEMENT

### 2.1 Presentation & Client State (Vercel)
- **Role:** Renders the high-contrast Neo-Brutalist user interface, collects user inputs, executes client-side validation (file size, MIME types), and maintains optimistic state updates.
- **Security Boundary:** Never stores server secrets, Firebase private keys, or MongoDB connection strings. All access control checks on the client (e.g. hiding admin buttons) are purely for user experience and are never relied upon for authorization.

### 2.2 Ingress & Security Middleware (Express)
1. **CORS Allowlist:** Restricts incoming cross-origin requests strictly to authorized domains (`https://codesrijan-nine.vercel.app`, `http://localhost:5173`, `http://localhost:3000`).
2. **App Check Inspection:** Inspects `X-Firebase-AppCheck` token on critical endpoints.
3. **Authentication (`requireAuth`):** Validates Bearer JWT signatures against `JWT_SECRET`, decodes user claims (`id`, `email`, `role`), and populates `req.user`.
4. **Role Enforcement (`requireRole([...])`):** Blocks non-admin operatives with HTTP 403 Forbidden on administrative endpoints (`/api/admin/*`).

### 2.3 Application Controllers & Services
- **Auth & Identity:** Manages bcrypt password hashing, 6-digit numeric OTP generation, and email verification workflows.
- **Hackathon & Teams:** Manages the competition lifecycle, squad recruitment, member quotas (max 4 slots), problem allocations, and payment verification.
- **Support & SOS Dispatch:** Provides bidirectional ticketing channels with auto-healing conversation linking and urgent SOS mentor dispatches.
- **SrijanBot AI Service:** Provides grounded answers using Groq `llama-3.3-70b-versatile` with an automatic 5-second timeout, falling back deterministically to an offline heuristic rules engine.

### 2.4 Data Tier (MongoDB Atlas)
- **Primary Data Store:** 14 collections storing strictly typed Mongoose documents.
- **Binary Media Storage:** MongoDB GridFS stores PDF specification documents, rubrics, and high-resolution certificates, avoiding external S3 or ImageKit charges.
