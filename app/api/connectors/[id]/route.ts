import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  connectorConfigurations,
  connectorHealth,
  connectorMappings,
  connectorRuns,
} from '@/shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';

const updateConnectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  instanceUrl: z.string().url().optional(),
  scopes: z.string().optional(),
  scheduleCron: z.string().optional(),
  syncEnabled: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
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

    const [connector] = await db
      .select()
      .from(connectorConfigurations)
      .where(
        and(
          eq(connectorConfigurations.id, connectorId),
          eq(connectorConfigurations.organizationId, organizationId)
        )
      );

    if (!connector) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const [health] = await db
      .select()
      .from(connectorHealth)
      .where(eq(connectorHealth.connectorConfigId, connectorId));

    const mappings = await db
      .select()
      .from(connectorMappings)
      .where(eq(connectorMappings.connectorConfigId, connectorId));

    const recentRuns = await db
      .select()
      .from(connectorRuns)
      .where(eq(connectorRuns.connectorConfigId, connectorId))
      .orderBy(desc(connectorRuns.createdAt))
      .limit(10);

    return NextResponse.json({
      connector,
      health,
      mappings,
      recentRuns,
    });
  } catch (error) {
    console.error('Error fetching connector:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connector' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const [existing] = await db
      .select()
      .from(connectorConfigurations)
      .where(
        and(
          eq(connectorConfigurations.id, connectorId),
          eq(connectorConfigurations.organizationId, organizationId)
        )
      );

    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateConnectorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Partial<typeof connectorConfigurations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.instanceUrl) updates.instanceUrl = parsed.data.instanceUrl;
    if (parsed.data.scopes) updates.scopes = parsed.data.scopes;
    if (parsed.data.scheduleCron) updates.scheduleCron = parsed.data.scheduleCron;
    if (parsed.data.syncEnabled !== undefined) updates.syncEnabled = parsed.data.syncEnabled;
    if (parsed.data.metadata) updates.metadata = parsed.data.metadata;

    const [connector] = await db
      .update(connectorConfigurations)
      .set(updates)
      .where(eq(connectorConfigurations.id, connectorId))
      .returning();

    return NextResponse.json({ connector });
  } catch (error) {
    console.error('Error updating connector:', error);
    return NextResponse.json(
      { error: 'Failed to update connector' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const [existing] = await db
      .select()
      .from(connectorConfigurations)
      .where(
        and(
          eq(connectorConfigurations.id, connectorId),
          eq(connectorConfigurations.organizationId, organizationId)
        )
      );

    if (!existing) {
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
    }

    await db
      .delete(connectorConfigurations)
      .where(eq(connectorConfigurations.id, connectorId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connector:', error);
    return NextResponse.json(
      { error: 'Failed to delete connector' },
      { status: 500 }
    );
  }
}
