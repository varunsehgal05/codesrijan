# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\auth.spec.ts >> Auth Flow E2E (With Backdoor) >> Admin Registration, OTP, and Dashboard
- Location: tests\auth.spec.ts:41:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/auth/otp**" until "load"
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
    - generic [ref=e13]:
      - link "arrow_back CodeSrijan Registration" [ref=e14] [cursor=pointer]:
        - /url: /
        - generic [ref=e15]: arrow_back
        - text: CodeSrijan Registration
      - generic [ref=e16]: person_add
    - generic [ref=e17]:
      - button "arrow_back GO BACK" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: arrow_back
        - text: GO BACK
      - heading "JOIN THE RESISTANCE" [level=1] [ref=e21]
      - paragraph [ref=e22]: Create your hacker profile and start building.
      - generic [ref=e23]:
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]: Given Name
            - textbox "John" [ref=e27]: QA Auto Admin
          - generic [ref=e28]:
            - generic [ref=e29]: Surname
            - textbox "Doe" [ref=e30]
        - generic [ref=e31]:
          - generic [ref=e32]: Preferred Hacker Handle
          - generic [ref=e33]:
            - generic [ref=e34]: "@"
            - textbox "phantom_coder" [ref=e35]
        - generic [ref=e36]:
          - generic [ref=e37]:
            - generic [ref=e38]: College
            - textbox "Institute of Tech" [ref=e39]: HQ
          - generic [ref=e40]:
            - generic [ref=e41]: Branch
            - textbox "CS" [active] [ref=e42]
          - generic [ref=e43]:
            - generic [ref=e44]: Year
            - textbox "3" [ref=e45]
        - generic [ref=e46]:
          - generic [ref=e47]: Secure Email
          - textbox "comm_link@codesrijan.com" [ref=e48]: admin.qa.1790991327144@codesrijan.test
        - generic [ref=e49]:
          - generic [ref=e50]: Password Matrix
          - textbox "Create a strong password" [ref=e51]: TestPass123!
        - button "GENERATE IDENTITY how_to_reg" [ref=e52]:
          - text: GENERATE IDENTITY
          - generic [ref=e53]: how_to_reg
      - paragraph [ref=e55]:
        - text: ALREADY DRAFTED?
        - link "INITIALIZE SESSION" [ref=e56] [cursor=pointer]:
          - /url: /login
  - contentinfo [ref=e57]:
    - generic [ref=e58]: CodeSrijan
    - generic [ref=e59]:
      - link "Sponsors" [ref=e60] [cursor=pointer]:
        - /url: /sponsors
      - link "Privacy Policy" [ref=e61] [cursor=pointer]:
        - /url: /privacy-policy
      - link "Code of Conduct" [ref=e62] [cursor=pointer]:
        - /url: /code-of-conduct
    - generic [ref=e63]: © 2026 CodeSrijan. Built for the community.
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
  32 |     }
  33 |     
  34 |     await page.click('button:has-text("GENERATE IDENTITY")');
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
  50 |     await page.click('button:has-text("GENERATE IDENTITY")');
> 51 |     await page.waitForURL('**/auth/otp**');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  52 |     
  53 |     const otpInputs = page.locator('input[type="text"]');
  54 |     const otp = '123456';
  55 |     for (let i = 0; i < 6; i++) {
  56 |         await otpInputs.nth(i).fill(otp[i]);
  57 |     }
  58 |     
  59 |     await page.click('button:has-text("GENERATE IDENTITY")');
  60 |     
  61 |     // Admin should auto-redirect to /admin
  62 |     await page.waitForURL('**/admin');
  63 |     await expect(page.locator('h1').first()).toContainText('Dashboard');
  64 |   });
  65 | 
  66 | });
  67 | 
```