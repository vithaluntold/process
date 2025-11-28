/**
 * Processes API - Tenant-Safe Implementation
 * 
 * SECURITY: Uses tenant-safe API factory to automatically enforce organizationId
 * filtering and prevent cross-tenant data leakage.
 * 
 * Migration: COMPLETED (v2 - Factory Pattern)
 */

import { NextResponse } from "next/server";
import { createTenantSafeHandler } from "@/lib/tenant-api-factory";
import {
  getProcessesByTenant,
  getProcessCountByTenant,
  createProcessForTenant,
} from "@/server/tenant-storage";
import { processSchema, sanitizeInput } from "@/lib/validation";
import { appCache } from "@/lib/cache";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

/**
 * GET /api/processes
 * List all processes for the current tenant
 */
export const GET = createTenantSafeHandler(async (request, context, params) => {
  const { organizationId, userId, role } = context;
  const { searchParams } = new URL(request.url);
  
  const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
  const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
  
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 
    ? Math.min(parsedLimit, 100) 
    : 50;
  const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 
    ? parsedOffset 
    : 0;

  // SECURITY: Cache key includes userId and role to prevent cross-role data leakage
  const cacheKey = `processes:org${organizationId}:user${userId}:role${role}:${limit}:${offset}`;
  const cached = appCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Cache': 'HIT',
      },
    });
  }

  // SECURITY: Automatically filters by organizationId from context
  const [processes, total] = await Promise.all([
    getProcessesByTenant({ limit, offset }),
    getProcessCountByTenant(),
  ]);
  
  const responseData = { 
    processes,
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };

  appCache.set(cacheKey, responseData, 30);
  
  return NextResponse.json(responseData, {
    headers: {
      'Cache-Control': 'private, max-age=30',
      'X-Cache': 'MISS',
    },
  });
});

/**
 * POST /api/processes
 * Create a new process for the current tenant
 */
export const POST = createTenantSafeHandler(async (request, context, params) => {
  const guardError = withApiGuards(request, 'process-create', API_WRITE_LIMIT);
  if (guardError) return guardError;

  const body = await request.json();
  
  const validation = processSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    );
  }

  const { name, description, source } = validation.data;

  // SECURITY: Automatically sets organizationId and userId from context
  const process = await createProcessForTenant({
    name: sanitizeInput(name),
    description: description ? sanitizeInput(description) : undefined,
    source: sanitizeInput(source),
    status: "active",
  });

  return NextResponse.json(process, { status: 201 });
});
