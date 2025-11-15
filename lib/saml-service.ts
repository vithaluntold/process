/**
 * Enterprise SSO/SAML Service
 * 
 * Multi-tenant SAML 2.0 authentication service for Fortune 500 deployment.
 * Supports dynamic SAML configuration per organization.
 * 
 * Features:
 * - Multi-tenant SAML configuration
 * - Auto-provisioning of users on first SSO login
 * - Attribute mapping from SAML assertions
 * - SP metadata generation per organization
 * - Clock skew tolerance for distributed systems
 * - Request ID caching for replay attack prevention
 */

import { db } from '@/lib/db';
import * as schema from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import type { Profile as SamlProfile } from '@node-saml/node-saml';

/**
 * In-memory request cache for SAML request ID validation
 * Follows @node-saml/node-saml CacheProvider contract
 * In production, replace with Redis for distributed systems
 */
class SamlRequestCache {
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();

  /**
   * Save a value with TTL
   * @param key The cache key
   * @param value The value to store (must be string for SAML library)
   * @returns The stored value
   */
  async saveAsync(key: string, value: string): Promise<string | null> {
    const expiresAt = Date.now() + 28800000; // 8 hours default TTL
    this.cache.set(key, { value, expiresAt });
    this.cleanup();
    return value;
  }

  /**
   * Get a value from cache
   * @param key The cache key
   * @returns The stored value or null if not found/expired
   */
  async getAsync(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Remove a value from cache
   * @param key The cache key
   * @returns The value that was removed, or null if not found
   */
  async removeAsync(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    this.cache.delete(key);
    return entry.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const samlRequestCache = new SamlRequestCache();

/**
 * Get SAML configuration for an organization
 */
export async function getSamlConfigByOrganizationId(organizationId: number) {
  const [config] = await db
    .select()
    .from(schema.samlConfigurations)
    .where(
      and(
        eq(schema.samlConfigurations.organizationId, organizationId),
        eq(schema.samlConfigurations.enabled, true)
      )
    )
    .limit(1);

  return config || null;
}

/**
 * Get SAML configuration by organization slug
 */
export async function getSamlConfigByOrganizationSlug(slug: string) {
  const [result] = await db
    .select({
      config: schema.samlConfigurations,
      organization: schema.organizations,
    })
    .from(schema.samlConfigurations)
    .innerJoin(
      schema.organizations,
      eq(schema.samlConfigurations.organizationId, schema.organizations.id)
    )
    .where(
      and(
        eq(schema.organizations.slug, slug),
        eq(schema.samlConfigurations.enabled, true)
      )
    )
    .limit(1);

  return result || null;
}

/**
 * Convert SAML configuration to passport-saml options
 */
export function samlConfigToStrategyOptions(
  config: schema.SamlConfiguration,
  organizationSlug: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

  const options: any = {
    // Identity Provider Configuration
    entryPoint: config.idpSsoUrl,
    issuer: config.spEntityId,
    cert: config.idpCertificate,  // IdP certificate for validating responses (DO NOT OVERWRITE!)
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress', // Valid NameID format

    // Service Provider Configuration
    callbackUrl: `${baseUrl}/api/auth/saml/${organizationSlug}/callback`,
    logoutUrl: config.spSingleLogoutUrl || undefined,
    logoutCallbackUrl: config.idpSloUrl || undefined,

    // Signature Settings
    wantAssertionsSigned: config.wantAssertionsSigned,
    wantAuthnResponseSigned: config.wantAuthnResponseSigned,
    signatureAlgorithm: config.signatureAlgorithm,
    digestAlgorithm: config.digestAlgorithm,

    // Advanced Settings
    forceAuthn: config.forceAuthn,
    disableRequestedAuthnContext: false,
    acceptedClockSkewMs: (config.clockTolerance || 300) * 1000, // Convert seconds to ms
    validateInResponseTo: true, // Prevent replay attacks
    requestIdExpirationPeriodMs: 28800000, // 8 hours
    allowUnencryptedAssertion: config.allowUnencryptedAssertion, // Honor encryption settings

    // Passport Configuration
    passReqToCallback: true,
  };

  // Add SP signing credentials if provided (for signed AuthnRequests)
  if (config.spPrivateKey) {
    options.privateKey = config.spPrivateKey;  // For signing AuthnRequests
  }

  // Add SP decryption key if provided (for encrypted assertions)
  // Use dedicated decryption key if available, otherwise fall back to signing key
  if (config.spDecryptionPrivateKey) {
    options.decryptionPvk = config.spDecryptionPrivateKey;
  } else if (config.spPrivateKey) {
    options.decryptionPvk = config.spPrivateKey;  // Fallback: reuse signing key
  }

  // Validate configuration consistency
  if (!options.decryptionPvk && !config.allowUnencryptedAssertion) {
    throw new Error('SAML configuration error: Encrypted assertions required but no decryption key provided');
  }

  // SP certificate will be exposed via metadata generation, not in options
  // (options.cert must remain the IdP certificate for response validation)

  return options;
}

/**
 * Create or update user from SAML profile
 */
export async function findOrCreateUserFromSaml(
  profile: SamlProfile,
  config: schema.SamlConfiguration,
  organizationId: number
): Promise<schema.User> {
  const attributeMapping = config.attributeMapping as Record<string, string>;

  // Extract user attributes from SAML assertion
  const email = extractAttribute(profile, attributeMapping.email) || profile.nameID;
  const firstName = extractAttribute(profile, attributeMapping.firstName) || null;
  const lastName = extractAttribute(profile, attributeMapping.lastName) || null;

  if (!email) {
    throw new Error('Email not found in SAML assertion');
  }

  const normalizedEmail = email.toLowerCase();

  // Try to find existing user
  const [existingUser] = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.email, normalizedEmail),
        eq(schema.users.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existingUser) {
    // Update user's name if changed in IdP
    if (firstName || lastName) {
      const [updatedUser] = await db
        .update(schema.users)
        .set({
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existingUser.id))
        .returning();

      return updatedUser;
    }

    return existingUser;
  }

  // Auto-provision user if enabled
  if (!config.autoProvisionUsers) {
    throw new Error(
      `User ${email} not found and auto-provisioning is disabled for this organization`
    );
  }

  // Create new user
  const randomPassword = await hash(crypto.randomUUID(), 12); // Random password (won't be used for SSO users)

  const [newUser] = await db
    .insert(schema.users)
    .values({
      organizationId,
      email: normalizedEmail,
      password: randomPassword, // SSO users don't use password login
      firstName,
      lastName,
      role: config.defaultRole || 'employee',
      status: 'active',
    })
    .returning();

  // Assign to default team if configured
  if (config.defaultTeamId && newUser) {
    await db.insert(schema.teamMembers).values({
      teamId: config.defaultTeamId,
      userId: newUser.id,
      role: 'member',
    });
  }

  // Log user provisioning event
  await db.insert(schema.auditLogs).values({
    userId: newUser.id,
    action: 'user.sso.auto_provisioned',
    resource: 'user',
    resourceId: newUser.id.toString(),
    metadata: {
      email: normalizedEmail,
      firstName,
      lastName,
      provider: 'saml',
      organizationId,
    },
  });

  return newUser;
}

/**
 * Extract attribute from SAML profile
 */
function extractAttribute(profile: SamlProfile, attributeName: string): string | null {
  if (!attributeName || !profile) return null;

  // Try direct attribute access
  if (profile[attributeName as keyof SamlProfile]) {
    const value = profile[attributeName as keyof SamlProfile];
    return Array.isArray(value) ? value[0] : String(value);
  }

  // Try nested attribute access (common in SAML assertions)
  if (profile.attributes) {
    const attr = profile.attributes[attributeName];
    if (attr) {
      return Array.isArray(attr) ? attr[0] : String(attr);
    }
  }

  return null;
}

/**
 * Validate SAML configuration
 */
export function validateSamlConfig(config: Partial<schema.InsertSamlConfiguration>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!config.idpEntityId) errors.push('IdP Entity ID is required');
  if (!config.idpSsoUrl) errors.push('IdP SSO URL is required');
  if (!config.idpCertificate) errors.push('IdP Certificate is required');
  if (!config.spEntityId) errors.push('SP Entity ID is required');
  if (!config.spAssertionConsumerServiceUrl) errors.push('SP ACS URL is required');

  // Validate URLs
  if (config.idpSsoUrl && !isValidUrl(config.idpSsoUrl)) {
    errors.push('IdP SSO URL must be a valid URL');
  }
  if (config.spAssertionConsumerServiceUrl && !isValidUrl(config.spAssertionConsumerServiceUrl)) {
    errors.push('SP ACS URL must be a valid URL');
  }

  // Validate certificate formats
  if (config.idpCertificate) {
    const cert = config.idpCertificate.trim();
    if (!cert.includes('BEGIN CERTIFICATE') || !cert.includes('END CERTIFICATE')) {
      errors.push('IdP Certificate must be in PEM format');
    }
  }

  if (config.spCertificate) {
    const cert = config.spCertificate.trim();
    if (!cert.includes('BEGIN CERTIFICATE') || !cert.includes('END CERTIFICATE')) {
      errors.push('SP Certificate must be in PEM format');
    }
  }

  // Validate private key formats
  if (config.spPrivateKey) {
    const key = config.spPrivateKey.trim();
    if (!key.includes('BEGIN') || !key.includes('PRIVATE KEY')) {
      errors.push('SP Private Key must be in PEM format');
    }
  }

  if (config.spDecryptionPrivateKey) {
    const key = config.spDecryptionPrivateKey.trim();
    if (!key.includes('BEGIN') || !key.includes('PRIVATE KEY')) {
      errors.push('SP Decryption Private Key must be in PEM format');
    }
  }

  // Validate signing configuration
  if (config.spPrivateKey && !config.spCertificate) {
    errors.push('SP Certificate is required when SP Private Key is provided (for AuthnRequest signing)');
  }

  if (config.spCertificate && !config.spPrivateKey) {
    errors.push('SP Private Key is required when SP Certificate is provided (for AuthnRequest signing)');
  }

  // Validate encryption configuration
  if (config.spDecryptionPrivateKey && !config.spEncryptionCertificate) {
    errors.push('SP Encryption Certificate is required when SP Decryption Private Key is provided');
  }

  if (config.spEncryptionCertificate && !config.spDecryptionPrivateKey) {
    errors.push('SP Decryption Private Key is required when SP Encryption Certificate is provided');
  }

  if (!config.allowUnencryptedAssertion) {
    const hasDecryptionKey = config.spDecryptionPrivateKey || config.spPrivateKey;
    if (!hasDecryptionKey) {
      errors.push('Decryption key required: Either SP Private Key or SP Decryption Private Key must be provided when encrypted assertions are required (allowUnencryptedAssertion is false)');
    }
  }

  // Validate encryption certificate format
  if (config.spEncryptionCertificate) {
    const cert = config.spEncryptionCertificate.trim();
    if (!cert.includes('BEGIN CERTIFICATE') || !cert.includes('END CERTIFICATE')) {
      errors.push('SP Encryption Certificate must be in PEM format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate SP metadata XML for an organization
 */
export async function generateSpMetadata(organizationId: number): Promise<string> {
  const config = await getSamlConfigByOrganizationId(organizationId);

  if (!config) {
    throw new Error('SAML configuration not found for organization');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  if (!org) {
    throw new Error('Organization not found');
  }

  const entityId = config.spEntityId;
  const acsUrl = config.spAssertionConsumerServiceUrl;
  const sloUrl = config.spSingleLogoutUrl;

  // Format SP certificate for XML (remove PEM headers but preserve base64 structure)
  const formatCertForXml = (cert: string | null) => {
    if (!cert) return '';
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .trim();
  };

  const spSigningCertXml = config.spCertificate ? formatCertForXml(config.spCertificate) : '';
  const spEncryptionCertXml = config.spEncryptionCertificate ? formatCertForXml(config.spEncryptionCertificate) : '';

  // SAML metadata rules: AuthnRequestsSigned requires both private key AND certificate
  const authnRequestsSigned = !!(config.spPrivateKey && config.spCertificate);

  // Generate signing KeyDescriptor if signing certificate exists
  const signingKeyDescriptor = spSigningCertXml
    ? `    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${spSigningCertXml}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>`
    : '';

  // Generate encryption KeyDescriptor if encryption certificate exists
  // Use dedicated encryption cert if available, otherwise fall back to signing cert
  const encryptionCertForMetadata = spEncryptionCertXml || spSigningCertXml;
  const encryptionKeyDescriptor = encryptionCertForMetadata
    ? `    <md:KeyDescriptor use="encryption">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${encryptionCertForMetadata}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>`
    : '';

  const keyDescriptors = signingKeyDescriptor + '\n' + encryptionKeyDescriptor;

  // Generate SAML metadata XML
  const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
                     entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="${authnRequestsSigned}" WantAssertionsSigned="${config.wantAssertionsSigned}" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
${keyDescriptors}
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${acsUrl}"
                                 index="1"/>
    ${
      sloUrl
        ? `<md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                   Location="${sloUrl}"/>`
        : ''
    }
  </md:SPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="en">${org.name}</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">${org.name}</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">${baseUrl}</md:OrganizationURL>
  </md:Organization>
</md:EntityDescriptor>`;

  return metadata;
}
