# Source discrepancies — 2026-11-02
- Original 267-ID checklist is in the user's separate ChatGPT workspace and awaits attachment. Do not recreate IDs. Group counts in the request sum to 267; exact coverage cannot be mapped yet.
- Actual package manifests use React 19, Express 5 and React context store.tsx; architecture notes saying React18/Express4/Zustand are stale.
- Client stores bearer credentials in localStorage; do not claim HttpOnly cookie/CSRF protections without implementation.
- Old final-local.spec.ts assumes a fixed OTP and email-prefix admin creation. Do not restore those bypasses or accept that test as current security proof.
- Existing mentor-command-center loads global /teams, rather than assigned squads; dedicated judge-command-center absent at initial HEAD. Assignment authorization is being implemented server-side.
- Canonical -6tfr API from source differs from the alias in the supplied architecture; live endpoint verification pending.
- Schema model counts do not establish actual live MongoDB collection count.
- Existing user-edited product-owner-discovery documents are preserved.

Correction after targeted route discovery: initial source has no src/routes/rules.tsx. The production404 is a missing route, not proven deployment drift. Local /rules now redirects to the existing /code-of-conduct; browser verification pending.
