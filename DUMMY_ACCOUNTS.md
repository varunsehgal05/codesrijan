# 🔑 CodeSrijan - System Account Credentials & Dummy Accounts

> **Environment**: Production / Staging Sync (MongoDB Atlas & Firebase Auth)  
> **Last Updated**: October 6, 2026

---

## 👥 Provisioned Dummy Hacker Accounts (6 Accounts)

All accounts below have `role: "student"`, `accountStatus: "active"`, and `emailVerified: true`.

| # | User ID | Display Name | Email Address | Account Password | Role | College / Institute |
|:-:|:--------|:-------------|:--------------|:-----------------|:----:|:-------------------|
| **1** | `usr-dummy-1791245675645-476` | Cyber Hacker One | `hacker1@codesrijan.com` | `DummyHacker101!` | `student` | IIT Delhi |
| **2** | `usr-dummy-1791245675909-487` | Code Samurai Two | `hacker2@codesrijan.com` | `DummyHacker102!` | `student` | IIT Bombay |
| **3** | `usr-dummy-1791245676178-519` | Byte Ninja Three | `hacker3@codesrijan.com` | `DummyHacker303!` | `student` | BITS Pilani |
| **4** | `usr-dummy-1791245676440-183` | Algo Spectre Four | `hacker4@codesrijan.com` | `DummyHacker104!` | `student` | DTU Delhi |
| **5** | `usr-dummy-1791245676717-360` | Matrix Maven Five | `hacker5@codesrijan.com` | `DummyHacker105!` | `student` | IIIT Hyderabad |
| **6** | `usr-dummy-1791245677019-834` | Quantum Dev Six | `hacker6@codesrijan.com` | `DummyHacker106!` | `student` | NSUT Delhi |

---

## 👑 Master System Accounts

| Role | Target Route | Email Address | Master Password | Clearances |
|:-----|:-------------|:--------------|:----------------|:-----------|
| **Admin** | `/admin` | `admin@codesrijan.com` | `CodeSrijan99!` | Admin Control Center, User Management, Ticket Overrides |
| **Student** | `/workspace` | `student@codesrijan.com` | `HackerStudent99!` | Full Workspace Access, Hackathon Registration |

---

## 🛠️ Verification & API Integration
- **Auth Endpoint**: `POST /api/auth/login`
- **Password Recovery**: `POST /api/auth/forgot-password` & `POST /api/auth/reset-password`
- **Email Dispatch Transporter**: Gmail SMTP (`codesrijan@gmail.com`)
