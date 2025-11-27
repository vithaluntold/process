import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorMappings } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';

const createMappingSchema = z.object({
  sourceObject: z.string().min(1),
  sourceObjectLabel: z.string().optional(),
  caseIdField: z.string().min(1),
  activityField: z.string().min(1),
  timestampField: z.string().min(1),
  resourceField: z.string().optional(),
  additionalFields: z.array(z.string()).optional(),
  filterQuery: z.string().optional(),
  batchSize: z.number().min(1).max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = user.organizationId;

    const { id } = await params;
    const connectorId = parseInt(id, 10);

    if (isNaN(connectorId)) {
      return NextResponse.json({ error: 'Invalid connector ID' }, { status: 400 });
    }

    const [config] = await db
      .select()
      .from(connectorConfigurations)
      .where(
        and(
          eq(connectorConfigurations.id, connectorId),
          eq(connectorConfigurations.organizationId, organizationId)
        )
      );

    if (!config) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const mappings = await db
      .select()
      .from(connectorMappings)
      .where(eq(connectorMappings.connectorConfigId, connectorId));

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const organizationId = user.organizationId;

    const { id } = await params;
    const connectorId = parseInt(id, 10);

    if (isNaN(connectorId)) {
      return NextResponse.json({ error: 'Invalid connector ID' }, { status: 400 });
    }

    const [config] = await db
      .select()
      .from(connectorConfigurations)
      .where(
        and(
          eq(connectorConfigurations.id, connectorId),
          eq(connectorConfigurations.organizationId, organizationId)
        )
      );

    if (!config) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createMappingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [mapping] = await db
      .insert(connectorMappings)
      .values({
        connectorConfigId: connectorId,
        sourceObject: parsed.data.sourceObject,
        sourceObjectLabel: parsed.data.sourceObjectLabel,
        caseIdField: parsed.data.caseIdField,
        activityField: parsed.data.activityField,
        timestampField: parsed.data.timestampField,
        resourceField: parsed.data.resourceField,
        additionalFields: parsed.data.additionalFields,
        filterQuery: parsed.data.filterQuery,
        batchSize: parsed.data.batchSize || 200,
        enabled: true,
      })
      .returning();

    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    console.error('Error creating mapping:', error);
    return NextResponse.json(
      { error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}
