import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connectorConfigurations, connectorHealth } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/server-auth';
import { getConnector } from '@/lib/connectors';
import type { ConnectorType } from '@/lib/connectors/types';
import { validateOAuthState, storeEncryptedTokens } from '@/lib/connectors/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const { id } = await params;
    const connectorId = parseInt(id, 10);

    if (error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent(errorDescription || error)}&connectorId=${connectorId}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/integrations?error=No authorization code received&connectorId=${connectorId}`, request.url)
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL(`/integrations?error=Missing state parameter&connectorId=${connectorId}`, request.url)
      );
    }

    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    const organizationId = user.organizationId;

    const validatedState = validateOAuthState(state, connectorId, organizationId);
    if (!validatedState) {
      return NextResponse.redirect(
        new URL(`/integrations?error=Invalid or expired OAuth state - please try again&connectorId=${connectorId}`, request.url)
      );
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
      return NextResponse.redirect(
        new URL(`/integrations?error=Connector not found&connectorId=${connectorId}`, request.url)
      );
    }

    const connector = getConnector(config.connectorType as ConnectorType);
    
    if (!connector.exchangeCodeForTokens) {
      return NextResponse.redirect(
        new URL(`/integrations?error=OAuth not supported for this connector&connectorId=${connectorId}`, request.url)
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const redirectUri = `${baseUrl}/api/connectors/${connectorId}/oauth/callback`;

    const tokens = await connector.exchangeCodeForTokens(config, code, redirectUri);

    await storeEncryptedTokens(connectorId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: tokens.expiresAt,
      instanceUrl: tokens.instanceUrl,
      scope: tokens.scope,
      metadata: tokens.metadata,
    });

    await db
      .update(connectorConfigurations)
      .set({
        status: 'active',
        instanceUrl: tokens.instanceUrl || config.instanceUrl,
        updatedAt: new Date(),
      })
      .where(eq(connectorConfigurations.id, connectorId));

    await db
      .update(connectorHealth)
      .set({
        status: 'unknown',
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(connectorHealth.connectorConfigId, connectorId));

    return NextResponse.redirect(
      new URL(`/integrations?success=true&connectorId=${connectorId}`, request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    const { id } = await params;
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth failed')}&connectorId=${id}`, request.url)
    );
  }
}
