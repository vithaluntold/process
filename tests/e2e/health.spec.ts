import { test, expect } from '@playwright/test';

test.describe('Health Endpoints', () => {
  test('health endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  test('ready endpoint returns ready status', async ({ request }) => {
    const response = await request.get('/api/ready');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ready');
  });

  test('ML status endpoint returns algorithm info', async ({ request }) => {
    const response = await request.get('/api/ml/status');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.algorithms).toBeDefined();
    expect(Array.isArray(data.algorithms.anomalyDetection)).toBeTruthy();
    expect(Array.isArray(data.algorithms.forecasting)).toBeTruthy();
  });
});
