# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> Auth Flow E2E (With Backdoor) >> Admin Registration, OTP, and Dashboard
- Location: tests\auth.spec.ts:43:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/admin" until "load"
  navigated to "http://localhost:8080/login"
============================================================
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
    - generic [ref=e13] [cursor=pointer]:
      - link "arrow_back CodeSrijan Auth" [ref=e14]:
        - /url: /
        - generic [ref=e15]: arrow_back
        - text: CodeSrijan Auth
      - generic [ref=e16]: login
    - generic [ref=e17]:
      - button "arrow_back GO BACK" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: arrow_back
        - text: GO BACK
      - heading "Welcome Back" [level=1] [ref=e21]
      - paragraph [ref=e22]: ACCESS YOUR HACKER WORKSPACE
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]: Email Address / Hacker Handle
          - textbox "system_override@codesrijan.com" [ref=e26]
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Operation Password
            - link "Forgot?" [ref=e30] [cursor=pointer]:
              - /url: /auth/forgot-password
          - textbox "••••••••••••" [ref=e31]
        - button "INITIALIZE SESSION power_settings_new" [ref=e32]:
          - text: INITIALIZE SESSION
          - generic [ref=e33]: power_settings_new
      - paragraph [ref=e35]:
        - text: DON'T HAVE A SQUAD YET?
        - link "REGISTER NOW" [ref=e36] [cursor=pointer]:
          - /url: /register
  - contentinfo [ref=e37]:
    - generic [ref=e38]: CodeSrijan
    - generic [ref=e39]:
      - link "Sponsors" [ref=e40] [cursor=pointer]:
        - /url: /sponsors
      - link "Privacy Policy" [ref=e41] [cursor=pointer]:
        - /url: /privacy-policy
      - link "Code of Conduct" [ref=e42] [cursor=pointer]:
        - /url: /code-of-conduct
    - generic [ref=e43]: © 2026 CodeSrijan. Built for the community.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const URL = 'http://localhost:8080';
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
  31 |         await otpInputs.nth(i).focus();
  32 |         await page.keyboard.press(otp[i]);
  33 |     }
  34 |     await page.waitForTimeout(100);
  35 |     
  36 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
  37 |     
  38 |     // 5. Verify auto-redirect to workspace for student
  39 |     await page.waitForURL('**/workspace');
  40 |     await expect(page.locator('h1').first()).toContainText('Workspace');
  41 |   });
  42 | 
  43 |   test('Admin Registration, OTP, and Dashboard', async ({ page }) => {
  44 |     await page.goto(`${URL}/register`);
  45 |     
  46 |     const adminEmail = `admin.qa.${Date.now()}@codesrijan.test`;
  47 |     
  48 |     await page.fill('input[placeholder="John"]', 'QA Auto Admin');
  49 |     await page.fill('input[type="email"]', adminEmail);
  50 |     await page.fill('input[type="password"]', 'TestPass123!');
  51 |     await page.fill('input[placeholder="Institute of Tech"]', 'HQ');
  52 |     await page.fill('input[placeholder="CS"]', 'CS');
  53 |     await page.fill('input[placeholder="3"]', '3');
  54 |     await page.click('button:has-text("GENERATE IDENTITY")');
  55 |     await page.waitForURL('**/auth/otp**');
  56 |     
  57 |     const otpInputs = page.locator('input[type="text"]');
  58 |     const otp = '123456';
  59 |     for (let i = 0; i < 6; i++) {
  60 |         await otpInputs.nth(i).focus();
  61 |         await page.keyboard.press(otp[i]);
  62 |     }
  63 |     await page.waitForTimeout(100);
  64 |     await page.screenshot({ path: 'otp_admin_debug.png' });
  65 |     
  66 |     await page.click('button:has-text("AUTHORIZE OVERRIDE")');
  67 |     
  68 |     // Admin should auto-redirect to /admin
> 69 |     await page.waitForURL('**/admin');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  70 |     await expect(page.locator('h1').first()).toContainText('Dashboard');
  71 |   });
  72 | 
  73 | });
  74 | 
```