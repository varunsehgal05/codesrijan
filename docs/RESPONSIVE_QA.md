# Registration responsive QA

Date: 2026-10-23. Target: local frontend `http://localhost:5174/register`, guest, first registration step, Chromium. Real browser viewport sizes were set per context and confirmed through `window.innerWidth/innerHeight`. No fields were filled, no form was submitted and no production record was created.

- **375 × 812: PASS for horizontal overflow and uncaught page errors.** Measured viewport 375 × 812; document clientWidth 375, document scrollWidth 375, body scrollWidth 375, full document height 1551. Captured page errors: none. The form becomes one column, navigation collapses to a menu icon, and the footer stacks. Screenshot: [mobile](../artifacts/screenshots/register-375x812.png).
- **1280 × 800: PASS for horizontal overflow and uncaught page errors.** Measured viewport 1280 × 800; document clientWidth 1280, document scrollWidth 1280, body scrollWidth 1280, full document height 1215. Captured page errors: none. Form and footer retain their desktop arrangements. Screenshot: [desktop](../artifacts/screenshots/register-1280x800.png).

Both full-page screenshots were visually inspected. Mobile step labels truncate within their bounded cards; the fixed help widget partially overlaps the college input at the initial viewport position. These observations do not cause horizontal overflow, but the help widget may obstruct touch interaction in that area and warrants follow-up. No design changes were made during this QA pass.

Raw measurements: [register-measurements.json](../artifacts/screenshots/register-measurements.json). The temporary capture script was removed after execution. This verifies only the initial registration screen at two sizes; step two, validation, dropdown operation, keyboard navigation, server errors, submission, OTP and real-device behavior are **NOT TESTED** by this pass.
