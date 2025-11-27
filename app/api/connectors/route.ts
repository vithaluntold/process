import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorHealth } from '@/shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getAvailableConnectors } from '@/lib/connectors';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';

const createConnectorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(100).optional(),
  connectorType: z.enum(['salesforce', 'servicenow', 'sap', 'dynamics', 'oracle', 'streaming', 'custom']),
  authType: z.enum(['oauth2', 'basic', 'api_key', 'jwt']).optional(),
  instanceUrl: z.string().url().optional().or(z.string().max(0)),
  scopes: z.string().optional(),
  scheduleCron: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  config: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
  }).optional(),
}).refine(data => data.name || data.displayName, {
  message: 'Either name or displayName is required',
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

    const formatConnector = (c: typeof connectors[0]) => ({
      ...c,
      displayName: c.name,
    });

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
          ...formatConnector(c),
          health: healthMap.get(c.id) || null,
        })),
        availableTypes: getAvailableConnectors(),
      });
    }

    return NextResponse.json({
      connectors: connectors.map(formatConnector),
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

    const { name, displayName, connectorType, authType, instanceUrl, scopes, scheduleCron, metadata, config } = parsed.data;

    const connectorName = name || displayName || 'Unnamed Connector';
    
    const defaultAuthType = connectorType === 'streaming' ? 'api_key' : 'oauth2';

    const [connector] = await db
      .insert(connectorConfigurations)
      .values({
        organizationId,
        name: connectorName,
        connectorType,
        authType: authType || defaultAuthType,
        instanceUrl: instanceUrl || null,
        scopes: scopes || null,
        scheduleCron: scheduleCron || '0 */4 * * *',
        status: 'inactive',
        syncEnabled: true,
        metadata: metadata || {},
        credentialsEnvelope: config ? JSON.stringify(config) : null,
        createdBy: user.id,
      })
      .returning();

    await db.insert(connectorHealth).values({
      connectorConfigId: connector.id,
      status: 'unknown',
    });

    return NextResponse.json({ 
      connector: {
        ...connector,
        displayName: connector.name,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating connector:', error);
    return NextResponse.json(
      { error: 'Failed to create connector' },
      { status: 500 }
    );
  }
}
