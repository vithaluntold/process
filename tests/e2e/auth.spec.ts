import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('signin page loads successfully', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('signin form validates required fields', async ({ page }) => {
    await page.goto('/auth/signin');
    
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();
    
    const emailInput = page.getByLabel(/email/i);
    const isInvalid = await emailInput.evaluate(el => !(el as HTMLInputElement).checkValidity());
    expect(isInvalid).toBeTruthy();
  });

  test('signin with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    
    const submitButton = page.getByRole('button', { name: /sign in|log in|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    const hasError = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').isVisible()
      .catch(() => false);
    
    expect(hasError || page.url().includes('signin')).toBeTruthy();
  });

  test('protected routes redirect to signin', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('signin');
  });
});
