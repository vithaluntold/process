/**
 * Tenant-Safe API Route Factory
 * 
 * CRITICAL SECURITY: This factory ensures ALL API routes have tenant context
 * and prevents cross-organization data leakage.
 * 
 * MIGRATION GUIDE:
 * 
 * BEFORE (INSECURE):
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser();
 *   const data = await storage.getProcessesByUser(user.id);
 *   return NextResponse.json(data);
 * }
 * ```
 * 
 * AFTER (SECURE):
 * ```typescript
 * export const GET = createTenantSafeHandler(async (request, context) => {
 *   const data = await getProcessesByTenant();
 *   return NextResponse.json(data);
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { runWithTenantContext, TenantContext } from "@/lib/tenant-context";

export type TenantSafeHandler = (
  request: NextRequest,
  context: TenantContext,
  params?: any
) => Promise<NextResponse>;

/**
 * Creates a tenant-safe API route handler
 * 
 * This is the MANDATORY pattern for all API routes that access tenant data.
 * It automatically:
 * 1. Validates authentication
 * 2. Establishes tenant context from the authenticated user
 * 3. Makes organizationId, userId, and role available to the handler
 * 4. Ensures all database queries are automatically scoped to the tenant
 * 
 * @example
 * export const GET = createTenantSafeHandler(async (request, context) => {
 *   // context contains: organizationId, userId, userEmail, role
 *   const processes = await getProcessesByTenant();
 *   return NextResponse.json(processes);
 * });
 */
export function createTenantSafeHandler(
  handler: TenantSafeHandler
): (request: NextRequest, context?: { params: Promise<any> }) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext?: { params: Promise<any> }) => {
    try {
      // Step 1: Authenticate the user
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Step 2: Validate user has organization
      if (!user.organizationId) {
        console.error('User missing organizationId:', { userId: user.id, email: user.email });
        return NextResponse.json(
          { 
            error: "Invalid user configuration: missing organization",
            details: "Please contact support to resolve this issue",
          },
          { status: 500 }
        );
      }

      // Step 3: Build tenant context
      const tenantContext: TenantContext = {
        organizationId: user.organizationId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      };

      // Step 4: Resolve route params if present
      const params = routeContext?.params ? await routeContext.params : undefined;

      // Step 5: Execute handler within tenant context
      return await runWithTenantContext(
        tenantContext,
        () => handler(request, tenantContext, params)
      );
    } catch (error) {
      console.error('Tenant-safe handler error:', error);
      
      // Don't leak internal error details
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a tenant-safe API route handler that requires Admin role
 * 
 * @example
 * export const POST = createAdminHandler(async (request, context) => {
 *   // Only admins and super admins can reach this code
 *   const teams = await getTeamsByTenant();
 *   return NextResponse.json(teams);
 * });
 */
export function createAdminHandler(
  handler: TenantSafeHandler
): (request: NextRequest, context?: { params: Promise<any> }) => Promise<NextResponse> {
  return createTenantSafeHandler(async (request, context, params) => {
    // Enforce admin role
    if (context.role !== 'admin' && context.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    return handler(request, context, params);
  });
}

/**
 * Creates a tenant-safe API route handler that requires Super Admin role
 * 
 * @example
 * export const GET = createSuperAdminHandler(async (request, context) => {
 *   // Only super admins can reach this code
 *   const orgs = await getAllOrganizations();
 *   return NextResponse.json(orgs);
 * });
 */
export function createSuperAdminHandler(
  handler: TenantSafeHandler
): (request: NextRequest, context?: { params: Promise<any> }) => Promise<NextResponse> {
  return createTenantSafeHandler(async (request, context, params) => {
    // Enforce super admin role
    if (context.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required" },
        { status: 403 }
      );
    }

    return handler(request, context, params);
  });
}

/**
 * Creates a public API route handler (no authentication required)
 * 
 * Use this ONLY for truly public endpoints like pricing, health checks, etc.
 * 
 * @example
 * export const GET = createPublicHandler(async (request) => {
 *   return NextResponse.json({ status: "healthy" });
 * });
 */
export function createPublicHandler(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>
): (request: NextRequest, context?: { params: Promise<any> }) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext?: { params: Promise<any> }) => {
    try {
      const params = routeContext?.params ? await routeContext.params : undefined;
      return await handler(request, params);
    } catch (error) {
      console.error('Public handler error:', error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
