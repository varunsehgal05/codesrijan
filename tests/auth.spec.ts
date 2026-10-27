import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';

test.describe('Registration & Universal Bypass Rejection', () => {

  test('Student Registration and Universal Bypass Rejection on OTP', async ({ page }) => {
    // 1. Go to register
    await page.goto(`${URL}/register`);
    
    // Generate unique test email
    const uniqueEmail = `student.qa.${Date.now()}@codesrijan.test`;
    
    // Fill Registration Form (Classic Neo-Brutalist UI)
    await page.fill('#reg-first-name', 'QA Auto Student');
    await page.fill('#reg-college', 'National Institute of Tech');
    await page.selectOption('#reg-branch', 'CSE');
    await page.selectOption('#reg-year', '3');
    await page.fill('#reg-email', uniqueEmail);
    await page.fill('#reg-password', 'CyberPass123!');

    await page.click('button:has-text("GENERATE IDENTITY")');

    // Wait for OTP page
    await page.waitForURL('**/auth/otp**');
    
    // Verify masked email is shown
    await expect(page.locator('text=Verify Your Email')).toBeVisible();

    // Verify universal backdoor 123456 is REJECTED
    const otpInput = page.locator('#otp-slot-0');
    await otpInput.focus();
    await page.keyboard.type('123456', { delay: 50 });
    
    await page.click('button:has-text("Confirm & Activate Account")');
    
    // Must show error message and NOT redirect to workspace
    await expect(page.locator('role=alert')).toBeVisible();
    await expect(page.locator('role=alert')).toContainText('Invalid verification code');
  });

});
