/**
 * Individual Simulation API - Tenant-Safe Implementation
 * 
 * GET /api/simulations/[id] - Get single simulation
 * PATCH /api/simulations/[id] - Update simulation
 * DELETE /api/simulations/[id] - Delete simulation
 * 
 * SECURITY: All operations validate organizationId ownership
 * MIGRATION: Converted from insecure direct DB access pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getSimulationByIdWithTenantCheck,
  updateSimulationWithTenantCheck,
  deleteSimulationWithTenantCheck,
} from '@/server/tenant-storage';
import { z } from 'zod';

const updateSimulationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parameters: z.any().optional(),
  results: z.any().optional(),
  status: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

export const GET = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const simulationId = parseInt(id);
    
    if (isNaN(simulationId)) {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    const simulation = await getSimulationByIdWithTenantCheck(simulationId);

    return NextResponse.json({ simulation });
  } catch (error) {
    console.error('Get simulation error:', error);

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Simulation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    );
  }
});

export const PATCH = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const simulationId = parseInt(id);
    
    if (isNaN(simulationId)) {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateSimulationSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.completedAt) {
      updateData.completedAt = new Date(validatedData.completedAt);
    }

    const simulation = await updateSimulationWithTenantCheck(simulationId, updateData);

    return NextResponse.json({
      success: true,
      simulation,
      message: 'Simulation updated successfully',
    });
  } catch (error) {
    console.error('Update simulation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Simulation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update simulation' },
      { status: 500 }
    );
  }
});

export const DELETE = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const simulationId = parseInt(id);
    
    if (isNaN(simulationId)) {
      return NextResponse.json(
        { error: 'Invalid simulation ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteSimulationWithTenantCheck(simulationId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Simulation not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Simulation deleted successfully',
    });
  } catch (error) {
    console.error('Delete simulation error:', error);

    return NextResponse.json(
      { error: 'Failed to delete simulation' },
      { status: 500 }
    );
  }
});
