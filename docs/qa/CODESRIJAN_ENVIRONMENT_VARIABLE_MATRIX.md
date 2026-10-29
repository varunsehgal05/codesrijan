# CODESRIJAN — ENVIRONMENT VARIABLE RECONCILIATION MATRIX
**Document Version:** 1.0.0 | **Generated:** October 29, 2026  
**Security Classification:** Highly Confidential (Internal Architecture Reference)  
**Strict Policy:** Zero Credential Exposure — Sanitized Metadata & Placeholders Only

---

## 1. Executive Summary & Cross-Service Topology
CodeSrijan's multi-cloud infrastructure strictly segregates frontend and backend execution contexts:
- **Frontend Layer (Vercel):** Client-side SPA/SSR bundle. Consumes only `VITE_` prefixed public variables. Secrets are forbidden.
- **Backend Layer (Render):** Node.js Express server. Executes isolated in a secure container. Holds all administrative and provider secrets.
- **Database Layer (MongoDB Atlas M0 Free Tier):** Network-authenticated cluster. Accessible exclusively via encrypted TLS connection string from backend.
- **Platform Layer (Firebase Spark Free Tier):** Client SDK initialization for non-sensitive operations (Analytics, FCM token generation, App Check tokens, Remote Config) and server-side verification via Firebase Admin SDK.

---

## 2. Environment Variable Master Matrix

| # | Variable Name | Ownership | Classification | Required In | Config State | Required / Optional | Redeploy Needed? | Purpose & Consuming Component | Safe Validation Procedure |
|---|---------------|-----------|----------------|-------------|--------------|---------------------|------------------|-------------------------------|---------------------------|
| 1 | `VITE_API_URL` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`https://codesrijan-api-6tfr.onrender.com/api`) | Required | Yes | Base URL for Axios and Socket.IO API requests across all client pages. | Verify `api.defaults.baseURL` in browser console or network request target. |
| 2 | `VITE_FIREBASE_API_KEY` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured | Required for Firebase Client | Yes | Public Web API key for Firebase Client SDK (`src/lib/firebase.ts`). | Check `firebaseApp.options.apiKey` is populated; check no auth rejection on init. |
| 3 | `VITE_FIREBASE_AUTH_DOMAIN` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`codesrijan-450d0.firebaseapp.com`) | Required for Firebase Client | Yes | Firebase project auth domain for client-side OAuth/App Check routing. | Verify domain matches Firebase Console project configuration. |
| 4 | `VITE_FIREBASE_PROJECT_ID` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`codesrijan-450d0`) | Required | Yes | Identifies target Firebase Project across all client modules. | Inspect `getApp().options.projectId` in browser devtools. |
| 5 | `VITE_FIREBASE_STORAGE_BUCKET` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`codesrijan-450d0.firebasestorage.app`) | Optional | Yes | Firebase Storage bucket for client asset references. | Confirm bucket identifier syntax matches Firebase Console. |
| 6 | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`317367993311`) | Required for FCM | Yes | Google Cloud project sender number for FCM web push routing. | Verify FCM registration token generation succeeds via `getToken()`. |
| 7 | `VITE_FIREBASE_APP_ID` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`1:317367993311:web:...`) | Required | Yes | Firebase Web Application identifier. | Verify `firebaseApp.options.appId` matches Firebase console web app. |
| 8 | `VITE_FIREBASE_MEASUREMENT_ID` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured (`G-S1J7V8502C`) | Optional | Yes | Google Analytics 4 measurement ID for privacy-consented event streams. | Confirm GA4 data streams view receives anonymized heartbeat events. |
| 9 | `VITE_FIREBASE_VAPID_KEY` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured | Required for Web Push | Yes | Public Web Push Certificate (VAPID key) passed to `getToken(messaging, { vapidKey })`. | Check `Notification.requestPermission()` returns token with this key pair. |
| 10 | `VITE_FIREBASE_APPCHECK_SITE_KEY` | Frontend (Vercel) | Public Config | Local, Preview, Production | Configured | Optional (Rollout Mode) | Yes | reCAPTCHA v3 site key for Firebase App Check client attestation. | Verify client attaches `X-Firebase-AppCheck` header without network abort. |
| 11 | `MONGO_URI` | Backend (Render) | Server Secret | Local, Production | Configured | Required | Yes (Render restart) | TLS connection string with embedded database credentials for Atlas cluster. | Request `/health`; verify `{ database: { connected: true, readyState: 1 } }`. |
| 12 | `MONGO_DB_NAME` | Backend (Render) | Server Config | Local, Production | Configured (`codesrijan`) | Optional (Default: `codesrijan`) | Yes | Explicit MongoDB keyspace name to avoid targeting test/admin databases. | Verified in `/health` payload `database.name === "codesrijan"`. |
| 13 | `JWT_SECRET` | Backend (Render) | Server Secret | Local, Production | Configured | Required | Yes | Signing secret for session tokens and password reset proofs. | Verify `POST /api/auth/login` returns valid signature and `requireAuth` validates. |
| 14 | `FRONTEND_URL` | Backend (Render) | Server Config | Local, Production | Configured (`https://codesrijan-nine.vercel.app`) | Required | Yes | Canonical frontend origin for strict CORS validation and reset email links. | Execute pre-flight OPTIONS request from origin; check `access-control-allow-origin`. |
| 15 | `PORT` | Backend (Render) | Server Config | Local, Production | Configured (5001 / Render Port) | Required | Yes | TCP port for Express HTTP and WebSocket listener. | Check Render process binds to `$PORT` and passes health check. |
| 16 | `NODE_ENV` | Backend (Render) | Server Config | Local, Production | Configured (`production`) | Required | Yes | Toggles production optimizations, stack trace redaction, and strict CORS. | Verify error handlers return generic messages without leaking stack traces. |
| 17 | `GROQ_API_KEY` | Backend (Render) | Server Secret | Local, Production | Configured | Required for SrijanBot AI | Yes | Bearer token for Groq Cloud API LLM inference requests. | Execute `POST /api/chat/message`; verify HTTP 200 with AI response. |
| 18 | `GROQ_MODEL` | Backend (Render) | Server Config | Local, Production | Configured (`llama-3.1-8b-instant`) | Required (Sanitized) | Yes | LLM model selector. Sanitizer automatically overrides retired `llama3-8b-8192`. | SrijanBot unit tests verify fallback & automatic model substitution. |
| 19 | `FIREBASE_PROJECT_ID` | Backend (Render) | Server Config | Local, Production | Configured (`codesrijan-450d0`) | Required | Yes | Firebase Admin SDK project association for token and App Check validation. | Confirm `[FIREBASE ADMIN] Initialized` appears in server startup logs. |
| 20 | `FIREBASE_CLIENT_EMAIL` | Backend (Render) | Server Secret | Local, Production | Configured | Required for Admin SDK | Yes | Service account client email for Firebase Admin credential generation. | Checked by Firebase Admin `cert()` initialization. |
| 21 | `FIREBASE_PRIVATE_KEY` | Backend (Render) | Server Secret | Local, Production | Configured | Required for Admin SDK | Yes | PEM-encoded RSA private key for server-to-server Firebase attestation. | Server converts `\n` literals and verifies certificate format on boot. |
| 22 | `EMAIL_USER` | Backend (Render) | Server Secret | Local, Production | Configured | Optional (Email Relay) | Yes | Gmail / SMTP relay account for automated passkey and registration alerts. | Verify `sendVerificationEmail` resolves with status object. |
| 23 | `EMAIL_PASS` | Backend (Render) | Server Secret | Local, Production | Configured | Optional (Email Relay) | Yes | App password or SMTP secret for transactional notifications. | Handled via try/catch; email delivery failure falls back gracefully. |
| 24 | `APPS_SCRIPT_URL` | Backend (Render) | Server Secret | Local, Production | Configured | Optional | Yes | External Google Sheets / Apps Script webhook for spreadsheet sync. | Verifies spreadsheet append without blocking core database transaction. |
| 25 | `APPS_SCRIPT_SECRET`| Backend (Render) | Server Secret | Local, Production | Configured | Optional | Yes | Webhook verification token for Apps Script endpoint. | Tested via mock or manual trigger. |
| 26 | `ADMIN_NOTIFICATION_EMAIL`| Backend (Render) | Server Config | Local, Production | Configured | Optional | Yes | Recipient address for administrative alerts and payment reviews. | Checks notification logging in `server/services/email.js`. |
| 27 | `IMAGEKIT_PUBLIC_KEY`| Backend (Render) | Server Config | Local, Production | Configured | Optional (Media Storage) | Yes | Public authentication key for ImageKit CDN banner image uploads. | Verifies client-side signature generation. |
| 28 | `IMAGEKIT_PRIVATE_KEY`| Backend (Render)| Server Secret | Local, Production | Configured | Optional (Media Storage) | Yes | Secret signing key for ImageKit upload tokens. Forbidden in frontend. | GridFS handles sensitive files; ImageKit handles public banners only. |
| 29 | `IMAGEKIT_URL_ENDPOINT`| Backend (Render)| Server Config | Local, Production | Configured | Optional (Media Storage) | Yes | CDN URL endpoint for image optimization and delivery. | Validates asset URLs prepend endpoint. |

---

## 3. Environment Segregation Matrix

| Service Environment | Accessible Variables | Forbidden Variables | Enforced Restrictions |
|----------------------|----------------------|---------------------|-----------------------|
| **Vercel Production Frontend** | `VITE_API_URL`, `VITE_FIREBASE_*` | `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `FIREBASE_PRIVATE_KEY`, `EMAIL_*` | Client bundle inspection confirms zero server secrets; CSP & security headers prevent leakage. |
| **Vercel Preview Deployments** | `VITE_API_URL`, `VITE_FIREBASE_*` | Any production database destructive access keys | Render CORS strictly validates project origin regex (`^https://codesrijan(-[a-z0-9-]+)?\.vercel\.app$`). |
| **Render Production Backend** | All Backend Server Secrets & Configs | Direct client DOM tokens | Environment variables stored in encrypted Render vault; never printed in logs or HTTP responses. |
| **Local Development** | `.env.local` / `server/.env` | Live participant production secrets | Mock/test credentials used; `.env` excluded from version control via `.gitignore`. |

---

## 4. Secret Sanitization & Safe Handling Policy
1. **Zero Secret Printing:** No log statement, audit artifact, or debugging endpoint may output cleartext passwords, tokens, private keys, or MongoDB URIs.
2. **Git Exclusions:** `.gitignore` enforces exclusion of:
   - `.env`, `.env.*`, `server/.env`
   - `server/serviceAccountKey.json`, `server/*.tmp`
   - `backups/` and all database snapshot files.
3. **Frontend Artifact Verification:** `npm run build` inspects `.output/` chunks to ensure no `MONGO_URI`, `GROQ_API_KEY`, or `FIREBASE_PRIVATE_KEY` strings exist in client bundles.
