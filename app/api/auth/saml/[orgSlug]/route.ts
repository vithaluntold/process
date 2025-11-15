/**
 * SAML SSO Login Initiation Endpoint
 * 
 * GET /api/auth/saml/{orgSlug}
 * 
 * Generates and signs a proper SAML AuthnRequest, stores request ID for validation,
 * and redirects user to IdP login page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfigByOrganizationSlug, samlConfigToStrategyOptions, samlRequestCache } from '@/lib/saml-service';
import { SAML } from '@node-saml/node-saml';

export async function GET(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { orgSlug } = params;

    // Get SAML configuration for the organization
    const result = await getSamlConfigByOrganizationSlug(orgSlug);

    if (!result) {
      return NextResponse.json(
        { error: 'SAML SSO is not configured for this organization' },
        { status: 404 }
      );
    }

    const { config, organization } = result;

    // Convert config to SAML options with cache provider
    const samlOptions = {
      ...samlConfigToStrategyOptions(config, orgSlug),
      cacheProvider: samlRequestCache,
    };

    // Create SAML instance with shared cache
    const saml = new SAML(samlOptions);

    // Generate SAML AuthnRequest (cache provider automatically stores request ID)
    const { id, context } = await saml.getAuthorizeRequestAsync();

    // Store additional organization metadata linked to request ID
    await samlRequestCache.saveAsync(`${id}_meta`, JSON.stringify({
      orgSlug,
      organizationId: organization.id,
      timestamp: Date.now(),
    }));

    // Redirect to IdP with AuthnRequest
    // Organization context is stored in cache tied to request ID, not cookies
    // (cookies with SameSite=lax won't survive cross-site POST from IdP)
    return NextResponse.redirect(context);
  } catch (error) {
    console.error('SAML login initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate SAML login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
