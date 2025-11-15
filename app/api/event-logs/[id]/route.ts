/**
 * Individual Event Log API - Tenant-Safe Implementation
 * 
 * GET /api/event-logs/[id] - Get single event log
 * PATCH /api/event-logs/[id] - Update event log
 * DELETE /api/event-logs/[id] - Delete event log
 * 
 * SECURITY: All operations validate organizationId ownership
 * MIGRATION: Converted from insecure direct DB access pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getEventLogByIdWithTenantCheck,
  updateEventLogWithTenantCheck,
  deleteEventLogWithTenantCheck,
} from '@/server/tenant-storage';
import { z } from 'zod';

const updateEventLogSchema = z.object({
  caseId: z.string().min(1).optional(),
  activity: z.string().min(1).optional(),
  timestamp: z.string().datetime().optional(),
  resource: z.string().optional(),
  metadata: z.any().optional(),
});

export const GET = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const eventLogId = parseInt(id);
    
    if (isNaN(eventLogId)) {
      return NextResponse.json(
        { error: 'Invalid event log ID' },
        { status: 400 }
      );
    }

    const eventLog = await getEventLogByIdWithTenantCheck(eventLogId);

    return NextResponse.json({ eventLog });
  } catch (error) {
    console.error('Get event log error:', error);

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Event log not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch event log' },
      { status: 500 }
    );
  }
});

export const PATCH = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const eventLogId = parseInt(id);
    
    if (isNaN(eventLogId)) {
      return NextResponse.json(
        { error: 'Invalid event log ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateEventLogSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.timestamp) {
      updateData.timestamp = new Date(validatedData.timestamp);
    }

    const eventLog = await updateEventLogWithTenantCheck(eventLogId, updateData);

    return NextResponse.json({
      success: true,
      eventLog,
      message: 'Event log updated successfully',
    });
  } catch (error) {
    console.error('Update event log error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('access denied')) {
      return NextResponse.json(
        { error: 'Event log not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event log' },
      { status: 500 }
    );
  }
});

export const DELETE = createTenantSafeHandler(async (request, context, { params }) => {
  try {
    const { id } = await params;
    const eventLogId = parseInt(id);
    
    if (isNaN(eventLogId)) {
      return NextResponse.json(
        { error: 'Invalid event log ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteEventLogWithTenantCheck(eventLogId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Event log not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event log deleted successfully',
    });
  } catch (error) {
    console.error('Delete event log error:', error);

    return NextResponse.json(
      { error: 'Failed to delete event log' },
      { status: 500 }
    );
  }
});
