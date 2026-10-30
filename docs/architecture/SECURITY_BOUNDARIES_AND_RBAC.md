# CODESRIJAN — SECURITY BOUNDARIES AND ROLE-BASED ACCESS CONTROL (RBAC)

**Core Principle:** Defense in depth. The frontend displays tailored user interfaces based on role claims, but the backend API strictly authorizes every mutation and query independently.

---

## 1. ROLE MATRIX & PRIVILEGE ENFORCEMENT

| Operation / Sector | Student Operative | Squad Leader | Judge | Mentor | Administrator |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Browse Hackathons & Directives** | Read | Read | Read | Read | Read |
| **Form Squad / Invite Operatives** | Allowed | Allowed | Denied | Denied | Admin View Only |
| **Lock Problem Directive** | Denied | Allowed | Denied | Denied | Override / Inspect |
| **Inspect Secret Directives** | Denied | Denied | Read | Read | Allowed |
| **Grade Submissions & Rubric** | Denied | Denied | Allowed | Denied | Allowed |
| **Upload Official Certificates** | Denied | Denied | Denied | Denied | Allowed |
| **Manage Roster, Ban, Disqualify** | Denied | Denied | Denied | Denied | Allowed |
| **Audit Payment Proofs** | Denied | Denied | Denied | Denied | Allowed |
| **Create Support Tickets** | Allowed | Allowed | Allowed | Allowed | Denied (Direct Console) |
| **Dispatch SOS Mentor Alert** | Denied | Allowed | Denied | Denied | Monitor |

---

## 2. API GATEWAY SECURITY IMPLEMENTATION

### 2.1 `requireAuth` Middleware
```javascript
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authentication required." });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token expired or invalid." });
    }
};
```

### 2.2 `requireRole` Middleware
```javascript
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access forbidden: insufficient clearance." });
        }
        next();
    };
};
```

### 2.3 User Data Isolation
Non-admin endpoints (such as `GET /api/support`, `GET /api/certificates/my`, and `GET /api/teams/my`) enforce that queries are scoped strictly to `userId: req.user.id`, preventing Insecure Direct Object References (IDOR).
