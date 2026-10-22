# Controlled admin notification delivery check — 23 October 2026

Command: `node server/verify-real-notification.js --send`

The script invoked the actual payment-proof HTTP handler against a temporary local MongoDB database. It read relay credentials only from ignored relay configuration files, fixed the recipient to the user-authorized administrator inbox, disabled SMTP, and sent exactly one request to the deployed Apps Script relay. No production application records were created or approved.

- Registration reference: `QA-ONLY-NO-PAYMENT-1792700176846`
- Event: `QA ONLY / NO PAYMENT — isolated notification delivery check`
- Expected fee: `0 INR`
- Payment-proof handler: HTTP `200`
- Disposable registration state: `payment_under_review`
- Notification outcome: `failed`
- Relay requests: `1`
- Relay acceptance: `false`
- Remaining quota: not returned
- Inbox delivery: not verified
- Process exit: `1`; HTTP server and temporary database closed.

The application correctly retained its queue record despite email failure. The service suppressed the raw relay error, so this first attempt did not capture a rejection reason. The delivery tool now allowlists known non-sensitive rejection reasons for any separately authorized future attempt. It has **not** been rerun automatically. Inspect relay deployment/configuration and inbox evidence before retrying; provider acceptance and actual inbox delivery remain unverified.

Without `--send`, the tool exits without creating a database or sending email. Every invocation with `--send` is a new explicitly authorized real delivery attempt; do not run it as part of routine regression tests.

## Follow-up diagnostic without email

`node server/diagnose-relay-no-send.js` read relay health and made exactly one signed request using the deliberately unsupported template `diagnostic_no_send`. It cannot reach MailApp dispatch because template rendering rejects that name.

- Relay online: `true`
- Remaining daily quota: `93`
- Clock difference: approximately `-1` second
- Signed response classification: `AUTHENTICATED_UNSUPPORTED_TEMPLATE`
- Email template used: `false`

This verifies the local relay URL, HMAC secret and timestamp against the current deployment. The earlier real-notification failure therefore needs payment-template-specific validation or dispatch investigation; authentication and exhausted quota are not supported explanations at diagnostic time. No real notification was retried.

Two further requests deliberately omitted the required `eventName`, guaranteeing template rejection without email dispatch. With the configured administrator recipient, the relay rejected the invalid template data as expected. With a deliberately wrong recipient, the relay returned the administrator-recipient restriction error. This proves the current deployed payment-template recipient guard executes; it distinguishes the new relay from an older relay that lacks that template. No valid payment notification was retried.

## Final verified delivery

The follow-up valid request failed with `Invalid cryptographic signature.`. A no-send comparison showed ASCII payloads authenticated while Unicode payloads failed. Explicit `Utilities.Charset.UTF_8` was added to the relay HMAC call, covered by a Unicode regression case, and deployed as version 4. The same no-send Unicode check then authenticated successfully.

The subsequent controlled actual-handler attempt succeeded: reference `QA-ONLY-NO-PAYMENT-1792707337208`, HTTP 200, persisted `payment_under_review`, notification `sent`, exactly one relay attempt, MailApp accepted, quota returned 94. All application records existed only in disposable local MongoDB and were removed when its process stopped; no production QA event or payment was created.

Independent Gmail UI verification found exactly one message for this reference in `codesrijan@gmail.com`, received 23 October 2026 at 03:45 IST. The opened message showed the clearly marked QA event, solo registration, expected fee 0 INR, reference, timestamp and correct `https://codesrijan-nine.vercel.app/admin/payments` link. No receipt URL, password, OTP or session token appeared. This establishes inbox delivery, not completion of the remaining production-data reconciliation or all role journeys.

Official charset API: https://developers.google.com/apps-script/reference/utilities/utilities#computeHmacSha256Signature(String,String,Charset)
