import { test, expect } from '@playwright/test';

const URL = 'https://codesrijan-nine.vercel.app';

test.describe('Public Website E2E Tests', () => {

  test('Homepage loads correctly without crashing', async ({ page }) => {
    await page.goto(URL);
    
    // Check main title
    await expect(page.locator('h1').first()).toContainText('Build.Break.Innovate.');
    
    // Check navigation links
    const navBar = page.locator('nav');
    await expect(navBar.locator('text=Problems')).toBeVisible();
    await expect(navBar.locator('text=Leaderboard')).toBeVisible();
    await expect(navBar.locator('text=Comms')).toBeVisible();
  });

  test('Problems page requires authentication', async ({ page }) => {
    await page.goto(`${URL}/problems`);
    await page.waitForURL('**/login*');
    await expect(page.locator('h1').first()).toContainText('Welcome Back');
  });

  test('Leaderboard page loads without errors', async ({ page }) => {
    await page.goto(`${URL}/leaderboard`);
    await expect(page.locator('h1').first()).toContainText('CLASSIFIED STANDINGS');
  });

  test('Timeline and Rules display', async ({ page }) => {
    await page.goto(`${URL}/timeline`);
    await expect(page.locator('body')).toContainText('Timeline');

    await page.goto(`${URL}/about`);
    await expect(page.locator('h1').first()).toContainText('ABOUT');
  });

  test('Help and Support routing is protected for guests', async ({ page }) => {
    await page.goto(`${URL}/support`);
    // Shows an inline unauthorized message instead of redirecting
    await expect(page.locator('body')).toContainText('PLEASE AUTHENTICATE TO ACCESS SECURE COMM CHANNELS.');
  });
});
