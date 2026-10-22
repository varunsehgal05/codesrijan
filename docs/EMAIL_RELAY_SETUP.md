# Email relay setup

See [the maintained relay guide](../google-apps-script/README.md) for configuration and redeployment. The backend uses HTTPS Apps Script MailApp for payment-review notifications; no paid provider is needed.

The notification destination is exclusively `ADMIN_NOTIFICATION_EMAIL` in backend configuration and matching Script Properties. `FRONTEND_URL` supplies the real `/admin/payments` link. Student body fields cannot select the recipient, subject or HTML. The fixed template is `payment_review_notification`.

Proof persistence precedes email dispatch. An atomic registration state change prevents concurrent retries from sending twice. Outcomes are stored as `pending`, `sent`, or `failed`; delivery failure does not roll back the payment queue. A rejected proof can be resubmitted and generate one new notification. An ambiguous delivery must be reconciled before manual retry; no automatic resend worker was added.

Verification levels must remain separate: local template/authentication tests, backend dispatch, relay acceptance, MailApp acceptance, and actual inbox delivery. No real inbox delivery has been verified during this assessment.

Google currently documents 100 email recipients/day for consumer accounts, with per-user quotas resetting 24 hours after the first request. Source: https://developers.google.com/apps-script/guides/services/quotas (checked 2026-10-23). The actual remaining account allowance requires authenticated inspection; it has not been verified.

## Verified deployment

The existing Apps Script URL now runs version 4. Explicit Utilities.Charset.UTF_8 is required when signing non-ASCII event/team names; omitting it caused a reproducible live signature mismatch. Unicode authentication and actual inbox delivery to the user-selected codesrijan@gmail.com were verified. See REAL_NOTIFICATION_RESULT.md. The backend and Script Properties now contain matching recipient/frontend configuration names. No secrets were recorded in this guide.
