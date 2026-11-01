# Public execution — 2026-11-02

Environment: https://codesrijan-nine.vercel.app. Browser: installed Chrome through existing Playwright. Independent fresh anonymous browser context, 1440×1000 desktop and 390×844 mobile viewport. No production data mutations, form submissions, messages, emails, registrations or uploads were performed.

Evidence: `artifacts/master-qa-20261102/public-auth/results.json` and `public-*.png`. Run `node tests/qa-public-auth.cjs` with network-enabled execution; ordinary restricted execution failed DNS. The resumed auth attempt preserves completed public observations. Initial public navigation at `/mentor` stalled; the subsequent attempt was bounded and stopped to release the browser workstream. No result is inferred for unfinished pages.

## Build identity

Observed frontend script: `/assets/index-BJ65Zkvl.js`. Vercel request identifier: `bom1::iad1::8v7dv-1793569775932-5fbbcdbf11a3`. No frontend commit was exposed. `localCommit` in JSON identifies the checkout only. **Deployed commit: BLOCKED / unconfirmed**; do not equate source HEAD to production.

Observed live API origin: `https://codesrijan-api-6tfr.onrender.com/api`, which differs from the attached request's older `https://codesrijan-api.onrender.com/api`. Actual frontend requests establish the origin used by the tested deployment.

## Route observations

PASS here means only successful route rendering, not complete workflow acceptance. Fourteen routes returned HTTP 200 with nonempty page content. Across the fifteen completed observations, there were no uncaught page errors, no completed image elements with zero natural width at snapshot time, and no horizontal document overflow at 390px. This does not measure browser console messages, images loaded after scrolling, all breakpoints, accessibility, or external destination availability.

| Route | HTTP | Route smoke | Rendered heading |
|---|---:|---|---|
| `/` | 200 | PASS | Build.Break.Innovate. |
| `/about` | 200 | PASS | Unleash Your Potential |
| `/timeline` | 200 | PASS | Event Timeline |
| `/rules` | 404 | **FAIL** | 404 / Page not found |
| `/faq` | 200 | PASS | Frequently Asked Questions |
| `/sponsors` | 200 | PASS | Platform Partners & Backers |
| `/gallery` | 200 | PASS | Event Highlights |
| `/highlights` | 200 | PASS | Gallery & Highlights |
| `/host-event` | 200 | PASS | HOST A HACKATHON |
| `/community` | 200 | PASS | CodeSrijan Community |
| `/code-of-conduct` | 200 | PASS | Code of Conduct |
| `/privacy-policy` | 200 | PASS | Privacy Policy |
| `/hackathons` | 200 | PASS | HACKATHONS HUB |
| `/problems` | 200 | PASS | PROBLEM DIRECTIVES & ARENAS |
| `/leaderboard` | 200 | PASS | GLOBAL LEADERBOARD |
| `/mentor` | — | BLOCKED | Browser operation stalled; no completed result |
| `/announcements` | — | NOT RUN | No completed observation in this context |

Live public data requests returned 200 for hackathons, problems, timeline, FAQ, sponsors, gallery, leaderboard, system status and public stats where recorded in JSON. Anonymous global store requests to `/users`, `/teams`, and `/evaluations` returned 401 repeatedly. These denials are correct authorization responses, but unnecessary protected fetches on public pages should be reviewed in the store workstream. No response bodies containing personal data were persisted.

## Confirmed defect

Key: QA-PUBLIC-RULES-404 (defect key, not an invented catalogue test ID).

Severity: P2. Environment: live frontend, script fingerprint above; deployed commit unavailable. Account: anonymous. Preconditions: fresh context. Steps: open `/rules` directly. Expected: official rules route documented by both architecture references and present in local `src/routes/rules.tsx`. Actual: HTTP 404, visible "Page not found". Evidence: `public-rules.png`, JSON route status. Affected source: existing `src/routes/rules.tsx` / deployment route manifest. Cleanup: none. Status: OPEN — local route already exists, so a production deployment mismatch must be resolved before claiming this is fixed. No deployment was performed by this workstream.

## Source repairs handed to orchestrator

Corrected pre-existing strict TypeScript errors in `host-event.tsx`, `leaderboard.tsx`, and `sponsors.tsx`: update a problem draft through a functional array map; keep venue required inside the existing offline/hybrid render condition; type the merged leaderboard list explicitly; filter missing roster users with a type predicate; accept an absent optional logo value. Strict compiler settings remain enabled. Parent owns consolidated compilation/build verification. This report does not claim these source repairs are deployed or verified by the above live smoke run.

## Remaining scope

Form submission/persistence, host-event validation, FAQ interactions, filter behavior, external links, status badge correctness, empty/loading/error scenarios, full responsive matrix, and console inspection remain NOT RUN here. Source host-event submits `POST /api/hackathons`; it is not mailto-only, but persistence was not exercised on production. No fake records were added.

The 267-ID catalogue is not available in this workspace. The owner confirmed it resides in a separate `/mnt/data` ChatGPT workspace and will be attached later. These observed checks cannot be assigned authoritative catalogue IDs or counted as all 25 public acceptance tests.
