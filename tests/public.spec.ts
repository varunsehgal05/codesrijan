import { test, expect } from '@playwright/test';

const URL = process.env.QA_BASE_URL || 'http://localhost:5173';

test.describe('Public Website E2E Tests', () => {

  test('Homepage loads correctly without crashing', async ({ page }) => {
    await page.goto(URL);
    
    // Check main title
    await expect(page.locator('h1').first()).toContainText('Build.Break.Innovate.');
    // Verify navbar exists
    const navBar = page.locator('nav');
    await expect(navBar).toBeVisible();
  });

  test('Problems page requires authentication', async ({ page }) => {
    await page.goto(`${URL}/problems`, { waitUntil: "domcontentloaded" });
    await page.waitForURL('**/login*');
    await expect(page.locator('h1').first()).toContainText('Welcome Back');
  });

  test('Leaderboard page loads without errors', async ({ page }) => {
    await page.route("**/api/leaderboard", route => route.fulfill({ json: [] }));
    await page.goto(`${URL}/leaderboard`);
    await expect(page.locator('h1').first()).toContainText('GLOBAL LEADERBOARD');
    await expect(page.getByText('No evaluated payloads detected yet.')).toBeVisible();
  });

  test('Timeline and Rules display', async ({ page }) => {
    await page.goto(`${URL}/timeline`);
    await expect(page.locator('body')).toContainText('Timeline');

    await page.goto(`${URL}/about`);
    await expect(page.locator('h1').first()).toContainText('UnleashYour Potential');
  });

  test('Help and Support routing is protected for guests', async ({ page }) => {
    await page.goto(`${URL}/support`);
    // Shows an inline unauthorized message instead of redirecting
    await expect(page.locator('body')).toContainText('PLEASE AUTHENTICATE TO ACCESS SECURE COMM CHANNELS.');
  });
});
