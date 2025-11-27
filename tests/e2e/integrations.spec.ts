import { test, expect } from '@playwright/test';

test.describe('Integrations Page (Unauthenticated)', () => {
  test('integrations page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/integrations');
    
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('signin');
  });
});

test.describe('Connector API Endpoints', () => {
  test('connector list endpoint requires authentication', async ({ request }) => {
    const response = await request.get('/api/connectors');
    expect(response.status()).toBe(401);
  });

  test('super-admin connector endpoint requires authentication', async ({ request }) => {
    const response = await request.get('/api/super-admin/connectors');
    expect(response.status()).toBe(401);
  });
});
