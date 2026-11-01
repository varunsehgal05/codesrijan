# Authentication execution — 2026-11-02

Scope: `/login`, `/register`, `/auth/otp`, `/auth/forgot-password`, `/auth/reset-password`, `/admin-login`, supplied Admin and Student browser login/session checks. Environment: live frontend. Browser: installed Chrome through existing Playwright. Public and authentication workstreams used separate fresh contexts; no authentication cookies were shared.

**Authentication acceptance: BLOCKED / not verified.** Network-enabled browser launch succeeded, but the bounded auth-only attempt could not locate an email input on live `/login` and ended with `locator.fill: Timeout 30000ms exceeded`. This is an execution blocker, not proof of a production authentication defect. No valid account login completed. No supplied password was entered in this attempt. The single unknown-identity attempt also stopped before submission because the input was unavailable.

Evidence: `artifacts/master-qa-20261102/public-auth/results.json` contains the exact sanitized final error and preserved public results; `tests/qa-public-auth.cjs` is the reproducible safe browser harness. No trace/HAR, request bodies, passwords, JWTs, session tokens, cookies, or authenticated screenshots are saved. The harness reads supplied credentials directly from the attachment into process memory when reached; credentials are not embedded in source.

| Required area | Status | Reason |
|---|---|---|
| Admin valid login and `/admin` redirect | BLOCKED | Browser credential form unavailable; no completed login |
| Student valid login and `/dashboard` redirect | BLOCKED | No completed credential session |
| Unknown-email rejection | BLOCKED | Email input wait timed out before submission |
| Wrong password / lockout | NOT RUN | Avoid repeatedly locking supplied production accounts |
| Anonymous auth-route rendering | BLOCKED | No completed saved route observations |
| Registration / duplicate registration | BLOCKED | Requires isolated database; production writes intentionally not exercised |
| OTP issuance / invalid / expired / resend / rate limit | BLOCKED | No isolated pending verification fixture; do not send production email |
| Universal OTP production bypass rejection | BLOCKED | Source reviewed, but no safe active verification fixture to prove deployed behavior |
| Forgot password / reset / single-use recovery | BLOCKED | Would send email or modify supplied identity; isolated fixture required |
| Logout / expiry / revocation | BLOCKED | No authenticated browser session established |
| Cookie security / token storage in deployment | BLOCKED | No authenticated response/session observed |
| Role spoofing / wrong-role browser access | BLOCKED | No authenticated session established |
| Dedicated Mentor/Judge role redirects | NOT RUN | Assigned role workstream owns implementation/isolated acceptance |

## Source evidence (not deployed acceptance)

At initial inspection, `src/lib/store.tsx` tries Firebase sign-in and falls back to Express `/auth/login`; it stores the resulting token in `localStorage` under `codesrijan_auth_token`. Logout removes that local item and disconnects the socket; the inspected client logout function does not invoke `/auth/sessions/revoke`. Backend source creates a random opaque session token, stores its SHA-256 hash, and sets a 24-hour expiry; this is not evidence that JWT/localStorage or HttpOnly-cookie claims in older architecture documents describe the current deployment.

`server/server.js` verification compares the submitted code using bcrypt against `EmailVerification.tokenHash`, checks expiry/attempt limits, and atomically consumes eligible verification records. No fixed `123456` branch was found in the inspected verification handler. **Production fixed-code bypass remains unverified**, because source inspection is insufficient to establish deployed behavior.

Initial `login.tsx` and `admin-login.tsx` routed non-admin identities to `/dashboard`; OTP success routed non-admin identities to `/workspace`. Parent's role implementation owns correcting and verifying the intended Student/Mentor/Judge destinations. This source observation must not be reported as a completed live role test.

## Safety and account coordination

No registration, OTP sends, recovery emails, password resets, role promotions, administrative writes, or account changes were performed. No QA objects were created. Admin reservation was explicitly released to the orchestrator when this attempt ended. Browser processes were stopped after bounded attempts. Production account state requires no cleanup from this workstream.

The authoritative 267-case ID catalogue is unavailable on this Windows workspace; the owner reports it exists in a separate `/mnt/data` workspace and will attach it. Do not map these rows to invented IDs or mark any of the 30 authentication acceptance cases passed.
