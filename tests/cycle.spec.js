// tests/cycle.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.locator('input[name="email"]').fill(process.env.TEST_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.TEST_PASSWORD);
  await page.locator('button:has-text("Sign In to Luneverse")').click();
  await page.waitForURL('**/dashboard');
});

test('Add cycle entry', async ({ page }) => {
  await page.locator('a[href="/cycle"]').click();
  await page.locator('input[name="startDate"]').fill('2025-10-20');
  await page.locator('input[name="endDate"]').fill('2025-10-25');
  await page.locator('button:has-text("Save Cycle")').click();
  await expect(page.locator('.success-message')).toHaveText(/Cycle entry saved/i);
});
