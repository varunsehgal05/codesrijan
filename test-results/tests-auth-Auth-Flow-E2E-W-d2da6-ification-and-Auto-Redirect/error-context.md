# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> Auth Flow E2E (With Backdoor) >> Student Registration, OTP Verification, and Auto-Redirect
- Location: tests\auth.spec.ts:7:3

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
    39 × waiting for element to be visible, enabled and stable
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
        - textbox "0" [ref=e22]
        - textbox "0" [ref=e23]
        - textbox "0" [ref=e24]
        - textbox "0" [ref=e25]
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
  30 |     await otpInputs.nth(0).focus();
  31 |     await page.keyboard.type(otp, { delay: 50 });
  32 |     await page.waitForTimeout(100);
  33 |     
> 34 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  35 |     
  36 |     // 5. Verify auto-redirect to workspace for student
  37 |     await page.waitForURL('**/workspace');
  38 |     await expect(page.locator('h1').first()).toContainText('Workspace');
  39 |   });
  40 | 
  41 |   test('Admin Registration, OTP, and Dashboard', async ({ page }) => {
  42 |     await page.goto(`${URL}/register`);
  43 |     
  44 |     const adminEmail = `admin.qa.${Date.now()}@codesrijan.test`;
  45 |     
  46 |     await page.fill('input[placeholder="John"]', 'QA Auto Admin');
  47 |     await page.fill('input[type="email"]', adminEmail);
  48 |     await page.fill('input[type="password"]', 'TestPass123!');
  49 |     await page.fill('input[placeholder="Institute of Tech"]', 'HQ');
  50 |     await page.fill('input[placeholder="CS"]', 'CS');
  51 |     await page.fill('input[placeholder="3"]', '3');
  52 |     await page.click('button:has-text("GENERATE IDENTITY")');
  53 |     await page.waitForURL('**/auth/otp**');
  54 |     
  55 |     const otpInputs = page.locator('input[type="text"]');
  56 |     const otp = '123456';
  57 |     await otpInputs.nth(0).focus();
  58 |     await page.keyboard.type(otp, { delay: 50 });
  59 |     await page.waitForTimeout(100);
  60 |     
  61 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
  62 |     
  63 |     // Admin should auto-redirect to /admin
  64 |     await page.waitForURL('**/admin');
  65 |     await expect(page.locator('h1').first()).toContainText('Dashboard');
  66 |   });
  67 | 
  68 | });
  69 | 
```