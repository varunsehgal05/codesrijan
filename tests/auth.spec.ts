import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

test.describe('Auth Flow E2E (With Backdoor)', () => {

  test('Student Registration, OTP Verification, and Auto-Redirect', async ({ page }) => {
    // 1. Go to register
    await page.goto(`${URL}/register`);
    
    // Generate a unique test email
    const uniqueEmail = `student.qa.${Date.now()}@codesrijan.test`;
    
    // 2. Fill registration form
    await page.fill('input[placeholder="John"]', 'QA Auto Student');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder="Institute of Tech"]', 'QA Institute');
    await page.fill('input[placeholder="CS"]', 'CS');
    await page.fill('input[placeholder="3"]', '3');
    await page.click('button:has-text("GENERATE IDENTITY")');
    // 3. Wait for OTP page
    await page.waitForURL('**/auth/otp**');
    
    // 4. Enter backdoor OTP
    const otpInputs = page.locator('input[type="text"]');
    const otp = '123456';
    await page.waitForTimeout(500);
    await otpInputs.nth(0).focus();
    await page.keyboard.type(otp, { delay: 100 });
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("AUTHORIZE OVERRIDE")');
    
    // 5. Verify auto-redirect to workspace for student
    await page.waitForURL('**/workspace');
  });

  test('Admin Registration, OTP, and Dashboard', async ({ page }) => {
    await page.goto(`${URL}/register`);
    
    const adminEmail = `admin.qa.${Date.now()}@codesrijan.test`;
    
    await page.fill('input[placeholder="John"]', 'QA Auto Admin');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.fill('input[placeholder="Institute of Tech"]', 'HQ');
    await page.fill('input[placeholder="CS"]', 'CS');
    await page.fill('input[placeholder="3"]', '3');
    await page.click('button:has-text("GENERATE IDENTITY")');
    await page.waitForURL('**/auth/otp**');
    
    const otpInputs = page.locator('input[type="text"]');
    const otp = '123456';
    await page.waitForTimeout(500);
    for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otp[i]);
    }
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("AUTHORIZE OVERRIDE")');
    
    // Admin should auto-redirect to /admin
    await page.waitForURL('**/admin');
    await expect(page.locator('h1').first()).toContainText('ADMIN COMMAND');
  });

});
