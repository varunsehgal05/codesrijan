import { test, expect } from '@playwright/test';

test.describe('Registration and Squad Builder Regression', () => {
    test.beforeEach(async ({ page }) => {
        // Register a new test user directly via API for isolation
        const email = `testuser_${Date.now()}@example.com`;
        const res = await page.request.post('http://localhost:5001/api/auth/register', {
            data: {
                name: 'Test User',
                email: email,
                password: 'Password123!',
                role: 'student'
            }
        });
        
        // Login via UI
        await page.goto('http://localhost:5173/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    });

    test('REG-009: Enrollment is denied for a genuinely completed event', async ({ page }) => {
        // Assuming hack-demo-3 is seeded and completed in the isolated backend
        await page.goto('http://localhost:5173/hackathons/hack-demo-3/register');
        
        // The page should fetch status and show it's closed
        await expect(page.locator('text=Registration Closed')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeDisabled();
    });

    test('SQUAD-003: An unregistered user receives a clear prerequisite message', async ({ page }) => {
        await page.goto('http://localhost:5173/recruitment');
        await page.click('text=CREATE');
        
        await expect(page.locator('text=ERR: YOU MUST REGISTER FOR A HACKATHON BEFORE FORMING A SQUAD.')).toBeVisible();
    });
});
