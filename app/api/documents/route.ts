/**
 * Documents API - Tenant-Safe Implementation
 * 
 * GET /api/documents - List all documents for current tenant
 * POST /api/documents - Create new document record
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure pattern (DELETE moved to [id]/route.ts)
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { 
  getDocumentsByTenant, 
  createDocumentForTenant 
} from '@/server/tenant-storage';
import { z } from 'zod';

const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  size: z.string().min(1, 'Document size is required'),
  path: z.string().min(1, 'Document path is required'),
  status: z.string().optional().default('uploaded'),
  extractedProcesses: z.number().int().optional(),
  activities: z.number().int().optional(),
});

export const GET = createTenantSafeHandler(async (request, context, params) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const documents = await getDocumentsByTenant({
      limit,
      offset,
    });

    return NextResponse.json({
      documents,
      pagination: {
        limit,
        offset,
        total: documents.length,
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
});

export const POST = createTenantSafeHandler(async (request, context, params) => {
  try {
    const body = await request.json();
    const validatedData = createDocumentSchema.parse(body);

    const document = await createDocumentForTenant(validatedData);

    return NextResponse.json(
      { 
        success: true, 
        document,
        message: 'Document created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create document error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
});
