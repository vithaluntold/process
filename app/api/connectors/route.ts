import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorHealth } from '@/shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getAvailableConnectors } from '@/lib/connectors';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';

const createConnectorSchema = z.object({
  name: z.string().min(1).max(100),
  connectorType: z.enum(['salesforce', 'servicenow', 'sap', 'dynamics', 'oracle', 'custom']),
  authType: z.enum(['oauth2', 'basic', 'api_key', 'jwt']),
  instanceUrl: z.string().url().optional(),
  scopes: z.string().optional(),
  scheduleCron: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = user.organizationId;

    const { searchParams } = new URL(request.url);
    const includeHealth = searchParams.get('includeHealth') === 'true';
    const type = searchParams.get('type');

    let query = db
      .select()
      .from(connectorConfigurations)
      .where(eq(connectorConfigurations.organizationId, organizationId));

    if (type) {
      query = db
        .select()
        .from(connectorConfigurations)
        .where(
          and(
            eq(connectorConfigurations.organizationId, organizationId),
            eq(connectorConfigurations.connectorType, type)
          )
        );
    }

    const connectors = await query;

    if (includeHealth && connectors.length > 0) {
      const connectorIds = connectors.map((c) => c.id);
      const healthRecords = await db
        .select()
        .from(connectorHealth)
        .where(
          sql`${connectorHealth.connectorConfigId} = ANY(ARRAY[${sql.join(connectorIds, sql`, `)}]::int[])`
        );

      const healthMap = new Map(healthRecords.map((h) => [h.connectorConfigId, h]));

      return NextResponse.json({
        connectors: connectors.map((c) => ({
          ...c,
          health: healthMap.get(c.id) || null,
        })),
        availableTypes: getAvailableConnectors(),
      });
    }

    return NextResponse.json({
      connectors,
      availableTypes: getAvailableConnectors(),
    });
  } catch (error) {
    console.error('Error fetching connectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connectors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const organizationId = user.organizationId;

    const body = await request.json();
    const parsed = createConnectorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, connectorType, authType, instanceUrl, scopes, scheduleCron, metadata } = parsed.data;

    const [connector] = await db
      .insert(connectorConfigurations)
      .values({
        organizationId,
        name,
        connectorType,
        authType,
        instanceUrl,
        scopes,
        scheduleCron: scheduleCron || '0 */4 * * *',
        status: 'inactive',
        syncEnabled: true,
        metadata: metadata || {},
        createdBy: user.id,
      })
      .returning();

    await db.insert(connectorHealth).values({
      connectorConfigId: connector.id,
      status: 'unknown',
    });

    return NextResponse.json({ connector }, { status: 201 });
  } catch (error) {
    console.error('Error creating connector:', error);
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    );
  }
}
