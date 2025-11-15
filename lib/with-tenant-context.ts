/**
 * Higher-Order Function for API Routes with Tenant Context
 * 
 * Automatically sets up tenant context for authenticated requests
 * Use this to wrap all API route handlers that need tenant isolation
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { runWithTenantContext } from "@/lib/tenant-context";

export type ApiHandler = (
  request: NextRequest,
  context?: { params: Promise<any> }
) => Promise<Response>;

/**
 * Wrap an API handler with automatic tenant context setup
 * 
 * @example
 * export const GET = withTenantContext(async (request) => {
 *   // Now you can use tenant-safe storage functions
 *   const processes = await getProcessesByTenant();
 *   return NextResponse.json(processes);
 * });
 */
export function withTenantContext(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Promise<any> }) => {
    // Get the authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Validate user has required fields
    if (!user.organizationId) {
      console.error('User missing organizationId:', user);
      return NextResponse.json(
        { error: "Invalid user configuration: missing organization" },
        { status: 500 }
      );
    }
    
    // Run the handler within tenant context
    return runWithTenantContext(
      {
        organizationId: user.organizationId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      () => handler(request, context)
    );
  };
}

/**
 * Wrap an API handler with tenant context and admin role check
 * 
 * SECURITY FIX: Uses tenant context role instead of re-fetching user
 * 
 * @example
 * export const POST = withAdminContext(async (request) => {
 *   // Only admins can access this endpoint
 *   const teams = await getTeamsByTenant();
 *   return NextResponse.json(teams);
 * });
 */
export function withAdminContext(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Promise<any> }) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // SECURITY: Check role BEFORE establishing context
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    
    if (!user.organizationId) {
      console.error('User missing organizationId:', user);
      return NextResponse.json(
        { error: "Invalid user configuration: missing organization" },
        { status: 500 }
      );
    }
    
    // Establish tenant context with validated user
    return runWithTenantContext(
      {
        organizationId: user.organizationId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      () => handler(request, context)
    );
  };
}

/**
 * Wrap an API handler with tenant context and super admin role check
 * 
 * SECURITY FIX: Uses tenant context role instead of re-fetching user
 * 
 * @example
 * export const GET = withSuperAdminContext(async (request) => {
 *   // Only super admins can access this endpoint
 *   const orgs = await getAllOrganizations();
 *   return NextResponse.json(orgs);
 * });
 */
export function withSuperAdminContext(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: Promise<any> }) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // SECURITY: Check role BEFORE establishing context
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required" },
        { status: 403 }
      );
    }
    
    if (!user.organizationId) {
      console.error('User missing organizationId:', user);
      return NextResponse.json(
        { error: "Invalid user configuration: missing organization" },
        { status: 500 }
      );
    }
    
    // Establish tenant context with validated super admin
    return runWithTenantContext(
      {
        organizationId: user.organizationId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      () => handler(request, context)
    );
  };
}
