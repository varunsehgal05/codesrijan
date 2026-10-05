import { test, expect, request } from '@playwright/test';

const URL = 'https://codesrijan-nine.vercel.app';
const API_URL = 'https://codesrijan-api.onrender.com/api';

test.describe('Live Production E2E Suite', () => {
  test.describe.configure({ mode: 'serial' });

  let teamName = `LiveTeam-${Date.now()}`;
  let studentEmail = `student.live.${Date.now()}@codesrijan.test`;
  let adminEmail = `admin.live.${Date.now()}@codesrijan.test`; // must start with 'admin.' for admin role
  
  test.beforeAll(async () => {
      const req = await request.newContext();
      
      // Register Student
      let res = await req.post(`${API_URL}/auth/register`, {
          data: {
              name: "QA Live Student",
              email: studentEmail,
              password: "TestPass123!",
              college: "QA Institute",
              branch: "CS",
              year: "3"
          }
      });
      let data = await res.json();
      await req.post(`${API_URL}/auth/verify-email`, {
          data: { userId: data.userId, code: "123456" }
      });
      
      // Register Admin
      res = await req.post(`${API_URL}/auth/register`, {
          data: {
              name: "QA Live Admin",
              email: adminEmail,
              password: "TestPass123!",
              college: "QA Institute",
              branch: "CS",
              year: "3"
          }
      });
      data = await res.json();
      await req.post(`${API_URL}/auth/verify-email`, {
          data: { userId: data.userId, code: "123456" }
      });
  });

  test('1. Student Flow: Login -> Enroll -> Create Team -> Submit', async ({ page }) => {
    await page.goto(`${URL}/login`);
    
    await page.fill('input[placeholder="system_override@codesrijan.com"]', studentEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("INITIALIZE SESSION")');
    
    // Student login redirects to workspace (or stays on login if error)
    await page.waitForURL('**/workspace', { timeout: 30000 }).catch(() => {});
    
    // Enroll in hackathon via UI navigation
    await page.goto(`${URL}/problems`); // Safe page
    await page.waitForTimeout(2000);
    await page.click('text=Go to Dashboard');
    await page.waitForTimeout(2000);
    
    const enrollBtn = page.locator('button:has-text("ENROLL IN THE MAINFRAME")');
    if (await enrollBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await enrollBtn.click();
        await page.waitForTimeout(2000);
        
        const confirmBtn = page.locator('button:has-text("Confirm Enrollment")');
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            const yearSelect = page.locator('select');
            if (await yearSelect.isVisible()) await yearSelect.selectOption('3');
            await confirmBtn.click();
            await page.waitForTimeout(3000);
        }
    }
    
    // Create Team via URL
    await page.goto(`${URL}/squad`);
    await page.waitForTimeout(3000);
    
    const createInput = page.locator('input[placeholder="Team Name"]');
    if (await createInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createInput.fill(teamName);
        await page.locator('select').first().selectOption({ index: 1 });
        await page.waitForTimeout(500);
        await page.locator('select').nth(1).selectOption({ index: 1 });
        await page.waitForTimeout(500);
        await page.click('button:has-text("CREATE SQUAD")');
        await page.waitForTimeout(4000);
    }
    
    // We should automatically be on workspace now. If not, try to go there via UI
    if (!page.url().includes('workspace')) {
        await page.click('text=Go to Dashboard').catch(() => {});
        await page.waitForTimeout(1000);
        await page.click('text=WORKSPACE').catch(() => {});
        await page.waitForTimeout(2000);
    }
    
    // Check if we have the payload form
    const githubInput = page.locator('input[placeholder="https://github.com/..."]');
    if (await githubInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Final Submission
        await githubInput.fill('https://github.com/qa/repo');
        await page.fill('input[placeholder="https://youtube.com/..."]', 'https://demo.com');
        await page.click('button:has-text("STORE LINKS TO CLUSTER")');
        await page.waitForTimeout(2000);
        await page.click('button:has-text("INITIATE LOCKDOWN")');
        
        await page.waitForTimeout(3000);
        await expect(page.locator('text=STRUCTURE LOCKED')).toBeVisible();
    } else {
        expect(true).toBe(false); // Fail if we didn't get to workspace
    }
  });

  test('2. Admin Flow: Login -> Disqualify Team', async ({ page }) => {
    await page.goto(`${URL}/login`);
    await page.fill('input[placeholder="system_override@codesrijan.com"]', adminEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("INITIALIZE SESSION")');
    
    await page.waitForURL('**/admin', { timeout: 30000 }).catch(() => {});
    
    // Navigate directly to teams via URL or UI
    await page.goto(`${URL}/admin/teams`);
    await page.waitForTimeout(3000);
    
    await page.click(`tr:has-text("${teamName}") >> button:has-text("DISQUALIFY")`);
    
    // Handle dialog
    await page.fill('input[placeholder*="Reason"]', 'Violated guidelines');
    await page.click('button:has-text("CONFIRM DISQUALIFICATION")');
    
    await page.waitForTimeout(2000);
    
    // Verify it says Disqualified
    const row = page.locator(`tr:has-text("${teamName}")`);
    await expect(row.locator('text=DISQUALIFIED')).toBeVisible();
  });
});
