# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> Auth Flow E2E (With Backdoor) >> Admin Registration, OTP, and Dashboard
- Location: tests\auth.spec.ts:42:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("AUTHORIZE OVERRIDE")')
    - locator resolved to <button disabled class="w-full text-pure-white py-4 font-label-caps text-lg brutal-border brutal-shadow transition-all duration-200 cursor-pointer bg-surface-variant">AUTHORIZE OVERRIDE</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    40 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - navigation [ref=e3]:
    - generic [ref=e4]:
      - link "CodeSrijan" [ref=e5] [cursor=pointer]:
        - /url: /
      - link "About Platform" [ref=e7] [cursor=pointer]:
        - /url: /about
      - generic [ref=e8]:
        - link "Login" [ref=e9] [cursor=pointer]:
          - /url: /login
        - link "Register Now" [ref=e10] [cursor=pointer]:
          - /url: /register
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Identity Config" [level=1] [ref=e14]
      - generic [ref=e15]: fingerprint
    - generic [ref=e16]:
      - heading "VERIFY EMAIL" [level=2] [ref=e17]
      - paragraph [ref=e18]: Enter the 6-digit confirmation code sent to your email to activate your account.
      - generic [ref=e19]:
        - textbox "0" [ref=e20]
        - textbox "0" [ref=e21]
        - textbox "0" [ref=e22]: "3"
        - textbox "0" [ref=e23]: "4"
        - textbox "0" [ref=e24]: "5"
        - textbox "0" [active] [ref=e25]: "6"
      - button "AUTHORIZE OVERRIDE" [disabled] [ref=e26] [cursor=pointer]
      - button "Re-transmit Code" [ref=e28] [cursor=pointer]
  - contentinfo [ref=e29]:
    - generic [ref=e30]: CodeSrijan
    - generic [ref=e31]:
      - link "Sponsors" [ref=e32] [cursor=pointer]:
        - /url: /sponsors
      - link "Privacy Policy" [ref=e33] [cursor=pointer]:
        - /url: /privacy-policy
      - link "Code of Conduct" [ref=e34] [cursor=pointer]:
        - /url: /code-of-conduct
    - generic [ref=e35]: © 2026 CodeSrijan. Built for the community.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const URL = 'https://codesrijan-nine.vercel.app';
  4  | 
  5  | test.describe('Auth Flow E2E (With Backdoor)', () => {
  6  | 
  7  |   test('Student Registration, OTP Verification, and Auto-Redirect', async ({ page }) => {
  8  |     // 1. Go to register
  9  |     await page.goto(`${URL}/register`);
  10 |     
  11 |     // Generate a unique test email
  12 |     const uniqueEmail = `student.qa.${Date.now()}@codesrijan.test`;
  13 |     
  14 |     // 2. Fill registration form
  15 |     await page.fill('input[placeholder="John"]', 'QA Auto Student');
  16 |     await page.fill('input[type="email"]', uniqueEmail);
  17 |     await page.fill('input[type="password"]', 'TestPass123!');
  18 |     await page.fill('input[placeholder="Institute of Tech"]', 'QA Institute');
  19 |     await page.fill('input[placeholder="CS"]', 'CS');
  20 |     await page.fill('input[placeholder="3"]', '3');
  21 |     await page.click('button:has-text("GENERATE IDENTITY")');
  22 |     // 3. Wait for OTP page
  23 |     await page.waitForURL('**/auth/otp**');
  24 |     
  25 |     // 4. Enter backdoor OTP
  26 |     const otpInputs = page.locator('input[type="text"]');
  27 |     await expect(otpInputs).toHaveCount(6);
  28 |     
  29 |     const otp = '123456';
  30 |     for (let i = 0; i < 6; i++) {
  31 |         await otpInputs.nth(i).fill(otp[i]);
  32 |         await page.waitForTimeout(50); // allow react state to settle
  33 |     }
  34 |     
  35 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
  36 |     
  37 |     // 5. Verify auto-redirect to workspace for student
  38 |     await page.waitForURL('**/workspace');
  39 |     await expect(page.locator('h1').first()).toContainText('Workspace');
  40 |   });
  41 | 
  42 |   test('Admin Registration, OTP, and Dashboard', async ({ page }) => {
  43 |     await page.goto(`${URL}/register`);
  44 |     
  45 |     const adminEmail = `admin.qa.${Date.now()}@codesrijan.test`;
  46 |     
  47 |     await page.fill('input[placeholder="John"]', 'QA Auto Admin');
  48 |     await page.fill('input[type="email"]', adminEmail);
  49 |     await page.fill('input[type="password"]', 'TestPass123!');
  50 |     await page.fill('input[placeholder="Institute of Tech"]', 'HQ');
  51 |     await page.fill('input[placeholder="CS"]', 'CS');
  52 |     await page.fill('input[placeholder="3"]', '3');
  53 |     await page.click('button:has-text("GENERATE IDENTITY")');
  54 |     await page.waitForURL('**/auth/otp**');
  55 |     
  56 |     const otpInputs = page.locator('input[type="text"]');
  57 |     const otp = '123456';
  58 |     for (let i = 0; i < 6; i++) {
  59 |         await otpInputs.nth(i).fill(otp[i]);
  60 |         await page.waitForTimeout(50); // allow react state to settle
  61 |     }
  62 |     
> 63 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  64 |     
  65 |     // Admin should auto-redirect to /admin
  66 |     await page.waitForURL('**/admin');
  67 |     await expect(page.locator('h1').first()).toContainText('Dashboard');
  68 |   });
  69 | 
  70 | });
  71 | 
```