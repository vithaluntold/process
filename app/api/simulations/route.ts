/**
 * Simulations API - Tenant-Safe Implementation
 * 
 * GET /api/simulations - List all simulation scenarios for current tenant
 * POST /api/simulations - Create new simulation
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure direct DB access pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getSimulationsByTenant, 
  createSimulationForTenant 
} from '@/server/tenant-storage';
import { z } from 'zod';

const createSimulationSchema = z.object({
  processId: z.number().int().positive('Process ID must be positive'),
  name: z.string().min(1, 'Simulation name is required'),
  description: z.string().optional(),
  parameters: z.any(),
  status: z.string().optional(),
});

export const GET = createTenantSafeHandler(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const processId = searchParams.get('processId');

    const simulations = await getSimulationsByTenant({
      limit,
      offset,
      processId: processId ? parseInt(processId) : undefined,
    });

    return NextResponse.json({
      simulations,
      pagination: {
        limit,
        offset,
        total: simulations.length,
      },
    });
  } catch (error) {
    console.error('Get simulations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    );
  }
});

export const POST = createTenantSafeHandler(async (request, context) => {
  try {
    const body = await request.json();
    const validatedData = createSimulationSchema.parse(body);

    // Ensure parameters is always provided (required by createSimulationForTenant)
    const simulation = await createSimulationForTenant({
      processId: validatedData.processId,
      name: validatedData.name,
      description: validatedData.description,
      parameters: validatedData.parameters || {}, // Provide empty object if undefined
      status: validatedData.status,
    });

    return NextResponse.json(
      { 
        success: true, 
        simulation,
        message: 'Simulation created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create simulation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create simulation' },
      { status: 500 }
    );
  }
});
