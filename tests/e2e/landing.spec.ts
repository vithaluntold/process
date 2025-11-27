import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('landing page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EPI-Q/i);
  });

  test('landing page has navigation elements', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('landing page has login/signup options', async ({ page }) => {
    await page.goto('/');
    
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });
    const signupLink = page.getByRole('link', { name: /sign up|get started|try free/i });
    
    const hasLoginOrSignup = await loginLink.isVisible() || await signupLink.isVisible();
    expect(hasLoginOrSignup).toBeTruthy();
  });

  test('landing page is responsive', async ({ page }) => {
    await page.goto('/');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
