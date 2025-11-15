/**
 * SECURITY FIX: This endpoint has been updated to use tenant-safe storage functions
 * Previous version only filtered by userId - now properly enforces organizationId
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/with-tenant-context";
import {
  getProcessesByTenant,
  getProcessCountByTenant,
  createProcessForTenant,
} from "@/server/tenant-storage";
import { processSchema, sanitizeInput } from "@/lib/validation";
import { appCache } from "@/lib/cache";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";
import { requireTenantContext } from "@/lib/tenant-context";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const { organizationId, userId, role } = requireTenantContext();
    const { searchParams } = new URL(request.url);
    
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 
      ? Math.min(parsedLimit, 100) 
      : 50;
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 
      ? parsedOffset 
      : 0;

    // SECURITY FIX: Include userId and role in cache key to prevent cross-role data leakage
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

    // SECURITY FIX: Now filters by organizationId from context, not just userId
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
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
});

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
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

    // SECURITY FIX: Automatically sets organizationId and userId from tenant context
    const process = await createProcessForTenant({
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      source: sanitizeInput(source),
      status: "active",
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
});
