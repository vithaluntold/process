/**
 * Tenant-Safe Processes API (v1)
 * 
 * SECURITY: This endpoint uses tenant context to automatically filter all queries
 * by organizationId, preventing cross-tenant data leakage.
 * 
 * Migration Note: This is the secure v1 endpoint. The legacy /api/processes endpoint
 * should be migrated to use these same patterns.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/with-tenant-context";
import {
  getProcessesByTenant,
  getProcessCountByTenant,
  createProcessForTenant,
} from "@/server/tenant-storage";
import { processSchema, sanitizeInput } from "@/lib/validation";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

/**
 * GET /api/v1/processes
 * List all processes for the current tenant
 * 
 * Query Parameters:
 * - limit: Max number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - teamId: Filter by team (optional)
 */
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    const teamId = searchParams.get('teamId');
    
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 
      ? Math.min(parsedLimit, 100) 
      : 50;
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 
      ? parsedOffset 
      : 0;

    // SECURITY: These functions automatically filter by organizationId from context
    const [processes, total] = await Promise.all([
      getProcessesByTenant({ 
        limit, 
        offset,
        teamId: teamId ? parseInt(teamId) : undefined,
      }),
      getProcessCountByTenant(teamId ? parseInt(teamId) : undefined),
    ]);
    
    const responseData = { 
      processes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    };
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch processes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/v1/processes
 * Create a new process for the current tenant
 * 
 * Body:
 * - name: Process name (required)
 * - description: Process description (optional)
 * - source: Data source (required)
 * - teamId: Team ID (optional)
 */
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const guardError = withApiGuards(request, 'process-create', API_WRITE_LIMIT);
    if (guardError) return guardError;

    const body = await request.json();
    
    const validation = processSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, description, source } = validation.data;
    const teamId = body.teamId ? parseInt(body.teamId) : undefined;

    // SECURITY: createProcessForTenant automatically sets organizationId and userId from context
    const process = await createProcessForTenant({
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      source: sanitizeInput(source),
      status: "active",
      teamId,
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Team not found')) {
        return NextResponse.json(
          { error: "Invalid team ID or team not found" },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Tenant context not found')) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
});
