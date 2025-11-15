/**
 * SAML Assertion Consumer Service (ACS) Endpoint
 * 
 * POST /api/auth/saml/{orgSlug}/callback
 * 
 * Receives SAML assertion from IdP, validates signature and InResponseTo,
 * provisions user, and creates authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfigByOrganizationSlug, samlConfigToStrategyOptions, findOrCreateUserFromSaml, samlRequestCache } from '@/lib/saml-service';
import { SAML, type Profile as SamlProfile } from '@node-saml/node-saml';
import { sign } from 'jsonwebtoken';
import { db } from '@/lib/db';
import * as schema from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  try {
    const { orgSlug } = params;

    // Get SAML configuration
    const result = await getSamlConfigByOrganizationSlug(orgSlug);

    if (!result) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=saml_not_configured`
      );
    }

    const { config, organization } = result;

    // Parse SAML response from request body
    const formData = await request.formData();
    const samlResponse = formData.get('SAMLResponse') as string;
    const relayState = formData.get('RelayState') as string | null;

    if (!samlResponse) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=invalid_saml_response`
      );
    }

    // Convert config to SAML options with shared cache
    const samlOptions = {
      ...samlConfigToStrategyOptions(config, orgSlug),
      cacheProvider: samlRequestCache,
    };

    // Create SAML instance with shared cache
    const saml = new SAML(samlOptions);

    // Validate SAML assertion (includes InResponseTo validation and signature verification)
    const { profile, loggedOut } = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });

    if (!profile) {
      throw new Error('No profile returned from SAML assertion');
    }

    // SECURITY: Retrieve and validate organization from cached request metadata
    // This is safer than cookies which may not survive cross-site POST from IdP
    const inResponseTo = (profile as any).inResponseTo;
    
    if (!inResponseTo) {
      throw new Error('Missing InResponseTo in SAML response');
    }

    // Retrieve organization metadata stored during login initiation
    const cachedMetaJson = await samlRequestCache.getAsync(`${inResponseTo}_meta`);
    
    if (!cachedMetaJson) {
      console.error('No cached metadata found for SAML request:', { inResponseTo, orgSlug });
      
      await db.insert(schema.auditLogs).values({
        action: 'user.sso.missing_metadata',
        resource: 'authentication',
        metadata: {
          provider: 'saml',
          inResponseTo,
          orgSlug,
          severity: 'CRITICAL',
        },
      });

      throw new Error('SAML request metadata not found - possible replay attack or expired session');
    }

    const cachedMeta = JSON.parse(cachedMetaJson);

    // Validate organization matches the one from login initiation
    if (cachedMeta.organizationId !== organization.id || cachedMeta.orgSlug !== orgSlug) {
      console.error('Organization mismatch in SAML callback:', {
        expectedOrgId: organization.id,
        cachedOrgId: cachedMeta.organizationId,
        expectedSlug: orgSlug,
        cachedSlug: cachedMeta.orgSlug,
      });

      await db.insert(schema.auditLogs).values({
        action: 'user.sso.org_mismatch',
        resource: 'authentication',
        metadata: {
          provider: 'saml',
          expectedOrgId: organization.id,
          cachedOrgId: cachedMeta.organizationId,
          inResponseTo,
          severity: 'CRITICAL',
        },
      });

      throw new Error('Organization validation failed - possible cross-tenant attack');
    }

    // Clean up metadata after successful validation
    await samlRequestCache.removeAsync(`${inResponseTo}_meta`);

    // Find or create user from SAML profile
    const user = await findOrCreateUserFromSaml(profile, config, organization.id);

    // Update last tested timestamp
    await db
      .update(schema.samlConfigurations)
      .set({ lastTestedAt: new Date() })
      .where(eq(schema.samlConfigurations.id, config.id));

    // Log successful SSO login
    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: 'user.sso.login',
      resource: 'authentication',
      resourceId: user.id.toString(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        provider: 'saml',
        organizationId: organization.id,
        email: user.email,
        nameId: profile.nameID,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId!,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create session cookie and redirect
    const response = NextResponse.redirect(
      relayState || `${process.env.NEXT_PUBLIC_APP_URL}/`
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('SAML callback error:', error);
    
    // Log failed login attempt
    const orgIdCookie = request.cookies.get('saml_org_id')?.value;
    if (orgIdCookie) {
      try {
        await db.insert(schema.auditLogs).values({
          action: 'user.sso.login_failed',
          resource: 'authentication',
          metadata: {
            provider: 'saml',
            organizationId: parseInt(orgIdCookie),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin?error=saml_callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}
