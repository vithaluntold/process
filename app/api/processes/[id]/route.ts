/**
 * Process Detail API - Tenant-Safe Implementation
 * 
 * SECURITY: Uses tenant-safe API factory and storage functions
 * Migration: COMPLETED (v2 - Factory Pattern)
 */

import { NextResponse } from "next/server";
import { createTenantSafeHandler } from "@/lib/tenant-api-factory";
import {
  getProcessByIdWithTenantCheck,
  updateProcessWithTenantCheck,
  deleteProcessWithTenantCheck,
} from "@/server/tenant-storage";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export const GET = createTenantSafeHandler(async (request, context, params) => {
  const { id } = params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return NextResponse.json(
      { error: "Invalid process ID" },
      { status: 400 }
    );
  }

  // SECURITY: Automatically filters by organizationId
  const process = await getProcessByIdWithTenantCheck(processId);

  if (!process) {
    return NextResponse.json(
      { error: "Process not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ process });
});

export const PATCH = createTenantSafeHandler(async (request, context, params) => {
  const guardError = withApiGuards(request, 'process-update', API_WRITE_LIMIT);
  if (guardError) return guardError;

  const { id } = params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return NextResponse.json(
      { error: "Invalid process ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, description, status } = body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // SECURITY: Automatically validates organizationId ownership
  const process = await updateProcessWithTenantCheck(processId, updates);
  
  if (!process) {
    return NextResponse.json(
      { error: "Process not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ process });
});

export const DELETE = createTenantSafeHandler(async (request, context, params) => {
  const guardError = withApiGuards(request, 'process-delete', API_WRITE_LIMIT);
  if (guardError) return guardError;

  const { id } = params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return NextResponse.json(
      { error: "Invalid process ID" },
      { status: 400 }
    );
  }

  // SECURITY: Automatically validates organizationId ownership
  const success = await deleteProcessWithTenantCheck(processId);
  
  if (!success) {
    return NextResponse.json(
      { error: "Process not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ 
    message: "Process deleted successfully" 
  });
});
