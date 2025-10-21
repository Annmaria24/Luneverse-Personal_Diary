// tests/login.spec.js
import { test, expect } from '@playwright/test';

test('Login as test user', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.locator('input[name="email"]').fill(process.env.TEST_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.TEST_PASSWORD);
  await page.locator('button:has-text("Sign In to Luneverse")').click();

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page).toHaveURL(/dashboard/);
});
