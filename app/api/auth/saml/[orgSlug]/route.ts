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
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;

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

    // Generate SAML AuthnRequest URL
    const loginUrl = await saml.getAuthorizeUrlAsync('', '', {});
    
    // The cache provider should automatically store the request ID when generating the URL
    // We'll rely on the InResponseTo validation in the callback

    // Redirect to IdP with AuthnRequest
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('SAML login initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate SAML login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
