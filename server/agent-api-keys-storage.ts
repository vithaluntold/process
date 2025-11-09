import { db } from "@/lib/db";
import { agentApiKeys, agentEncryptionKeys, auditLogs } from "../shared/schema";
import { eq, and, desc, isNull, gte } from "drizzle-orm";
import { CryptoUtils } from "./crypto-utils";

export interface ApiKeyRecord {
  id: number;
  userId: number;
  keyPrefix: string;
  label: string | null;
  status: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyParams {
  userId: number;
  label?: string;
  expiresInDays?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidateApiKeyResult {
  valid: boolean;
  userId?: number;
  keyId?: number;
}

export class AgentApiKeysStorage {
  async createApiKey(params: CreateApiKeyParams): Promise<{ key: string; record: ApiKeyRecord }> {
    const { userId, label, expiresInDays, ipAddress, userAgent } = params;

    const { fullKey, prefix, hashedKey } = CryptoUtils.generateApiKey();

    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const [record] = await db
      .insert(agentApiKeys)
      .values({
        userId,
        keyPrefix: prefix,
        hashedKey,
        label: label || null,
        status: 'active',
        expiresAt,
        metadata: null,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId,
      action: 'create_agent_api_key',
      resource: 'agent_api_keys',
      resourceId: record.id.toString(),
      ipAddress,
      userAgent,
      metadata: { keyPrefix: prefix, label },
    });

    return {
      key: fullKey,
      record: {
        id: record.id,
        userId: record.userId,
        keyPrefix: record.keyPrefix,
        label: record.label,
        status: record.status,
        lastUsedAt: record.lastUsedAt,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
      },
    };
  }

  async listApiKeys(userId: number): Promise<ApiKeyRecord[]> {
    const keys = await db
      .select({
        id: agentApiKeys.id,
        userId: agentApiKeys.userId,
        keyPrefix: agentApiKeys.keyPrefix,
        label: agentApiKeys.label,
        status: agentApiKeys.status,
        lastUsedAt: agentApiKeys.lastUsedAt,
        expiresAt: agentApiKeys.expiresAt,
        createdAt: agentApiKeys.createdAt,
      })
      .from(agentApiKeys)
      .where(eq(agentApiKeys.userId, userId))
      .orderBy(desc(agentApiKeys.createdAt));

    return keys;
  }

  async revokeApiKey(userId: number, keyId: number, ipAddress?: string, userAgent?: string): Promise<boolean> {
    const [updated] = await db
      .update(agentApiKeys)
      .set({
        status: 'revoked',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentApiKeys.id, keyId),
          eq(agentApiKeys.userId, userId)
        )
      )
      .returning();

    if (updated) {
      await db.insert(auditLogs).values({
        userId,
        action: 'revoke_agent_api_key',
        resource: 'agent_api_keys',
        resourceId: keyId.toString(),
        ipAddress,
        userAgent,
        metadata: { keyPrefix: updated.keyPrefix },
      });
    }

    return !!updated;
  }

  async validateApiKey(providedKey: string): Promise<ValidateApiKeyResult> {
    if (!providedKey || !providedKey.startsWith('epix_')) {
      return { valid: false };
    }

    const prefix = providedKey.substring(0, 12);

    const keys = await db
      .select()
      .from(agentApiKeys)
      .where(
        and(
          eq(agentApiKeys.keyPrefix, prefix),
          eq(agentApiKeys.status, 'active'),
          isNull(agentApiKeys.expiresAt)
        )
      );

    if (keys.length === 0) {
      const keysWithExpiry = await db
        .select()
        .from(agentApiKeys)
        .where(
          and(
            eq(agentApiKeys.keyPrefix, prefix),
            eq(agentApiKeys.status, 'active'),
            gte(agentApiKeys.expiresAt, new Date())
          )
        );

      if (keysWithExpiry.length === 0) {
        return { valid: false };
      }

      for (const key of keysWithExpiry) {
        if (CryptoUtils.verifyApiKey(providedKey, key.hashedKey)) {
          await db
            .update(agentApiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(agentApiKeys.id, key.id));

          return { valid: true, userId: key.userId, keyId: key.id };
        }
      }

      return { valid: false };
    }

    for (const key of keys) {
      if (CryptoUtils.verifyApiKey(providedKey, key.hashedKey)) {
        await db
          .update(agentApiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(agentApiKeys.id, key.id));

        return { valid: true, userId: key.userId, keyId: key.id };
      }
    }

    return { valid: false };
  }

  async getOrCreateEncryptionKey(userId: number): Promise<string> {
    const [existing] = await db
      .select()
      .from(agentEncryptionKeys)
      .where(eq(agentEncryptionKeys.userId, userId));

    if (existing) {
      const masterKeyB64 = process.env.MASTER_ENCRYPTION_KEY;
      if (!masterKeyB64) {
        throw new Error('MASTER_ENCRYPTION_KEY environment variable not set');
      }
      const masterKey = Buffer.from(masterKeyB64, 'base64');
      return CryptoUtils.decryptAESKey(existing.encryptedAesKey, masterKey);
    }

    const { key, encryptedKey } = CryptoUtils.generateAESKey();

    await db.insert(agentEncryptionKeys).values({
      userId,
      encryptedAesKey: encryptedKey,
      algorithm: 'aes-256-gcm',
    });

    return key;
  }

  async getEncryptionKey(userId: number): Promise<string | null> {
    const [record] = await db
      .select()
      .from(agentEncryptionKeys)
      .where(eq(agentEncryptionKeys.userId, userId));

    if (!record) {
      return null;
    }

    const masterKeyB64 = process.env.MASTER_ENCRYPTION_KEY;
    if (!masterKeyB64) {
      throw new Error('MASTER_ENCRYPTION_KEY environment variable not set');
    }
    const masterKey = Buffer.from(masterKeyB64, 'base64');
    return CryptoUtils.decryptAESKey(record.encryptedAesKey, masterKey);
  }
}
