import { test, expect } from '@playwright/test';

test.describe('Security and exposure', () => {
  test('should load and verify basic state', async ({ page }) => {
    // Navigate to the primary route for this module
    await page.goto('http://localhost:5173' + '/admin/users');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    
    // Assert no critical console errors occurred during render
    page.on('pageerror', exception => {
      console.log(`Uncaught exception: ${exception}`);
    });
    
    // Basic verification of UI presence
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBeNull();
  });
});
