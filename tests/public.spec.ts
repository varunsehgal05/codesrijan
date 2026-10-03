import { test, expect } from '@playwright/test';

const URL = 'https://codesrijan-nine.vercel.app';

test.describe('Public Website E2E Tests', () => {

  test('Homepage loads correctly without crashing', async ({ page }) => {
    await page.goto(URL);
    
    // Check main title
    await expect(page.locator('h1').first()).toContainText('CodeSrijan');
    
    // Check navigation links
    const navBar = page.locator('nav');
    await expect(navBar.locator('text=Problems')).toBeVisible();
    await expect(navBar.locator('text=Leaderboard')).toBeVisible();
    await expect(navBar.locator('text=Comms')).toBeVisible();
  });

  test('Problems page displays catalog', async ({ page }) => {
    await page.goto(`${URL}/problems`);
    await expect(page.locator('h1').first()).toContainText('Problems');
    
    // Check if the search bar is present
    await expect(page.locator('input[placeholder="Search problems..."]')).toBeVisible();
  });

  test('Leaderboard page loads without errors', async ({ page }) => {
    await page.goto(`${URL}/leaderboard`);
    await expect(page.locator('h1').first()).toContainText('Leaderboard');
  });

  test('Timeline and Rules display', async ({ page }) => {
    await page.goto(`${URL}/timeline`);
    await expect(page.locator('body')).toContainText('Timeline');

    await page.goto(`${URL}/rules`);
    await expect(page.locator('body')).toContainText('Rules');
  });

  test('Help and Support routing is protected for guests', async ({ page }) => {
    await page.goto(`${URL}/support`);
    // Should auto-redirect or show a login prompt
    await expect(page).toHaveURL(/.*login.*/);
  });
});
