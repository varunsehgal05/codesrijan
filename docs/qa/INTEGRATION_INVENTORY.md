# Integration inventory
Source snapshot: initial 35afbef, 2026-11-02. Status here is source discovery, not live verification.
- Frontend: React19/Vite8/TanStack Start and Router; Axios HTTP; React context store.
- API: Express5/Mongoose9; Socket.IO authentication/rooms.
- Database/storage: MongoDB and GridFS via server/services/storage.js. Live collection count not verified by schema enumeration.
- Identity: bcrypt password/session flow, Firebase client/admin optional paths; localStorage bearer credential.
- Email: server/services/email.js; relay/test dispatcher configuration. Production send intentionally not repeated.
- AI: server/services/srijanbot.js; Groq provider plus deterministic fallback, provider failure suite available.
- Push: server/services/fcm.js, actual provider availability unverified.
- Hosts: Vercel frontend, Render backend; deployed SHA requires fresh provider evidence.
- Certificate verification: inspect actual models/routes; QR/tampering workflow pending integration execution.
