/**
 * SAML Service Provider Metadata Endpoint
 * 
 * GET /api/auth/saml/{orgSlug}/metadata
 * 
 * Returns SP metadata XML for IdP configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSpMetadata } from '@/lib/saml-service';
import { db } from '@/lib/db';
import * as schema from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;

    // Get organization by slug
    const [organization] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, orgSlug))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Generate SP metadata
    const metadata = await generateSpMetadata(organization.id);

    // Return XML response
    return new NextResponse(metadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${orgSlug}-saml-metadata.xml"`,
      },
    });
  } catch (error) {
    console.error('SAML metadata generation error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate SAML metadata' },
      { status: 500 }
    );
  }
}
