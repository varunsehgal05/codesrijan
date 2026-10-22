import { test, expect } from '@playwright/test';
const URL = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
for (const width of [375, 1280]) {
 test(`registration help at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 800 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.text().includes('Maximum update depth')) errors.push(m.text()); });
  await page.goto(`${URL}/register`, { waitUntil: "domcontentloaded" });
  const help = page.getByRole('button', { name: 'Open SrijanBot help' });
  await expect(help).toBeEnabled({ timeout: 20000 });
  await help.scrollIntoViewIfNeeded();
  await help.focus();
  await expect(help).toBeFocused();
  await page.keyboard.press('Enter');
  const input = page.getByRole('textbox', { name: 'Message SrijanBot' });
  await expect(input).toBeVisible();
  const box = await input.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  await page.screenshot({ path: `artifacts/screenshots/final-help-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Close SrijanBot' }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `artifacts/screenshots/final-register-${width}.png`, fullPage: true });
  expect(errors).toEqual([]);
 });
}
test('guest admin payment guard settles without update-depth errors', async ({page}) => {
 const errors: string[]=[];
 page.on('pageerror', e=>errors.push(e.message));
 page.on('console', m=>{if(m.text().includes('Maximum update depth')) errors.push(m.text());});
 await page.goto(`${URL}/admin/payments`, { waitUntil: "domcontentloaded" });
 await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
 await expect(page.getByRole("heading", { name: "ACCESS DENIED" })).toBeVisible();
 expect(errors).toEqual([]);
});



