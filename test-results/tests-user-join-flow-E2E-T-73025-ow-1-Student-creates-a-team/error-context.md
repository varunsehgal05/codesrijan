# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\user-join-flow.spec.ts >> E2E Team Creation and Join Flow >> 1. Student creates a team
- Location: tests\user-join-flow.spec.ts:9:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("CREATE")')

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - navigation [ref=f1e3]:
      - generic [ref=f1e4]:
        - link "CodeSrijan" [ref=f1e5] [cursor=pointer]:
          - /url: /
        - generic [ref=f1e6]:
          - link "trophy Hackathons" [ref=f1e7] [cursor=pointer]:
            - /url: /hackathons
            - generic [ref=f1e8]: trophy
            - text: Hackathons
          - link "Problems" [ref=f1e9] [cursor=pointer]:
            - /url: /problems
          - link "Recruitment" [ref=f1e10] [cursor=pointer]:
            - /url: /recruitment
          - link "Sponsors" [ref=f1e11] [cursor=pointer]:
            - /url: /sponsors
          - link "Announcements" [ref=f1e12] [cursor=pointer]:
            - /url: /announcements
          - link "Leaderboard" [ref=f1e13] [cursor=pointer]:
            - /url: /leaderboard
          - link "Comms" [ref=f1e14] [cursor=pointer]:
            - /url: /chat
          - link "Help & Support" [ref=f1e15] [cursor=pointer]:
            - /url: /support
        - link "Go to Dashboard" [ref=f1e17] [cursor=pointer]:
          - /url: /dashboard
    - generic [ref=f1e19]:
      - generic [ref=f1e20]: gpp_maybe
      - heading "ACCESS RESTRICTED" [level=2] [ref=f1e21]
      - paragraph [ref=f1e22]: You must establish or enlist in a Squad before accessing visual workspace sectors.
      - link "RETURN TO DASHBOARD" [ref=f1e23] [cursor=pointer]:
        - /url: /dashboard
    - contentinfo [ref=f1e24]:
      - generic [ref=f1e25]: CodeSrijan
      - generic [ref=f1e26]:
        - link "Sponsors" [ref=f1e27] [cursor=pointer]:
          - /url: /sponsors
        - link "Privacy Policy" [ref=f1e28] [cursor=pointer]:
          - /url: /privacy-policy
        - link "Code of Conduct" [ref=f1e29] [cursor=pointer]:
          - /url: /code-of-conduct
      - generic [ref=f1e30]: © 2026 CodeSrijan. Built for the community.
  - button "Help smart_toy" [ref=f1e32]:
    - generic [ref=f1e33]: Help
    - generic [ref=f1e34]: smart_toy
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const URL = 'https://codesrijan-nine.vercel.app';
  4  | const TEAM_NAME = `AgentSquad-${Date.now()}`;
  5  | 
  6  | test.describe('E2E Team Creation and Join Flow', () => {
  7  |   test.describe.configure({ mode: 'serial' });
  8  | 
  9  |   test('1. Student creates a team', async ({ page }) => {
  10 |     await page.goto(`${URL}/login`);
  11 |     await page.fill('input[type="text"]', 'student@codesrijan.com');
  12 |     await page.fill('input[type="password"]', 'HackerStudent99!');
  13 |     await page.click('button:has-text("INITIALIZE SESSION")');
  14 |     await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  15 |     
  16 |     // Go to recruitment
  17 |     await page.goto(`${URL}/recruitment`);
> 18 |     await page.click('button:has-text("CREATE")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  19 |     
  20 |     // Fill team name
  21 |     await page.fill('input[name="name"]', TEAM_NAME);
  22 |     await page.fill('textarea[name="description"]', 'Agent squad testing flow');
  23 |     
  24 |     // Click deploy squad
  25 |     await page.click('button:has-text("DEPLOY SQUAD")');
  26 |     await page.waitForTimeout(4000);
  27 |     
  28 |     // Logout
  29 |     await page.goto(`${URL}/dashboard`);
  30 |     await page.click('button:has-text("Terminate Session")');
  31 |     await page.waitForTimeout(2000);
  32 |   });
  33 | 
  34 |   test('2. Hacker1 requests to join', async ({ page }) => {
  35 |     await page.goto(`${URL}/login`);
  36 |     // Need to use the placeholder since type="email" might be placeholder="system_override@codesrijan.com"
  37 |     await page.fill('input[placeholder*="codesrijan.com"]', 'hacker1@codesrijan.com');
  38 |     await page.fill('input[type="password"]', 'DummyHacker101!');
  39 |     await page.click('button:has-text("INITIALIZE SESSION")');
  40 |     await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  41 |     
  42 |     // Go to recruitment
  43 |     await page.goto(`${URL}/recruitment`);
  44 |     await page.waitForTimeout(2000);
  45 |     
  46 |     // Click Transmit Join Signature for our team
  47 |     const teamCard = page.locator(`article:has-text("${TEAM_NAME}")`);
  48 |     if (await teamCard.isVisible()) {
  49 |         await teamCard.locator('button:has-text("Transmit Join Signature")').click();
  50 |         await page.waitForTimeout(2000);
  51 |     }
  52 |     
  53 |     // Logout
  54 |     await page.goto(`${URL}/dashboard`);
  55 |     await page.click('button:has-text("Terminate Session")');
  56 |     await page.waitForTimeout(2000);
  57 |   });
  58 | 
  59 |   test('3. Student verifies request', async ({ page }) => {
  60 |     await page.goto(`${URL}/login`);
  61 |     await page.fill('input[placeholder*="codesrijan.com"]', 'student@codesrijan.com');
  62 |     await page.fill('input[type="password"]', 'HackerStudent99!');
  63 |     await page.click('button:has-text("INITIALIZE SESSION")');
  64 |     await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  65 |     
  66 |     await page.waitForTimeout(3000);
  67 |     const pendingText = page.locator('text=Pending Join Signatures');
  68 |     await expect(pendingText).toBeVisible({ timeout: 10000 });
  69 |   });
  70 | });
  71 | 
```