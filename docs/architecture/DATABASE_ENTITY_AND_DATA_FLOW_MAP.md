# CODESRIJAN — DATABASE ENTITY AND DATA FLOW MAP

**Database Cluster:** MongoDB Atlas Free Tier (`codesrijan-cluster.mrckx43.mongodb.net`)  
**Primary Keyspace:** `codesrijan`  
**ODM:** Mongoose v8.x with strict schema validation  

---

## 1. PRIMARY ENTITY DEFINITIONS & SCHEMAS

### 1.1 `users` Collection
- **Authoritative Source:** Server authentication controller (`/api/auth`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `usr-admin-master`, `usr-student-master`
  - `email` (String, unique, lowercase, trimmed)
  - `passwordHash` (String): bcrypt hash (salt 10)
  - `role` (String, enum): `admin` | `student` | `judge` | `mentor`
  - `isVerified` (Boolean): email verification status
  - `friends` (Array of Strings): list of linked user IDs
  - `status` (String): `active` | `banned`

### 1.2 `hackathons` Collection
- **Authoritative Source:** Admin Hackathons controller (`/api/admin/hackathons`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `hack-free-1792862581267`
  - `name` / `title` (String): Display name of competition
  - `status` (String, enum): `draft` | `registration_open` | `active` | `completed`
  - `entryType` (String): `free` | `paid`
  - `fee` (Number): Entry fee in INR (0 for free, 100 for paid)
  - `bannerUrl` (String): Cover image data URL or GridFS link
  - `qrImageUrl` (String): Official UPI QR code data URL
  - `problemStatements` (Array of Subdocuments): Track-slotted problem directives with attachments
  - `rubric` (Object): Evaluation weightings (Innovation, Technical, Execution, Presentation)

### 1.3 `teams` Collection
- **Authoritative Source:** Team service (`/api/teams`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `t-1791540495510`
  - `name` (String, unique per hackathon)
  - `hackathonId` (String): Reference to parent hackathon
  - `leaderId` (String): Reference to squad leader user ID
  - `memberIds` (Array of Strings): Enrolled member user IDs (Max 4 slots)
  - `problemId` (String, nullable): Locked problem directive ID
  - `status` (String): `forming` | `locked` | `disqualified`

### 1.4 `registrations` Collection
- **Authoritative Source:** Registration controller (`/api/hackathons/:id/register`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `reg-1792862581267`
  - `userId` (String): Operative ID
  - `hackathonId` (String): Event ID
  - `entryType` (String): `free` | `paid`
  - `paymentStatus` (String): `not_required` | `pending` | `payment_under_review` | `verified` | `rejected`
  - `transactionId` (String, optional): UPI transaction UTR reference
  - `paymentProofUrl` (String, optional): Uploaded receipt screenshot

### 1.5 `certificates` Collection
- **Authoritative Source:** Admin Certificate controller (`/api/admin/certificates/upload`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `cert-1793264673512`
  - `userId` (String): Recipient operative ID
  - `title` (String): Certificate accolade title
  - `category` (String): `excellence` | `participation` | `winner` | `special`
  - `fileData` (String): Base64 or GridFS reference to official credential
  - `sha256Hash` (String): Cryptographic proof of authenticity
  - `issuedAt` (Date): Timestamp of dispatch

### 1.6 `supporttickets` & `conversations` Collection
- **Authoritative Source:** Support desk service (`/api/support`)
- **Key Fields:**
  - `id` (String, unique indexed): e.g. `tkt-sos-mr-1793090405980`
  - `userId` (String): Requester operative ID
  - `conversationId` (String): Unique channel link (`conv-sup-tkt-...`)
  - `status` (String, enum): `open` | `in_progress` | `resolved` | `closed`
  - `priority` (String): `low` | `medium` | `high` | `urgent`
  - `subject` (String): Problem summary / SOS alert

---

## 2. PRODUCTION INVARIANTS & INTEGRITY RULES

1. **User Invariant:** Strictly 8 user accounts maintained in production (1 Admin, 1 Student, 6 Dummy Hackers). No rogue account creations permitted.
2. **Hackathon Invariant:** Exactly 2 hackathons maintained in MongoDB Atlas (1 Free Edition, 1 Paid Edition).
3. **Quorum Boundary:** Squad enrollment is capped at exactly 4 operatives per team.
4. **Ownership Gating:** Problem directive locking is restricted strictly to the designated `leaderId` of an eligible squad.
