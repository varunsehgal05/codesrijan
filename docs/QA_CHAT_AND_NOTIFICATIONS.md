# CodeSrijan — Real-Time Chat & Communications Audit

**Audit Date:** 2026-10-23  
**Lead QA Automation Engineer:** Antigravity Real-Time Communications Tester  
**Scope:** Socket.io WebSocket Layer, Direct Messaging, Team Rooms, Support Channels, In-App Notifications, and Email Relay Infrastructure  

---

## 1. Real-Time Chat Architecture & Socket.io Lifecycle

### 1.1 Connection & Handshake Authentication
- **Protocol:** Socket.io v4 over WebSocket with polling fallback.
- **Handshake Verification:** `server/server.js:3000` requires client to provide signed JWT in `socket.handshake.auth.token`.
- **Session Revocation Guard:** Realtime handshake verifies that the associated session token is active and not revoked (`revokedAt == null`).
- **Denial Cases Verified:**
  - Connection without token: Connection dropped immediately.
  - Connection with forged/expired token: Connection dropped with authentication error.
  - Connection with revoked session token: Connection dropped.
  - All verified in regression suite `server/test-security-local.mjs` (test case *"realtime connection rejects missing credentials"*).

---

## 2. Channel Types & Room Isolation

CodeSrijan implements four distinct conversation types:
```
1. direct   ──> 1-on-1 private messaging between two operatives
2. team     ──> Scoped exclusively to active members of an aligned squad
3. support  ──> Scoped to ticket author and administrators
4. group    ──> Multi-user channels
```

### 2.1 Cross-Team Room Authorization (`CHAT-011`, `CHAT-012`)
- **Server Enforcement:** In `server/server.js:2564`:
  ```javascript
  if (req.user.role !== 'admin') {
      const isParticipant = conv.participantIds && conv.participantIds.includes(req.user.id);
      let isTeamMember = false;
      if (conv.teamId) {
          const team = await Team.findOne({ id: conv.teamId, memberIds: req.user.id });
          if (team) isTeamMember = true;
      }
      if (!isParticipant && !isTeamMember) {
          return res.status(403).json({ message: "Access Denied." });
      }
  }
  ```
- **Observed Behavior:** If an operative attempts to listen or broadcast to a squad channel where they are not in `team.memberIds`, the server rejects with HTTP 403 Forbidden.

---

## 3. Message Validation & Defect Remediation (`BUG-CHAT-001`)

### 3.1 Defect Discovery (`CHAT-005`)
- During API boundary testing, submitting `{ message: "   " }` (whitespace-only) to `POST /api/conversations/:id/messages` was previously accepted by the backend, creating blank message documents with empty bubbles in the chat UI.
- While the client-side code in `src/routes/chat.tsx` had `if (!inputText.trim()) return;`, direct API calls bypassed this check.

### 3.2 Remediation Applied
In `server/server.js:2557`, server-side validation was added:
```javascript
const { message, attachments, replyTo } = req.body;
if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: "Message content cannot be blank." });
}
```

### 3.3 Retest Verification
- Submitting empty or whitespace-only messages now returns HTTP 400: `{"message":"Message content cannot be blank."}`.
- Status: **PASS (Remediated locally)**.

---

## 4. In-App Notification Center (`/api/notifications`)

### 4.1 Schema & Delivery
- **Model:** `Notification` in `server/models/index.js:362`:
  - `userId: String` (recipient identifier)
  - `title: String`
  - `message: String`
  - `type: 'team_invite' | 'join_request' | 'system' | 'evaluation' | 'mentor'`
  - `relatedId: String`
  - `isRead: Boolean` (defaults to false)

### 4.2 Lifecycle Verification
1. **Trigger:** Dispatched automatically upon squad invite, join request, tournament registration, and payment status update.
2. **Recipient Isolation (`NOTIFY-002`):** Student A's events never dispatch notifications to Student B unless explicitly targeted.
3. **Read Status Toggle (`NOTIFY-004`):**
   - Client calls `PATCH /api/notifications/:id/read`.
   - Notification updates to `isRead: true`.
   - Verified in isolated test harness `test_audit_journeys.mjs`.

---

## 5. Email Notification Relay & Google Apps Script Infrastructure

### 5.1 Architecture & Hosting Budget ($0/Month)
- Rather than introducing paid email services (such as Resend or SendGrid), CodeSrijan uses a zero-cost HTTPS relay backed by Google Apps Script `MailApp.sendEmail`.
- Outgoing communication is signed using HMAC-SHA256 with timestamp verification to prevent tampering or replay attacks.

### 5.2 Security & Idempotency Safeguards Verified
1. **HMAC Signature Validation:** Requests to relay require valid `X-CodeSrijan-Signature` matching `crypto.createHmac('sha256', secret).update(body).digest('hex')`.
2. **Replay Protection:** Timestamps older than 300 seconds are rejected.
3. **HTML Escaping:** User-supplied inputs (names, tournament titles, rejection feedback) are strictly HTML-escaped before insertion into email templates (`test_payment_notifications.mjs`).
4. **Credential Isolation:** Verification codes and reset links are delivered securely; database connection strings and JWT secrets are never included.
