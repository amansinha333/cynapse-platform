import { test, expect } from '@playwright/test';

test.describe('marketing smoke', () => {
  test('landing loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('legal pages respond', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
    await page.goto('/terms');
    await expect(page.locator('body')).toBeVisible();
  });

  test('subprocessors and DPA routes load', async ({ page }) => {
    await page.goto('/subprocessors');
    await expect(page.getByRole('heading', { name: /Subprocessors/i })).toBeVisible();
    await page.goto('/dpa');
    await expect(page.getByRole('heading', { name: /Data Processing Addendum/i })).toBeVisible();
  });
});
