# CODESRIJAN — API AND INTEGRATION INVENTORY

Comprehensive reference of all public, authenticated, and administrative API endpoints exposed by the CodeSrijan canonical Express backend (`https://codesrijan-api-6tfr.onrender.com/api`).

---

## 1. PUBLIC ENDPOINTS

| HTTP Verb | Path | Purpose | Query / Body Params | Response Code |
|:---|:---|:---|:---|:---:|
| `GET` | `/health` | Ingress liveness & MongoDB connectivity probe. | None | 200 OK |
| `GET` | `/api/hackathons` | Public catalog of active competition arenas. | None | 200 OK |
| `GET` | `/api/hackathons/:id` | Full details for a single tournament arena. | `id` (URL param) | 200 OK |
| `GET` | `/api/announcements` | Global platform announcements and alerts. | None | 200 OK |
| `GET` | `/api/sponsors` | Corporate sponsor directory and local SVG logo paths. | None | 200 OK |
| `POST` | `/api/auth/register` | New operative registration & OTP dispatch. | `{ name, email, password, role }` | 201 Created |
| `POST` | `/api/auth/login` | Operative authentication & JWT issuance. | `{ email, password }` | 200 OK |
| `POST` | `/api/auth/verify-otp` | 6-digit verification code settlement. | `{ email, otp }` | 200 OK |
| `POST` | `/api/ai/chat` | SrijanBot AI assistance conversation endpoint. | `{ message, history }` | 200 OK |

---

## 2. AUTHENTICATED OPERATIVE ENDPOINTS (`requireAuth`)

| HTTP Verb | Path | Purpose | Headers Required | Response Code |
|:---|:---|:---|:---|:---:|
| `GET` | `/api/auth/me` | Fetch active operative profile dossier. | `Authorization: Bearer <JWT>` | 200 OK |
| `GET` | `/api/certificates/my` | Retrieve authenticated user's official certificates. | `Authorization: Bearer <JWT>` | 200 OK |
| `GET` | `/api/hackathons/:id/problems` | Challenge directives for enrolled event. | `Authorization: Bearer <JWT>` | 200 OK |
| `POST` | `/api/hackathons/:id/register` | Register operative for free or paid arena. | `Authorization: Bearer <JWT>` | 201 Created |
| `GET` | `/api/teams` | List matching squads for recruitment. | `Authorization: Bearer <JWT>` | 200 OK |
| `POST` | `/api/teams` | Create new squad allocation. | `Authorization: Bearer <JWT>` | 201 Created |
| `POST` | `/api/teams/:id/select-problem`| Lock directive for squad (Squad leader only). | `Authorization: Bearer <JWT>` | 200 OK |
| `GET` | `/api/support` | List user's active and resolved support tickets. | `Authorization: Bearer <JWT>` | 200 OK |
| `POST` | `/api/support/ticket` | Create new support transmission or SOS alert. | `Authorization: Bearer <JWT>` | 201 Created |
| `GET` | `/api/conversations` | Retrieve operative's active comm channels. | `Authorization: Bearer <JWT>` | 200 OK |

---

## 3. ADMINISTRATIVE ENDPOINTS (`requireAuth` + `requireRole(['admin'])`)

| HTTP Verb | Path | Purpose | Enforcement | Response Code |
|:---|:---|:---|:---|:---:|
| `GET` | `/api/admin/hackathons` | Administrative management catalog of events. | Admin Only | 200 OK |
| `POST` | `/api/admin/hackathons` | Author new hackathon arena via 5-step wizard. | Admin Only | 201 Created |
| `POST` | `/api/admin/certificates/upload`| Issue and upload official certificate. | Admin Only | 201 Created |
| `POST` | `/api/conversations/admin-team/:teamId`| Create official Admin-to-Squad channel. | Admin Only | 200 OK |
| `GET` | `/api/admin/support` | Global cross-tenant support ticketing stream. | Admin Only | 200 OK |
| `PATCH`| `/api/admin/support/ticket/:id`| Update ticket status, priority, or assign staff. | Admin Only | 200 OK |
| `GET` | `/api/admin/users` | Full platform operative roster with telemetry. | Admin Only | 200 OK |
| `POST` | `/api/admin/users/:id/ban` | Ban operative from hackathons and workspaces. | Admin Only | 200 OK |
| `POST` | `/api/admin/teams/:id/disqualify`| Disqualify squad from current tournament. | Admin Only | 200 OK |
| `POST` | `/api/admin/payments/:id/verify` | Approve participant payment proof. | Admin Only | 200 OK |
