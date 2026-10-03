import { test, expect } from '@playwright/test';

const URL = 'https://codesrijan-nine.vercel.app';

test.describe('Auth Flow E2E (With Backdoor)', () => {

  test('Student Registration, OTP Verification, and Auto-Redirect', async ({ page }) => {
    // 1. Go to register
    await page.goto(`${URL}/register`);
    
    // Generate a unique test email
    const uniqueEmail = `student.qa.${Date.now()}@codesrijan.test`;
    
    // 2. Fill registration form
    await page.fill('input[placeholder="John Doe"]', 'QA Auto Student');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder="Enter your college name"]', 'QA Institute');
    await page.fill('input[placeholder="e.g. Computer Science"]', 'CS');
    await page.fill('input[placeholder="e.g. 3rd"]', '3rd');
    
    await page.check('input[type="checkbox"]');
    
    await page.click('button[type="submit"]');
    
    // 3. Wait for OTP page
    await page.waitForURL('**/auth/otp**');
    
    // 4. Enter backdoor OTP
    const otpInputs = page.locator('input[type="text"]');
    await expect(otpInputs).toHaveCount(6);
    
    const otp = '123456';
    for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
    }
    
    await page.click('button:has-text("Verify Identity")');
    
    // 5. Verify auto-redirect to workspace for student
    await page.waitForURL('**/workspace');
    await expect(page.locator('h1').first()).toContainText('Workspace');
  });

  test('Admin Registration, OTP, and Dashboard', async ({ page }) => {
    await page.goto(`${URL}/register`);
    
    const adminEmail = `admin.qa.${Date.now()}@codesrijan.test`;
    
    await page.fill('input[placeholder="John Doe"]', 'QA Auto Admin');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder="Enter your college name"]', 'HQ');
    
    await page.check('input[type="checkbox"]');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/auth/otp**');
    
    const otpInputs = page.locator('input[type="text"]');
    const otp = '123456';
    for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
    }
    
    await page.click('button:has-text("Verify Identity")');
    
    // Admin should auto-redirect to /admin
    await page.waitForURL('**/admin');
    await expect(page.locator('h1').first()).toContainText('Dashboard');
  });

});
