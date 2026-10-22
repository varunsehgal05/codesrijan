# Final browser QA — 2026-10-23

Local changes, not yet deployed:
- Mobile collapsed SrijanBot help is in document flow below the page, preventing registration-field overlap. Open panel dimensions fit the viewport. Input/button names and keyboard focus are explicit. Launcher stays disabled until hydration completes, preventing lost early clicks on server-rendered markup.
- Guest admin and problem-route guards now navigate in effects after session initialization. Reproduction before fix: admin stayed on clearance screen and problems never reached login. Replacing render-time Navigate components resolved both route hangs in the affected browser run. No maximum-update-depth warning itself was captured; do not claim the historical warning's full root cause is conclusively established.
- Leaderboard test uses a deterministic empty-collection API fixture and asserts GLOBAL LEADERBOARD plus the empty-state. Current component hardcodes isVisible=true; the CLASSIFIED hidden branch is unreachable and publishing controls are not validated.
- Chat socket handshake now includes the existing stored auth token for the backend socket authorization fix.

## Evidence

Admin login form regressions: **3 passed**, 10.2 seconds. Mock API tests verify email and password transmission, admin destination /admin, student destination /dashboard, and invalid-credential display. Firebase identity endpoint is deliberately mocked as unavailable to exercise Express fallback. Only isolated fake fixture credentials/tokens are used.

Responsive regression captures: actual Chromium contexts at **375×812** and **1280×800**, keyboard focus/Enter opening, input bounding box within viewport, close control, no uncaught page errors or update-depth console warnings. Four screenshots visually inspected:
- artifacts/screenshots/final-register-375.png
- artifacts/screenshots/final-help-375.png
- artifacts/screenshots/final-register-1280.png
- artifacts/screenshots/final-help-1280.png

Mobile collapsed control is below the footer. Users scroll to reach it; opening overlays the page intentionally and closing returns the control. Quick suggestions scroll horizontally inside the bounded panel. No forms were submitted or production records changed.

21st deterministic review: **0 errors, 0 warnings, 1 pre-existing hardcoded-color suggestion**.

Historical attempts during this task: initial sandbox run blocked all five public navigations; escalated localhost attempts timed out. First clean run completed 4 passed/4 failed. After hydration-ready launcher, 6 passed/2 failed (guest redirect hangs). These are superseded by the post-guard-fix run, reported below. Local API localhost:5001 was unavailable; public store requests were refused. The leaderboard assertion uses its explicit fixture. Authentication journeys above are mocked browser regressions, not claims of live authenticated end-to-end completion.

Two existing untracked regression error-context files were temporarily removed by Playwright's default output cleanup. Both were restored byte-for-byte from the existing playwright-report/data archives and additionally preserved in artifacts/recovered-original-qa. Subsequent runs use isolated artifacts output directories.

Final post-guard-fix run: **8 passed (1.2 minutes)**: five public tests plus two responsive help tests and guest admin/payment authorization navigation. Combined with login regressions: **11 browser tests passed** across the two completed runs. No remaining failures in these scoped suites. This does not validate all authenticated student/admin journeys.
