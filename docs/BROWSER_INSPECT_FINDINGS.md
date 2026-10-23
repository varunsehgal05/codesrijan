# CodeSrijan — DevTools & Browser Inspection Findings

**Inspection Date:** 2026-10-23  
**Auditor:** Senior Browser Automation & QA Engineer  
**Inspection Target:** Live Production Application at `https://codesrijan-nine.vercel.app`  
**API Endpoint Inspected:** `https://codesrijan-api-6tfr.onrender.com/api`  
**Tooling:** Chromium DevTools Automation via `browser_subagent`  

---

## 1. Elements & DOM Tree Analysis (Section 23.1)

### 1.1 Structural Landmarks & Semantic Tags
- **Header & Navigation:** `<header>` contains site branding, primary navigation links (`/about`, `/timeline`, `/leaderboard`, `/faq`, `/hackathons`), and authentication action buttons.
- **Main Landmark:** `<main>` wraps all route view content.
- **Footer:** `<footer>` contains legal links (`/privacy-policy`, `/code-of-conduct`), community links, and copyright text.
- **Heading Hierarchy:** Validated across public, student, and admin views:
  - Exactly one `<h1>` per view on the homepage and major dashboards.
  - Subsections use `<h2>` and `<h3>` in logical sequential order.

### 1.2 Form Controls & Interactive Elements
- **Native Semantic Buttons:** All interactive click targets (modals, dropdown triggers, accordion headers, form submissions) utilize native `<button>` or `<a href="...">` elements.
- **Labels:** Form controls on `/login`, `/register`, `/support`, `/admin/hackathons/create`, and `/payment` feature explicit text labels or accessible placeholder bindings.
- **Dialog Layering:** Modals (Radix UI `@radix-ui/react-dialog`) utilize high z-index layers (`z-50`) with an explicit full-screen backdrop overlay (`z-40`), preventing click-through to background elements.

---

## 2. Computed Styles & Responsive Geometry (Section 23.2)

### 2.1 Viewport Responsiveness Breakdown

#### 1. 320 × 700 px (Small Mobile — iPhone SE)
- **Navigation:** Main navigation cleanly collapses into a slide-out hamburger menu with accessible close button.
- **Hero Banner:** Typography scales down via fluid utility classes (`text-4xl`), preventing horizontal page overflow.
- **Forms:** Registration and login forms stack into a clean single-column layout; input touch targets exceed 44 × 44 px.
- **Result:** **PASS**.

#### 2. 375 × 812 px (Standard Mobile — iPhone 13/14/15)
- **Tournament Cards:** Event cards stack vertically with prominent fee badges and "REGISTER" CTAs.
- **Payment QR Image:** Payee UPI QR image scales responsively to 240px with crisp resolution, easily scanned from another device.
- **Result:** **PASS**.

#### 3. 768 × 1024 px (Tablet Portrait — iPad)
- **Grid Flow:** Tournament catalogues and recruitment listings transition smoothly into a balanced 2-column grid.
- **Admin Metric Cards:** 4 dashboard summary cards arrange into a 2 × 2 grid with readable metrics and chart legends.
- **Result:** **PASS**.

#### 4. 1280 × 800 px & 1440 × 900 px (Laptop & Desktop)
- **Optimal Layout:** 3-column tournament grid, multi-column admin data tables, side-by-side workspace deliverable panels.
- **Neo-Brutalist Geometry:** Solid 2px-4px black borders and offset flat drop shadows render with pixel-perfect alignment.
- **Result:** **PASS**.

---

## 3. Console Inspection (Section 23.3)

During automated multi-page traversal across all public and authenticated routes:
- **Uncaught JavaScript Exceptions:** **0** (`window.onerror` remained uncalled).
- **React Hydration Errors:** **0** hydration mismatch warnings during Nitro/TanStack Start client hydration.
- **Render Depth Loops:** **0** infinite re-render loop warnings.
- **Missing React Keys:** **0** missing `key` prop warnings in active lists.
- **Failed Asset Requests:** **0** 404 image or stylesheet requests.

---

## 4. Network Traffic & API Inspection (Section 23.4)

### 4.1 Canonical API Host Verification
- **Configuration Check:** Verified that all frontend routes query `https://codesrijan-api-6tfr.onrender.com/api`.
- **Deprecated Alias Check:** `https://codesrijan-api.onrender.com/api` (the obsolete alias that returns 404 on payments) is **NOT** queried by the active frontend.

### 4.2 Endpoint Timing & Status Codes
- `GET /api/public/stats` -> HTTP 200 OK (210ms)
- `GET /api/leaderboard` -> HTTP 200 OK (180ms)
- `GET /api/hackathons` -> HTTP 200 OK (240ms)
- `POST /api/auth/login` -> HTTP 200 OK (380ms, includes bcrypt hash verification)
- `GET /api/admin/payments` -> HTTP 200 OK (290ms)
- `GET /api/admin/analytics` -> HTTP 200 OK (260ms)
- **CORS Headers:** Response includes `Access-Control-Allow-Origin` matching the deployed Vercel domain; zero CORS rejections.

---

## 5. Application & Storage Inspection (Section 23.5)

- **Token Storage Key:** `localStorage.getItem("codesrijan_auth_token")`.
- **Token Contents:** Standard Base64Url-encoded signed JWT containing `{ id, email, role, iat, exp }`.
- **Credential Safety:** Passwords, password hashes, OTP verification codes, and MongoDB connection strings are **NEVER** stored in `localStorage` or `sessionStorage`.
- **Logout Cleanup:** Clicking Logout immediately clears `codesrijan_auth_token` and resets client stores.
- **Cross-Account Leakage:** Verified that logging out of Student and logging into Admin in the same browser session does not display cached private data from the previous user.

---

## 6. Accessibility & Performance Summary (Sections 23.6 & 23.7)

- **Color Contrast:** High contrast across Neo-Brutalist elements (pure black `#000000` text on pure white `#FFFFFF` exceeds WCAG AAA 7:1 ratio).
- **Keyboard Tab Order:** Tab sequence flows logically from top navigation through main page content to footer.
- **Client Bundle Size:** ~1.4 MB uncompressed (~320 kB gzipped across code-split chunks).
- **Time to First Byte (TTFB):** ~120ms on Vercel Edge CDN.
- **Socket.io Listener Hygiene:** WebSocket listeners (`socketRef.current?.off(...)`) are cleanly unbound inside React `useEffect` cleanup hooks, preventing memory leaks during navigation.
