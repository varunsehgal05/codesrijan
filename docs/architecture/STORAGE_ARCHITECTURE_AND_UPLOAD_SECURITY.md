# CODESRIJAN — STORAGE ARCHITECTURE AND UPLOAD SECURITY

**Scope:** File uploads, media storage, cryptographic credentials, and upload security controls.  
**Budget Enforcement:** $0.00 / Month (Leveraging MongoDB Atlas Free Tier & GridFS without paid third-party dependencies).  

---

## 1. MEDIA STORAGE INVENTORY

| Asset Category | Storage Mechanism | Format Constraints | Size Limit | Access Control |
|:---|:---|:---|:---|:---|
| **Hackathon Cover Banner** | Clean Data URL / GridFS | PNG, JPG, WebP | Max 5MB (1200×630px recommended) | Public Read; Admin Write |
| **Problem Specification Docs** | MongoDB GridFS (`fs.files`) | PDF, DOC, DOCX | Max 15MB | Authenticated (Squad required) |
| **Official UPI Payment QR** | Clean Data URL / GridFS | PNG, JPG, WebP | Max 2MB (500×500px square) | Registered Operatives & Admin |
| **Payment Proof Screenshots** | Clean Data URL / GridFS | PNG, JPG, PDF | Max 5MB | Uploader & Admin Only |
| **Official Certificates** | MongoDB GridFS (`certificates`) | PDF, PNG, JPG | Max 10MB | Recipient Operative & Admin |
| **Operative Avatars** | Sanitized Data URL / SVG | PNG, JPG, SVG | Max 1MB | Public Read; Owner Write |

---

## 2. SECURITY CONTROLS & VALIDATION

### 2.1 Server-Side MIME Validation
All upload handlers in `server/server.js` inspect both declared `Content-Type` headers and the underlying buffer signature to prevent executable file uploads (e.g. `.exe`, `.bat`, `.sh`, `.php`).

### 2.2 Client-Side Safeguards
Before reading files into memory, React components (`admin.hackathons.tsx`, `certificates.tsx`) enforce strict dimension and file size checks:
```typescript
if (file.size > 5 * 1024 * 1024) {
    toast.error("Cover banner exceeds 5MB limit.");
    return;
}
```

### 2.3 Acceptance Test: Paid-Event QR Persistence
1. Admin opens `/admin/hackathons` and clicks `+ CREATE HACKATHON`.
2. Admin proceeds to Step 4 (Registration Policy & Payment QR).
3. Admin selects "Paid Admission" and uploads an authentic UPI QR image (`Recommended: 500 × 500 px • Max 2MB`).
4. Instant live preview renders in the participant mockup canvas.
5. Admin clicks "Save Draft" or "Next Step".
6. Browser reloads or navigates away.
7. Upon inspecting the event or participant payment view, the exact persisted QR code is retrieved from MongoDB and displayed accurately.
