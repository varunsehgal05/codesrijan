# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\final-local.spec.ts >> Live Production E2E Suite >> 1. Student Flow: Login -> Enroll -> Create Team -> Submit
- Location: tests\final-local.spec.ts:49:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e2]:
    - navigation [ref=f3e3]:
      - generic [ref=f3e4]:
        - link "CodeSrijan" [ref=f3e5] [cursor=pointer]:
          - /url: /
        - generic [ref=f3e6]:
          - link "Problems" [ref=f3e7] [cursor=pointer]:
            - /url: /problems
          - link "Recruitment" [ref=f3e8] [cursor=pointer]:
            - /url: /recruitment
          - link "Announcements" [ref=f3e9] [cursor=pointer]:
            - /url: /announcements
          - link "Leaderboard" [ref=f3e10] [cursor=pointer]:
            - /url: /leaderboard
          - link "Comms" [ref=f3e11] [cursor=pointer]:
            - /url: /chat
          - link "Help & Support" [ref=f3e12] [cursor=pointer]:
            - /url: /support
        - link "Go to Dashboard" [ref=f3e14] [cursor=pointer]:
          - /url: /dashboard
    - main [ref=f3e16]:
      - button "arrow_back GO BACK" [ref=f3e17] [cursor=pointer]:
        - generic [ref=f3e18]: arrow_back
        - text: GO BACK
      - generic [ref=f3e19]:
        - heading "Verification Center" [level=1] [ref=f3e20]
        - paragraph [ref=f3e21]: Cryptographically signed proof of participation. Generate your diploma after submitting your hackathon build, or verify an existing certificate ID to ensure authenticity.
      - generic [ref=f3e22]:
        - generic [ref=f3e23]:
          - generic [ref=f3e24]:
            - generic [ref=f3e25]: workspace_premium
            - heading "Claim Your Diploma" [level=2] [ref=f3e27]
            - paragraph [ref=f3e28]: Your certificate is permanently unlocked once your team leader submits the final repository link and demo video.
          - generic [ref=f3e29]:
            - paragraph [ref=f3e30]: "Status:"
            - paragraph [ref=f3e31]:
              - generic [ref=f3e32]: cancel
              - text: Awaiting Project Submission
          - button "download Generate PDF" [disabled] [ref=f3e33]:
            - generic [ref=f3e34]: download
            - text: Generate PDF
        - generic [ref=f3e35]:
          - generic [ref=f3e36]:
            - generic [ref=f3e37]: verified
            - heading "Verify Authenticity" [level=2] [ref=f3e39]
            - paragraph [ref=f3e40]: CodeSrijan issues unique identification hashes to all issued diplomas. Enter a Certificate ID below to confirm its validity and recipient.
          - generic [ref=f3e41]:
            - textbox "e.g. CS-0943-AB" [ref=f3e42]
            - button "Scan Database" [ref=f3e43]
    - contentinfo [ref=f3e44]:
      - generic [ref=f3e45]: CodeSrijan
      - generic [ref=f3e46]:
        - link "Sponsors" [ref=f3e47] [cursor=pointer]:
          - /url: /sponsors
        - link "Privacy Policy" [ref=f3e48] [cursor=pointer]:
          - /url: /privacy-policy
        - link "Code of Conduct" [ref=f3e49] [cursor=pointer]:
          - /url: /code-of-conduct
      - generic [ref=f3e50]: © 2026 CodeSrijan. Built for the community.
  - button "Help smart_toy" [ref=f3e52]:
    - generic [ref=f3e53]: Help
    - generic [ref=f3e54]: smart_toy
```

# Test source

```ts
  15  |       
  16  |       // Register Student
  17  |       let res = await req.post(`${API_URL}/auth/register`, {
  18  |           data: {
  19  |               name: "QA Live Student",
  20  |               email: studentEmail,
  21  |               password: "TestPass123!",
  22  |               college: "QA Institute",
  23  |               branch: "CS",
  24  |               year: "3"
  25  |           }
  26  |       });
  27  |       let data = await res.json();
  28  |       await req.post(`${API_URL}/auth/verify-email`, {
  29  |           data: { userId: data.userId, code: "123456" }
  30  |       });
  31  |       
  32  |       // Register Admin
  33  |       res = await req.post(`${API_URL}/auth/register`, {
  34  |           data: {
  35  |               name: "QA Live Admin",
  36  |               email: adminEmail,
  37  |               password: "TestPass123!",
  38  |               college: "QA Institute",
  39  |               branch: "CS",
  40  |               year: "3"
  41  |           }
  42  |       });
  43  |       data = await res.json();
  44  |       await req.post(`${API_URL}/auth/verify-email`, {
  45  |           data: { userId: data.userId, code: "123456" }
  46  |       });
  47  |   });
  48  | 
  49  |   test('1. Student Flow: Login -> Enroll -> Create Team -> Submit', async ({ page }) => {
  50  |     await page.goto(`${URL}/login`);
  51  |     
  52  |     await page.fill('input[placeholder="system_override@codesrijan.com"]', studentEmail);
  53  |     await page.fill('input[type="password"]', 'TestPass123!');
  54  |     await page.click('button:has-text("INITIALIZE SESSION")');
  55  |     
  56  |     // Student login redirects to workspace (or stays on login if error)
  57  |     await page.waitForURL('**/workspace', { timeout: 30000 }).catch(() => {});
  58  |     
  59  |     // Enroll in hackathon via UI navigation
  60  |     await page.goto(`${URL}/problems`); // Safe page
  61  |     await page.waitForTimeout(2000);
  62  |     await page.click('text=Go to Dashboard');
  63  |     await page.waitForTimeout(2000);
  64  |     
  65  |     const enrollBtn = page.locator('button:has-text("ENROLL IN THE MAINFRAME")');
  66  |     if (await enrollBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  67  |         await enrollBtn.click();
  68  |         await page.waitForTimeout(2000);
  69  |         
  70  |         const confirmBtn = page.locator('button:has-text("Confirm Enrollment")');
  71  |         if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  72  |             const yearSelect = page.locator('select');
  73  |             if (await yearSelect.isVisible()) await yearSelect.selectOption('3');
  74  |             await confirmBtn.click();
  75  |             await page.waitForTimeout(3000);
  76  |         }
  77  |     }
  78  |     
  79  |     // Create Team via URL
  80  |     await page.goto(`${URL}/squad`);
  81  |     await page.waitForTimeout(3000);
  82  |     
  83  |     const createInput = page.locator('input[placeholder="Team Name"]');
  84  |     if (await createInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  85  |         await createInput.fill(teamName);
  86  |         await page.locator('select').first().selectOption({ index: 1 });
  87  |         await page.waitForTimeout(500);
  88  |         await page.locator('select').nth(1).selectOption({ index: 1 });
  89  |         await page.waitForTimeout(500);
  90  |         await page.click('button:has-text("CREATE SQUAD")');
  91  |         await page.waitForTimeout(4000);
  92  |     }
  93  |     
  94  |     // We should automatically be on workspace now. If not, try to go there via UI
  95  |     if (!page.url().includes('workspace')) {
  96  |         await page.click('text=Go to Dashboard').catch(() => {});
  97  |         await page.waitForTimeout(1000);
  98  |         await page.click('text=WORKSPACE').catch(() => {});
  99  |         await page.waitForTimeout(2000);
  100 |     }
  101 |     
  102 |     // Check if we have the payload form
  103 |     const githubInput = page.locator('input[placeholder="https://github.com/..."]');
  104 |     if (await githubInput.isVisible({ timeout: 5000 }).catch(() => false)) {
  105 |         // Final Submission
  106 |         await githubInput.fill('https://github.com/qa/repo');
  107 |         await page.fill('input[placeholder="https://youtube.com/..."]', 'https://demo.com');
  108 |         await page.click('button:has-text("STORE LINKS TO CLUSTER")');
  109 |         await page.waitForTimeout(2000);
  110 |         await page.click('button:has-text("INITIATE LOCKDOWN")');
  111 |         
  112 |         await page.waitForTimeout(3000);
  113 |         await expect(page.locator('text=STRUCTURE LOCKED')).toBeVisible();
  114 |     } else {
> 115 |         expect(true).toBe(false); // Fail if we didn't get to workspace
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  116 |     }
  117 |   });
  118 | 
  119 |   test('2. Admin Flow: Login -> Disqualify Team', async ({ page }) => {
  120 |     await page.goto(`${URL}/login`);
  121 |     await page.fill('input[placeholder="system_override@codesrijan.com"]', adminEmail);
  122 |     await page.fill('input[type="password"]', 'TestPass123!');
  123 |     await page.click('button:has-text("INITIALIZE SESSION")');
  124 |     
  125 |     await page.waitForURL('**/admin', { timeout: 30000 }).catch(() => {});
  126 |     
  127 |     // Navigate directly to teams via URL or UI
  128 |     await page.goto(`${URL}/admin/teams`);
  129 |     await page.waitForTimeout(3000);
  130 |     
  131 |     await page.click(`tr:has-text("${teamName}") >> button:has-text("DISQUALIFY")`);
  132 |     
  133 |     // Handle dialog
  134 |     await page.fill('input[placeholder*="Reason"]', 'Violated guidelines');
  135 |     await page.click('button:has-text("CONFIRM DISQUALIFICATION")');
  136 |     
  137 |     await page.waitForTimeout(2000);
  138 |     
  139 |     // Verify it says Disqualified
  140 |     const row = page.locator(`tr:has-text("${teamName}")`);
  141 |     await expect(row.locator('text=DISQUALIFIED')).toBeVisible();
  142 |   });
  143 | });
  144 | 
```