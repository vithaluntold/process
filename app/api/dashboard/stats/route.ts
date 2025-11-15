/**
 * Dashboard Stats API - Tenant-Safe Implementation
 * 
 * GET /api/dashboard/stats - Get dashboard statistics for current tenant
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure userId-only pattern
 * BACKWARD COMPATIBILITY: Returns original field names (processCount, avgCycleTime, etc.)
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { db } from '@/lib/db';
import { processes, performanceMetrics, automationOpportunities } from '@/shared/schema';
import { eq, sql } from 'drizzle-orm';
import { appCache } from '@/lib/cache';
import { requireTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export const GET = createTenantSafeHandler(async (request, context) => {
  try {
    const { organizationId, userId } = requireTenantContext();

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

    // Calculate stats with tenant isolation (all queries filter by organizationId)
    const result = await db.execute(sql`
      WITH tenant_processes AS (
        SELECT id FROM ${processes} WHERE organization_id = ${organizationId}
      ),
      process_stats AS (
        SELECT COUNT(*) as process_count FROM tenant_processes
      ),
      metrics_stats AS (
        SELECT 
          AVG(cycle_time) as avg_cycle_time,
          AVG(conformance_rate) as avg_conformance
        FROM ${performanceMetrics} pm
        WHERE pm.process_id IN (SELECT id FROM tenant_processes)
      ),
      automation_stats AS (
        SELECT AVG(automation_potential) as avg_automation
        FROM ${automationOpportunities} ao
        WHERE ao.process_id IN (SELECT id FROM tenant_processes)
      )
      SELECT 
        ps.process_count,
        ms.avg_cycle_time,
        ms.avg_conformance,
        as_tbl.avg_automation
      FROM process_stats ps
      CROSS JOIN metrics_stats ms
      CROSS JOIN automation_stats as_tbl
    `);

    const row = result.rows[0] as any;

    const stats = {
      processCount: Number(row?.process_count || 0),
      avgCycleTime: row?.avg_cycle_time ? Math.round(Number(row.avg_cycle_time) * 10) / 10 : 0,
      conformanceRate: row?.avg_conformance ? Math.round(Number(row.avg_conformance) * 10) / 10 : 0,
      automationPotential: row?.avg_automation ? Math.round(Number(row.avg_automation) * 10) / 10 : 0,
    };

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
