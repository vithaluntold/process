import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { getConnector } from '@/lib/connectors';
import type { ConnectorType } from '@/lib/connectors/types';
import crypto from 'crypto';

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

    const connector = getConnector(config.connectorType as ConnectorType);
    
    if (!connector.buildAuthUrl) {
      return NextResponse.json(
        { error: 'OAuth not supported for this connector type' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const redirectUri = `${baseUrl}/api/connectors/${connectorId}/oauth/callback`;
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = connector.buildAuthUrl(config, redirectUri, state);

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
