import crypto from 'crypto';
import { db } from '@/lib/db';
import { connectorOAuthState, connectorConfigurations } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { EnvelopeEncryptionService, KMSConfig, KMSProvider } from '@/lib/security/envelope-encryption';
import type { OAuthTokens } from './types';

const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000;

const oauthPendingStates = new Map<string, { 
  connectorId: number; 
  organizationId: number; 
  expiresAt: number;
  nonce: string;
}>();

setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthPendingStates.entries()) {
    if (data.expiresAt < now) {
      oauthPendingStates.delete(state);
    }
  }
}, 60 * 1000);

export function generateOAuthState(connectorId: number, organizationId: number): string {
  const state = crypto.randomBytes(32).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  
  oauthPendingStates.set(state, {
    connectorId,
    organizationId,
    expiresAt: Date.now() + OAUTH_STATE_EXPIRY_MS,
    nonce,
  });
  
  return state;
}

export interface ValidatedOAuthState {
  connectorId: number;
  organizationId: number;
}

export function validateOAuthState(state: string, expectedConnectorId: number, expectedOrganizationId: number): ValidatedOAuthState | null {
  const pending = oauthPendingStates.get(state);
  
  if (!pending) {
    return null;
  }
  
  if (pending.expiresAt < Date.now()) {
    oauthPendingStates.delete(state);
    return null;
  }
  
  if (pending.connectorId !== expectedConnectorId || pending.organizationId !== expectedOrganizationId) {
    return null;
  }
  
  oauthPendingStates.delete(state);
  
  return {
    connectorId: pending.connectorId,
    organizationId: pending.organizationId,
  };
}

function getKMSConfig(): KMSConfig {
  const provider = (process.env.KMS_PROVIDER || 'local') as KMSProvider;
  
  switch (provider) {
    case 'aws':
      return {
        provider: 'aws',
        awsConfig: {
          region: process.env.AWS_REGION || 'us-east-1',
          keyId: process.env.AWS_KMS_KEY_ID || '',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      };
    case 'gcp':
      return {
        provider: 'gcp',
        gcpConfig: {
          projectId: process.env.GCP_PROJECT_ID || '',
          locationId: process.env.GCP_KMS_LOCATION || 'global',
          keyRingId: process.env.GCP_KMS_KEYRING || '',
          keyId: process.env.GCP_KMS_KEY || '',
          credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        },
      };
    case 'azure':
      return {
        provider: 'azure',
        azureConfig: {
          vaultUrl: process.env.AZURE_KEYVAULT_URL || '',
          keyName: process.env.AZURE_KEY_NAME || '',
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
        },
      };
    default:
      return {
        provider: 'local',
        localConfig: {
          masterKey: process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
        },
      };
  }
}

let encryptionService: EnvelopeEncryptionService | null = null;

function getEncryptionService(): EnvelopeEncryptionService {
  if (!encryptionService) {
    encryptionService = new EnvelopeEncryptionService(getKMSConfig());
  }
  return encryptionService;
}


export interface EncryptedOAuthTokens {
  accessTokenEnvelope: string;
  refreshTokenEnvelope?: string;
  tokenType: string;
  expiresAt?: Date;
  instanceUrl?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
}

export async function encryptOAuthTokens(tokens: OAuthTokens): Promise<EncryptedOAuthTokens> {
  const service = getEncryptionService();
  
  const accessEnvelope = await service.encrypt(tokens.accessToken);
  const accessTokenEnvelope = JSON.stringify(accessEnvelope);
  
  let refreshTokenEnvelope: string | undefined;
  if (tokens.refreshToken) {
    const refreshEnvelope = await service.encrypt(tokens.refreshToken);
    refreshTokenEnvelope = JSON.stringify(refreshEnvelope);
  }
  
  return {
    accessTokenEnvelope,
    refreshTokenEnvelope,
    tokenType: tokens.tokenType || 'Bearer',
    expiresAt: tokens.expiresAt,
    instanceUrl: tokens.instanceUrl,
    scope: tokens.scope,
    metadata: tokens.metadata,
  };
}

export async function decryptOAuthTokens(encrypted: EncryptedOAuthTokens): Promise<OAuthTokens> {
  const service = getEncryptionService();
  
  let accessToken: string;
  try {
    const accessEnvelope = JSON.parse(encrypted.accessTokenEnvelope);
    if (accessEnvelope.ciphertext) {
      const decrypted = await service.decrypt(accessEnvelope);
      accessToken = decrypted.toString('utf8');
    } else {
      accessToken = encrypted.accessTokenEnvelope;
    }
  } catch {
    accessToken = encrypted.accessTokenEnvelope;
  }
  
  let refreshToken: string | undefined;
  if (encrypted.refreshTokenEnvelope) {
    try {
      const refreshEnvelope = JSON.parse(encrypted.refreshTokenEnvelope);
      if (refreshEnvelope.ciphertext) {
        const decrypted = await service.decrypt(refreshEnvelope);
        refreshToken = decrypted.toString('utf8');
      } else {
        refreshToken = encrypted.refreshTokenEnvelope;
      }
    } catch {
      refreshToken = encrypted.refreshTokenEnvelope;
    }
  }
  
  return {
    accessToken,
    refreshToken,
    tokenType: encrypted.tokenType,
    expiresAt: encrypted.expiresAt,
    instanceUrl: encrypted.instanceUrl,
    scope: encrypted.scope,
    metadata: encrypted.metadata,
  };
}

export async function storeEncryptedTokens(
  connectorId: number,
  tokens: OAuthTokens
): Promise<void> {
  const encrypted = await encryptOAuthTokens(tokens);
  
  const existing = await db
    .select()
    .from(connectorOAuthState)
    .where(eq(connectorOAuthState.connectorConfigId, connectorId));
  
  if (existing.length > 0) {
    await db
      .update(connectorOAuthState)
      .set({
        accessTokenEnvelope: encrypted.accessTokenEnvelope,
        refreshTokenEnvelope: encrypted.refreshTokenEnvelope,
        tokenType: encrypted.tokenType,
        expiresAt: encrypted.expiresAt,
        lastRefreshedAt: new Date(),
        scope: encrypted.scope,
        metadata: { instanceUrl: encrypted.instanceUrl, ...encrypted.metadata },
      })
      .where(eq(connectorOAuthState.connectorConfigId, connectorId));
  } else {
    await db.insert(connectorOAuthState).values({
      connectorConfigId: connectorId,
      accessTokenEnvelope: encrypted.accessTokenEnvelope,
      refreshTokenEnvelope: encrypted.refreshTokenEnvelope,
      tokenType: encrypted.tokenType,
      expiresAt: encrypted.expiresAt,
      scope: encrypted.scope,
      metadata: { instanceUrl: encrypted.instanceUrl, ...encrypted.metadata },
    });
  }
}

export async function getDecryptedTokens(connectorId: number): Promise<OAuthTokens | null> {
  const [oauthState] = await db
    .select()
    .from(connectorOAuthState)
    .where(eq(connectorOAuthState.connectorConfigId, connectorId));
  
  if (!oauthState) {
    return null;
  }
  
  return decryptOAuthTokens({
    accessTokenEnvelope: oauthState.accessTokenEnvelope,
    refreshTokenEnvelope: oauthState.refreshTokenEnvelope || undefined,
    tokenType: oauthState.tokenType || 'Bearer',
    expiresAt: oauthState.expiresAt || undefined,
    instanceUrl: (oauthState.metadata as { instanceUrl?: string })?.instanceUrl,
    scope: oauthState.scope || undefined,
    metadata: oauthState.metadata as Record<string, unknown> | undefined,
  });
}
