/**
 * SAML Configuration Management API
 * 
 * GET /api/admin/saml-config - Get organization's SAML configuration
 * POST /api/admin/saml-config - Create/update SAML configuration
 * 
 * Admin only endpoint for managing SSO/SAML settings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminHandler } from '@/lib/tenant-api-factory';
import { db } from '@/lib/db';
import * as schema from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { validateSamlConfig } from '@/lib/saml-service';
import { z } from 'zod';

const samlConfigSchema = z.object({
  enabled: z.boolean().optional(),
  idpEntityId: z.string().min(1, 'IdP Entity ID is required'),
  idpSsoUrl: z.string().url('IdP SSO URL must be a valid URL'),
  idpSloUrl: z.string().url().optional().nullable(),
  idpCertificate: z.string().min(1, 'IdP Certificate is required'),
  spEntityId: z.string().min(1, 'SP Entity ID is required'),
  spAssertionConsumerServiceUrl: z.string().url('SP ACS URL must be a valid URL'),
  spSingleLogoutUrl: z.string().url().optional().nullable(),
  wantAssertionsSigned: z.boolean().optional(),
  wantAuthnResponseSigned: z.boolean().optional(),
  signatureAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).optional(),
  digestAlgorithm: z.enum(['sha1', 'sha256', 'sha512']).optional(),
  attributeMapping: z.record(z.string()).optional(),
  autoProvisionUsers: z.boolean().optional(),
  defaultRole: z.enum(['admin', 'employee']).optional(),
  defaultTeamId: z.number().optional().nullable(),
  forceAuthn: z.boolean().optional(),
  allowUnencryptedAssertion: z.boolean().optional(),
  clockTolerance: z.number().optional(),
});

export const GET = createAdminHandler(async (request, context) => {
  try {
    const { organizationId } = context;

    // Get SAML configuration for the organization
    const [config] = await db
      .select()
      .from(schema.samlConfigurations)
      .where(eq(schema.samlConfigurations.organizationId, organizationId))
      .limit(1);

    if (!config) {
      return NextResponse.json({ 
        config: null,
        message: 'SAML configuration not found' 
      }, { status: 200 });
    }

    // Return config
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get SAML config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = createAdminHandler(async (request, context) => {
  try {
    const { userId, organizationId } = context;

    const body = await request.json();
    const validatedData = samlConfigSchema.parse(body);

    // Additional validation
    const validation = validateSamlConfig(validatedData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid SAML configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Check if config already exists
    const [existingConfig] = await db
      .select()
      .from(schema.samlConfigurations)
      .where(eq(schema.samlConfigurations.organizationId, organizationId))
      .limit(1);

    let config;

    if (existingConfig) {
      // Update existing configuration
      const [updatedConfig] = await db
        .update(schema.samlConfigurations)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(schema.samlConfigurations.id, existingConfig.id))
        .returning();

      config = updatedConfig;

      // Log update
      await db.insert(schema.auditLogs).values({
        userId,
        action: 'saml_config.updated',
        resource: 'saml_configuration',
        resourceId: config.id.toString(),
        metadata: {
          organizationId,
          enabled: validatedData.enabled,
        },
      });
    } else {
      // Create new configuration
      const [newConfig] = await db
        .insert(schema.samlConfigurations)
        .values({
          organizationId,
          ...validatedData,
          createdBy: userId,
        })
        .returning();

      config = newConfig;

      // Log creation
      await db.insert(schema.auditLogs).values({
        userId,
        action: 'saml_config.created',
        resource: 'saml_configuration',
        resourceId: config.id.toString(),
        metadata: {
          organizationId,
          enabled: validatedData.enabled,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      config,
      message: existingConfig ? 'SAML configuration updated successfully' : 'SAML configuration created successfully'
    });
  } catch (error) {
    console.error('Save SAML config error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = createAdminHandler(async (request, context) => {
  try {
    const { userId, organizationId } = context;

    // Delete SAML configuration
    const [deletedConfig] = await db
      .delete(schema.samlConfigurations)
      .where(eq(schema.samlConfigurations.organizationId, organizationId))
      .returning();

    if (!deletedConfig) {
      return NextResponse.json({ error: 'SAML configuration not found' }, { status: 404 });
    }

    // Log deletion
    await db.insert(schema.auditLogs).values({
      userId,
      action: 'saml_config.deleted',
      resource: 'saml_configuration',
      resourceId: deletedConfig.id.toString(),
      metadata: {
        organizationId,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'SAML configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete SAML config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
