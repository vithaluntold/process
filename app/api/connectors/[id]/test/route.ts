import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorHealth } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { getConnector } from '@/lib/connectors';
import type { ConnectorType, OAuthTokens, ConnectorContext } from '@/lib/connectors/types';
import { getDecryptedTokens } from '@/lib/connectors/security';
import { Logger } from '@/lib/logger';

export async function POST(
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

    const decryptedTokens = await getDecryptedTokens(connectorId);
    if (!decryptedTokens) {
      return NextResponse.json(
        { error: 'Connector not authenticated. Please complete OAuth setup.' },
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
      accessToken: decryptedTokens.accessToken,
      refreshToken: decryptedTokens.refreshToken,
      tokenType: decryptedTokens.tokenType,
      expiresAt: decryptedTokens.expiresAt,
      instanceUrl: decryptedTokens.instanceUrl || config.instanceUrl || undefined,
      scope: decryptedTokens.scope,
    };

    const result = await connector.testConnection(config, tokens, context);

    const healthStatus = result.success ? 'healthy' : 'unhealthy';
    await db
      .update(connectorHealth)
      .set({
        status: healthStatus,
        lastSuccessAt: result.success ? new Date() : undefined,
        lastFailureAt: result.success ? undefined : new Date(),
        consecutiveFailures: result.success ? 0 : 1,
        consecutiveSuccesses: result.success ? 1 : 0,
        averageLatencyMs: result.latencyMs,
        lastErrorMessage: result.success ? null : result.message,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(connectorHealth.connectorConfigId, connectorId));

    if (result.success && config.status !== 'active') {
      await db
        .update(connectorConfigurations)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(connectorConfigurations.id, connectorId));
    } else if (!result.success && config.status === 'active') {
      await db
        .update(connectorConfigurations)
        .set({ status: 'error', updatedAt: new Date() })
        .where(eq(connectorConfigurations.id, connectorId));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing connector:', error);
    return NextResponse.json(
      { error: 'Failed to test connector', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
