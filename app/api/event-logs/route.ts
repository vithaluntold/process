/**
 * Event Logs API - Tenant-Safe Implementation
 * 
 * GET /api/event-logs - List all event logs for current tenant
 * POST /api/event-logs - Create new event log(s)
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure userId-only pattern
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getEventLogsByTenant, 
  createEventLogForTenant 
} from '@/server/tenant-storage';
import { z } from 'zod';

const createEventLogSchema = z.object({
  processId: z.number().int().positive('Process ID must be positive'),
  caseId: z.string().min(1, 'Case ID is required'),
  activity: z.string().min(1, 'Activity is required'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  resource: z.string().optional(),
  metadata: z.any().optional(),
});

const bulkCreateEventLogsSchema = z.object({
  processId: z.number().int().positive('Process ID must be positive'),
  events: z.array(z.object({
    caseId: z.string().min(1, 'Case ID is required'),
    activity: z.string().min(1, 'Activity is required'),
    timestamp: z.string().datetime('Invalid timestamp format'),
    resource: z.string().optional(),
    metadata: z.any().optional(),
  })).min(1, 'At least one event is required'),
});

export const GET = createTenantSafeHandler(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const processId = searchParams.get('processId');

    const eventLogs = await getEventLogsByTenant({
      limit,
      offset,
      processId: processId ? parseInt(processId) : undefined,
    });

    return NextResponse.json({
      events: eventLogs,
      pagination: {
        limit,
        offset,
        total: eventLogs.length,
      },
    });
  } catch (error) {
    console.error('Get event logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event logs' },
      { status: 500 }
    );
  }
});

export const POST = createTenantSafeHandler(async (request, context) => {
  try {
    const body = await request.json();

    // Support both single event and bulk create
    if (body.events && Array.isArray(body.events)) {
      // Bulk create (legacy compatibility)
      const validatedData = bulkCreateEventLogsSchema.parse(body);
      
      const inserted = [];
      for (const event of validatedData.events) {
        const eventLog = await createEventLogForTenant({
          processId: validatedData.processId,
          caseId: event.caseId,
          activity: event.activity,
          timestamp: new Date(event.timestamp),
          resource: event.resource,
          metadata: event.metadata,
        });
        inserted.push(eventLog);
      }

      return NextResponse.json(
        { 
          message: 'Event logs inserted successfully',
          count: inserted.length,
          eventLogs: inserted,
        },
        { status: 201 }
      );
    } else {
      // Single create
      const validatedData = createEventLogSchema.parse(body);

      const eventLog = await createEventLogForTenant({
        ...validatedData,
        timestamp: new Date(validatedData.timestamp),
      });

      return NextResponse.json(
        { 
          success: true, 
          eventLog,
          message: 'Event log created successfully' 
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Create event log error:', error);

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
      { error: 'Failed to create event log' },
      { status: 500 }
    );
  }
});
