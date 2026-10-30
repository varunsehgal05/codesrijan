# CODESRIJAN — ENVIRONMENT CONFIGURATION MATRIX

**Security Principle:** No secrets or raw credential strings are recorded in this documentation. This matrix documents environment variable names, expected formats, target environments, and their functional necessity.

---

## 1. BACKEND SERVICE CONFIGURATION (Render / `server/.env`)

| Variable Name | Environment | Purpose | Required / Optional | Secret Classification |
|:---|:---:|:---|:---:|:---:|
| `PORT` | Production & Local | Port on which Express server listens (default: `5001`). | Required | Standard Config |
| `NODE_ENV` | Production & Local | Environment identifier (`production` or `development`). | Required | Standard Config |
| `MONGO_URI` | Production & Local | MongoDB Atlas SRV connection string with credentials. | Required | Critical Secret |
| `JWT_SECRET` | Production & Local | Secret key for signing and verifying user session JWTs. | Required | Critical Secret |
| `GROQ_API_KEY` | Production & Local | API authentication token for Groq LLM inference. | Required for AI | High-Value Token |
| `APPS_SCRIPT_URL` | Production & Local | HTTPS URL of deployed Google Apps Script email relay. | Required for Email | Endpoint URL |
| `APPS_SCRIPT_SECRET` | Production & Local | Shared authentication secret for Google Apps Script Web App. | Required for Email | High-Value Token |
| `FIREBASE_PROJECT_ID` | Production & Local | Project identifier (`codesrijan-450d0`). | Required | Public ID |
| `FIREBASE_CLIENT_EMAIL`| Production & Local | Service account client email for Firebase Admin SDK. | Optional (App Check) | Credential |
| `FIREBASE_PRIVATE_KEY` | Production & Local | PEM-formatted private key for Firebase service account. | Optional (App Check) | Critical Secret |
| `FRONTEND_URL` | Production & Local | Origin domain allowed for CORS (`https://codesrijan-nine.vercel.app`).| Required | Standard Config |

---

## 2. FRONTEND CLIENT CONFIGURATION (Vercel / `.env`)

| Variable Name | Environment | Purpose | Required / Optional | Secret Classification |
|:---|:---:|:---|:---:|:---:|
| `VITE_API_URL` | Production & Local | Base canonical backend API URL (`https://codesrijan-api-6tfr.onrender.com/api`). | Required | Public URL |
| `VITE_FIREBASE_API_KEY`| Production & Local | Public client-side Firebase API key for phone verification & auth. | Optional | Public Key |
| `VITE_FIREBASE_PROJECT_ID`| Production & Local | Client Firebase project identifier (`codesrijan-450d0`). | Optional | Public ID |
| `VITE_APP_CHECK_KEY` | Production & Local | Public reCAPTCHA v3 or App Check client site key. | Optional | Public Site Key |
