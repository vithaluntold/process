/**
 * Dashboard Stats API - Tenant-Safe Implementation
 * 
 * GET /api/dashboard/stats - Get dashboard statistics for current tenant
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure userId-only pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { getDashboardStatsByTenant } from '@/server/tenant-storage';
import { appCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export const GET = createTenantSafeHandler(async (request, context) => {
  try {
    const { organizationId, userId } = context;

    // Cache key includes both userId and organizationId for proper isolation
    const cacheKey = `dashboard-stats:${organizationId}:${userId}`;
    const cached = appCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    // Use tenant-safe function that automatically filters by organizationId
    const stats = await getDashboardStatsByTenant();

    const responseData = { stats };
    appCache.set(cacheKey, responseData, 30);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
});
