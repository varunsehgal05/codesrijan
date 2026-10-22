# Final dependency review

Reviewed 2026-10-23 (Asia/Calcutta).

Frontend: npm reported four high findings through Firebase/Firestore's pinned @grpc/grpc-js 1.9.16. Added a narrowly scoped same-major override to patched 1.13.6, addressing GHSA-m9gg-hp2v-232j and GHSA-f596-whhp-79r4 without downgrading Firebase. Installation completed and npm reported zero vulnerabilities. Application imports Firebase app/auth only; no Firestore imports were found.

Backend: compatible npm audit fix completed, but npm still reports two moderate findings: uuid <11.1.1 and its dependent gaxios6.7.1 (GHSA-w5hq-g745-h8pq). Dependency path: firebase-admin14.5.0 -> @google-cloud/storage8.2.0 -> gaxios6.7.1 -> uuid9.0.1. The installed gaxios code invokes uuid.v4() with no arguments for multipart boundaries. The advisory affects v3/v5/v6 with a supplied buffer; this call does not reach that operation. Repository Firebase Admin imports are app/auth, with no storage call found. This is a documented residual advisory, not a zero-vulnerability claim. No forced Firebase downgrade or cross-major uuid override was applied. Recheck when upstream storage/gaxios releases replace uuid9.

Manifests and lockfiles retain existing versions except the grpc override and npm's compatible lockfile normalization. Production deployment and authenticated runtime verification remain separate release gates.

Validation: npx tsc --noEmit passed after the override. Production build was started; final build result is recorded in the release report by the coordinating agent.

Final production build: npm run build passed with exit code 0. Complete captured output: artifacts/final-gates-build.txt.
