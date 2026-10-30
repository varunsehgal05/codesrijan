# CODESRIJAN — FIREBASE, HOSTING AND INFRASTRUCTURE AUDIT

**Audit Date:** October 30, 2026  
**Auditor:** Principal DevOps & Cloud Infrastructure Engineer  
**Infrastructure Target:** 100% Zero-Cost Operating Model ($0.00/month strict)  
**Live Production Environments:**
* **Frontend:** Vercel Hobby (`https://codesrijan-nine.vercel.app`)
* **Backend:** Render Free Web Service (`srv-db1b3ke0tbcc73ac3ea0`, `https://codesrijan-api-6tfr.onrender.com/api`)
* **Database:** MongoDB Atlas M0 Cluster (`codesrijan`)
* **Firebase Project:** `codesrijan-450d0` (Spark Plan)

---

## 1. Comprehensive Service-by-Service Audit

| Infrastructure Component | Connected? | How It Is Used | Actually Works? | Current Plan | Underused Free Capabilities | Security Concerns & Risks |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **Firebase Cloud Messaging (FCM)** | ✅ YES | Backend pushes notifications to client browsers via `server/services/fcm.js`. | ⚠️ PARTIAL | Spark (Free) | Topic-based broadcasting (e.g. subscribing all hackers in the AI track to `topic:ai_track`). | Push tokens saved in `User.fcmTokens`, but requires client service worker registration to receive foreground notifications. |
| **Firebase App Check** | ✅ YES | Middleware `server/middleware/appCheck.js` verifies `X-Firebase-AppCheck` header. | ✅ YES | Spark (Free) | Recaptcha v3 integration for automated bot protection. | Enforced in non-blocking mode on public API routes to prevent locking out older browsers. |
| **Firebase Analytics** | ✅ YES | Initialized in client entry (`src/lib/firebase.ts`). | ✅ YES | Free (Unlimited) | Custom conversion funnels (e.g., Landing -> Registration -> Squad Lock -> Payload Delivered). | Currently tracks basic pageviews; custom user event telemetry is not fully instrumented. |
| **Firebase Performance Monitoring** | ✅ YES | Initialized via SDK. | ✅ YES | Free | Network trace monitoring for slow backend API calls. | Active, monitoring client TTFB and page load times. |
| **Firebase Remote Config** | ⚠️ PARTIAL | SDK loaded. | ⚠️ IDLE | Free | Dynamic emergency kill-switches (e.g. disabling registrations without a redeploy). | Hardcoded in local environment flags instead of leveraging dynamic Remote Config values. |
| **Firebase Authentication** | ✅ YES | Backend `auth.js` supports verifying Firebase Admin ID tokens alongside legacy sessions. | ✅ YES | Free (50k MAU) | Social OAuth (Sign in with GitHub / Google) is supported by Firebase but disabled in the CodeSrijan UI. | Students still rely heavily on custom OTP email flows rather than instant 1-click GitHub OAuth. |
| **Vercel** | ✅ YES | Hosts TanStack Router SPA with client caching and edge routing (`vercel.json`). | ✅ YES | Hobby (Free) | Edge Config and Serverless rewrites. | Free plan bandwidth (100GB/mo) is more than sufficient for 10,000+ competitors. |
| **Render Web Service** | ✅ YES | Runs Node.js Express server (`server/server.js`) with WebSockets (Socket.io). | ✅ YES | Free ($0/mo) | Custom health check endpoints and log streaming. | **Render Free spins down after 15 minutes of inactivity**, resulting in a 50-second cold start on the first visitor. |
| **MongoDB Atlas** | ✅ YES | Primary transactional datastore (`codesrijan` keyspace, 17+ collections). | ✅ YES | M0 Free (512MB) | Compound indexes, aggregation pipelines. | Storage limit is 512MB. If unmanaged GridFS images accumulate, cluster can hit quota limit. |
| **ImageKit / Media Storage** | ✅ YES (GridFS Primary) | Payment slips and banners are stored in MongoDB GridFS chunks (`server/services/storage.js`). | ✅ YES | Free (Built-in) | Native GridFS zero-cost storage avoids third-party paid image hosting tiers. | GridFS binary files consume space from the 512MB Atlas M0 quota. |
| **SrijanBot (Groq LLM)** | ✅ YES | Powers AI Copilot using `llama-3.3-70b-versatile` / `llama3-8b-8192`. | ✅ YES | Free Tier (30 RPM) | In-memory semantic caching, tool-calling directly on live MongoDB aggregations. | Groq rate limits (30 requests/min). High concurrent event traffic could hit 429 limits without a local cache. |
| **Email Relay (Google Apps Script)**| ✅ YES | Dispatches verification OTPs and payment notices via a headless Google Apps Script webhook. | ✅ YES | Free (Gmail 100/day) | Free email relay without requiring SendGrid or AWS SES paid plans. | Gmail enforces a limit of 100-500 emails per day. A 1,000-person hackathon will hit rate limits unless upgraded to Google Workspace. |
| **GitHub Actions** | ⚠️ PARTIAL | Repo CI exists for lint and build checks. | ✅ YES | Free (Public Repo) | Automated deployment triggers and security dependency scans. | Workflows need automated regression test suite execution on every PR. |

---

## 2. Infrastructure Strengths to Preserve

1. **True $0.00/Month Operating Feasibility**: The architecture successfully eliminates all fixed SaaS subscription fees by combining Vercel, Render Free, MongoDB Atlas M0, and Google Apps Script.
2. **Dual-Stack Authentication**: Supports both decentralized custom session cookies and Firebase Admin ID tokens, enabling future migration to full social logins without architectural disruption.
3. **MongoDB GridFS Self-Contained Binary Vault**: Avoids reliance on AWS S3 buckets or paid cloud storage providers by storing binary payment proofs directly inside the database with leased access controls.

---

## 3. High-Priority Infrastructure Optimizations

1. **Mitigate Render 50-Second Cold Starts:**
   - Configure a free cron ping (e.g. via cron-job.org or UptimeRobot) to ping `GET /api/public/health` every 14 minutes, keeping the Render container warm throughout active competition days.
2. **Prevent MongoDB Atlas 512MB Quota Exhaustion:**
   - Implement an automated storage garbage collector in `server/services/storage.js` to purge payment proof screenshots older than 60 days once payments are verified and archived.
3. **Activate Social GitHub & Google Login via Firebase:**
   - Enable Firebase GitHub and Google Auth providers in `src/routes/login.tsx` to give developer competitors an instantaneous 1-click login, bypassing email OTP relay latency.

---

*Verified from infrastructure configuration files (`server/services/*`, `vercel.json`, `render.yaml`).*
