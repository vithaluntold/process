/**
 * Tenant Context System for Multi-Tenant Data Isolation
 * 
 * CRITICAL SECURITY: All data access MUST go through tenant context to prevent
 * cross-organization data leakage.
 * 
 * This uses AsyncLocalStorage to maintain tenant context throughout the request
 * lifecycle without passing organizationId to every function.
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId: number;
  userId: number;
  userEmail: string;
  role: string;
}

/**
 * Global async storage for tenant context
 * Each HTTP request gets its own isolated context
 */
export const tenantContext = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant context (returns undefined if not in a request context)
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}

/**
 * Require tenant context (throws error if not available)
 * Use this in functions that MUST have tenant context
 */
export function requireTenantContext(): TenantContext {
  const context = tenantContext.getStore();
  
  if (!context) {
    throw new Error(
      'Tenant context not found. This function must be called within a request context.'
    );
  }
  
  return context;
}

/**
 * Run a function with tenant context
 * Used by middleware to establish context for the request
 */
export function runWithTenantContext<T>(
  context: TenantContext,
  callback: () => T
): T {
  return tenantContext.run(context, callback);
}

/**
 * Validate that a resource belongs to the current tenant
 * Throws error if organizationId doesn't match
 */
export function validateTenantAccess(resourceOrgId: number | null | undefined): void {
  const context = requireTenantContext();
  
  if (resourceOrgId !== context.organizationId) {
    throw new Error(
      `Access denied: Resource belongs to organization ${resourceOrgId}, ` +
      `but current tenant is ${context.organizationId}`
    );
  }
}

/**
 * Check if current user is an admin (admin or super_admin)
 */
export function isAdmin(): boolean {
  const context = getTenantContext();
  return context?.role === 'admin' || context?.role === 'super_admin';
}

/**
 * Check if current user is a super admin
 */
export function isSuperAdmin(): boolean {
  const context = getTenantContext();
  return context?.role === 'super_admin';
}

/**
 * Require admin role
 */
export function requireAdmin(): void {
  if (!isAdmin()) {
    throw new Error('Access denied: Admin role required');
  }
}

/**
 * Require super admin role
 */
export function requireSuperAdmin(): void {
  if (!isSuperAdmin()) {
    throw new Error('Access denied: Super Admin role required');
  }
}
