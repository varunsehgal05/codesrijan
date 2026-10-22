# CODESRIJAN — ZERO-COST GOOGLE APPS SCRIPT EMAIL RELAY

## Overview
This Google Apps Script Web App functions as an authenticated HTTPS email relay for CodeSrijan. It eliminates the need for Resend or paid hosting, and bypasses Render Free's blocked outbound SMTP ports (25, 465, 587) by using Google's native `MailApp.sendEmail`.

## Security Architecture
- **HMAC-SHA256 Authenticated:** Every HTTP POST request requires an HMAC-SHA256 signature generated with a high-entropy shared secret.
- **Timestamp Expiry:** Requests older than 5 minutes are rejected.
- **Replay-Resistant Nonce:** Every request requires a unique nonce cached via Google's `CacheService` to prevent replay attacks.
- **Strict Template Whitelist:** Only predefined system templates (`verification_otp`, `welcome`, `password_reset`) can be sent. Arbitrary HTML or text injection is strictly prohibited.
- **Quota Protection:** Checks `MailApp.getRemainingDailyQuota()`. Consumer Gmail allows 100 emails/day; Google Workspace allows 1,500/day.

---

## 2-Minute Deployment Instructions

### 1. Create the Apps Script Project
1. Open [script.google.com](https://script.google.com/) while logged into the Google account designated to send CodeSrijan emails.
2. Click **New Project** and name it `CodeSrijan Email Relay`.
3. Replace the contents of `Code.gs` with the code in `google-apps-script/Code.gs`.

### 2. Configure the Shared Secret
1. In the Apps Script editor, click the **Gear icon (Project Settings)** on the left menu.
2. Scroll down to **Script Properties** and click **Add script property**.
3. Set:
   - **Property:** `CODESRIJAN_RELAY_SECRET`
   - **Value:** Generate a high-entropy string (e.g. 64 random characters, or run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
4. Click **Save script properties**.

### 3. Deploy as a Web App
1. At the top right of the editor, click **Deploy** &rarr; **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Configure:
   - **Description:** `Production Relay v1`
   - **Execute as:** `Me (your email address)`
   - **Who has access:** `Anyone` (Protected cryptographically via HMAC-SHA256)
4. Click **Deploy**.
5. Click **Authorize access** and select your Google account. (If Google shows "Google hasn't verified this app", click "Advanced" &rarr; "Go to CodeSrijan Email Relay (unsafe)" &rarr; "Allow").
6. Copy the resulting **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

### 4. Configure Render Environment Variables
In your Render Dashboard (`codesrijan-api` &rarr; **Environment**), add:
- `APPS_SCRIPT_URL` = `<Your Web App URL from step 3>`
- `APPS_SCRIPT_SECRET` = `<Your shared secret from step 2>`

The CodeSrijan backend will automatically detect these variables and route email dispatch via Google Apps Script HTTPS with HMAC-SHA256 verification.
