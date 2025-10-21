// tests/mood.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.locator('input[name="email"]').fill(process.env.TEST_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.TEST_PASSWORD);
  await page.locator('button:has-text("Sign In to Luneverse")').click();
  await page.waitForURL('**/dashboard');
});

test('Add mood for today', async ({ page }) => {
  await page.locator('a[href="/mood"]').click();
  await page.locator('select[name="mood"]').selectOption('Happy');
  await page.locator('button:has-text("Save Mood")').click();
  await expect(page.locator('.success-message')).toHaveText(/Mood saved/i);
});
