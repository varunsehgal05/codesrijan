import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';
const TEAM_NAME = `AgentSquad-${Date.now()}`;

test.describe('E2E Team Creation and Join Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. Student creates a team', async ({ page }) => {
    await page.goto(`${URL}/login`);
    await page.fill('input[type="text"]', 'student@codesrijan.com');
    await page.fill('input[type="password"]', 'HackerStudent99!');
    await page.click('button:has-text("INITIALIZE SESSION")');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    
    // Go to recruitment
    await page.goto(`${URL}/recruitment`);
    await page.click('button:has-text("CREATE")');
    
    // Fill team name
    await page.fill('input[name="name"]', TEAM_NAME);
    await page.fill('textarea[name="description"]', 'Agent squad testing flow');
    
    // Click deploy squad
    await page.click('button:has-text("DEPLOY SQUAD")');
    await page.waitForTimeout(4000);
    
    // Logout
    await page.goto(`${URL}/dashboard`);
    await page.click('button:has-text("Terminate Session")');
    await page.waitForTimeout(2000);
  });

  test('2. Hacker1 requests to join', async ({ page }) => {
    await page.goto(`${URL}/login`);
    // Need to use the placeholder since type="email" might be placeholder="system_override@codesrijan.com"
    await page.fill('input[placeholder*="codesrijan.com"]', 'hacker1@codesrijan.com');
    await page.fill('input[type="password"]', 'DummyHacker101!');
    await page.click('button:has-text("INITIALIZE SESSION")');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    
    // Go to recruitment
    await page.goto(`${URL}/recruitment`);
    await page.waitForTimeout(2000);
    
    // Click Transmit Join Signature for our team
    const teamCard = page.locator(`article:has-text("${TEAM_NAME}")`);
    if (await teamCard.isVisible()) {
        await teamCard.locator('button:has-text("Transmit Join Signature")').click();
        await page.waitForTimeout(2000);
    }
    
    // Logout
    await page.goto(`${URL}/dashboard`);
    await page.click('button:has-text("Terminate Session")');
    await page.waitForTimeout(2000);
  });

  test('3. Student verifies request', async ({ page }) => {
    await page.goto(`${URL}/login`);
    await page.fill('input[placeholder*="codesrijan.com"]', 'student@codesrijan.com');
    await page.fill('input[type="password"]', 'HackerStudent99!');
    await page.click('button:has-text("INITIALIZE SESSION")');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    
    await page.waitForTimeout(3000);
    const pendingText = page.locator('text=Pending Join Signatures');
    await expect(pendingText).toBeVisible({ timeout: 10000 });
  });
});
