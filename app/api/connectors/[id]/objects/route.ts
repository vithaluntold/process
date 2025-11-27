import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorOAuthState } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { getConnector } from '@/lib/connectors';
import type { ConnectorType, OAuthTokens, ConnectorContext } from '@/lib/connectors/types';
import { Logger } from '@/lib/logger';

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
    const { searchParams } = new URL(request.url);
    const objectName = searchParams.get('object');

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

    const [oauthState] = await db
      .select()
      .from(connectorOAuthState)
      .where(eq(connectorOAuthState.connectorConfigId, connectorId));

    if (!oauthState) {
      return NextResponse.json(
        { error: 'Connector not authenticated' },
        { status: 400 }
      );
    }

    const connector = getConnector(config.connectorType as ConnectorType);
    const logger = new Logger({ connectorId, organizationId });

    const context: ConnectorContext = {
      organizationId,
      userId: user.id,
      connectorConfigId: connectorId,
      logger: {
        debug: (msg, data) => logger.debug(msg, data),
        info: (msg, data) => logger.info(msg, data),
        warn: (msg, data) => logger.warn(msg, data),
        error: (msg, data) => logger.error(msg, data as Error),
      },
    };

    const tokens: OAuthTokens = {
      accessToken: oauthState.accessTokenEnvelope,
      refreshToken: oauthState.refreshTokenEnvelope || undefined,
      tokenType: oauthState.tokenType || 'Bearer',
      expiresAt: oauthState.expiresAt || undefined,
      instanceUrl: (oauthState.metadata as { instanceUrl?: string })?.instanceUrl || config.instanceUrl || undefined,
      scope: oauthState.scope || undefined,
    };

    if (objectName) {
      const fields = await connector.getFieldsForObject(config, tokens, objectName, context);
      return NextResponse.json({ fields });
    }

    const objects = await connector.getAvailableObjects(config, tokens, context);
    return NextResponse.json({ objects });
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch objects', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
