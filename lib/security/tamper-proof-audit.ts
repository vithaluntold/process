import crypto from 'crypto';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: number | null;
  organizationId: number | null;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  previousHash: string;
  hash: string;
  signature: string;
  nonce: number;
}

export interface AuditLogConfig {
  signingKey: string;
  difficulty?: number;
  enableProofOfWork?: boolean;
}

export class TamperProofAuditLogger {
  private readonly signingKey: Buffer;
  private readonly difficulty: number;
  private readonly enableProofOfWork: boolean;
  private lastHash: string | null = null;
  private readonly ALGORITHM = 'sha256';

  constructor(config: AuditLogConfig) {
    this.signingKey = crypto.createHash('sha256').update(config.signingKey).digest();
    this.difficulty = config.difficulty || 2;
    this.enableProofOfWork = config.enableProofOfWork ?? false;
  }

  private computeHash(entry: Omit<AuditEntry, 'hash' | 'signature'>): string {
    const data = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      userId: entry.userId,
      organizationId: entry.organizationId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      previousHash: entry.previousHash,
      nonce: entry.nonce,
    });

    return crypto.createHash(this.ALGORITHM).update(data).digest('hex');
  }

  private generateSignature(hash: string): string {
    return crypto.createHmac(this.ALGORITHM, this.signingKey).update(hash).digest('hex');
  }

  private proofOfWork(entry: Omit<AuditEntry, 'hash' | 'signature'>): { nonce: number; hash: string } {
    let nonce = 0;
    let hash = this.computeHash({ ...entry, nonce });

    if (this.enableProofOfWork) {
      const target = '0'.repeat(this.difficulty);
      while (!hash.startsWith(target)) {
        nonce++;
        hash = this.computeHash({ ...entry, nonce });
        if (nonce > 1000000) {
          break;
        }
      }
    }

    return { nonce, hash };
  }

  async getLastHash(): Promise<string> {
    if (this.lastHash) {
      return this.lastHash;
    }

    try {
      const result = await db.execute(sql`
        SELECT hash FROM tamper_proof_audit_logs 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (result.rows && result.rows.length > 0) {
        this.lastHash = result.rows[0].hash as string;
        return this.lastHash;
      }
    } catch (error) {
      console.log('Audit table may not exist yet, starting fresh chain');
    }

    return 'GENESIS';
  }

  async log(params: {
    action: string;
    userId?: number | null;
    organizationId?: number | null;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditEntry> {
    const previousHash = await this.getLastHash();

    const baseEntry: Omit<AuditEntry, 'hash' | 'signature'> = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: params.action,
      userId: params.userId ?? null,
      organizationId: params.organizationId ?? null,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      previousHash,
      nonce: 0,
    };

    const { nonce, hash } = this.proofOfWork(baseEntry);
    const signature = this.generateSignature(hash);

    const entry: AuditEntry = {
      ...baseEntry,
      nonce,
      hash,
      signature,
    };

    await this.persistEntry(entry);

    this.lastHash = hash;

    return entry;
  }

  private async persistEntry(entry: AuditEntry): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO tamper_proof_audit_logs (
          id, timestamp, action, user_id, organization_id,
          resource_type, resource_id, metadata, ip_address, user_agent,
          previous_hash, hash, signature, nonce, created_at
        ) VALUES (
          ${entry.id},
          ${entry.timestamp},
          ${entry.action},
          ${entry.userId},
          ${entry.organizationId},
          ${entry.resourceType},
          ${entry.resourceId},
          ${JSON.stringify(entry.metadata)},
          ${entry.ipAddress},
          ${entry.userAgent},
          ${entry.previousHash},
          ${entry.hash},
          ${entry.signature},
          ${entry.nonce},
          NOW()
        )
      `);
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        await this.createTable();
        await this.persistEntry(entry);
      } else {
        throw error;
      }
    }
  }

  private async createTable(): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tamper_proof_audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        action VARCHAR(255) NOT NULL,
        user_id INTEGER,
        organization_id INTEGER,
        resource_type VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        ip_address VARCHAR(45),
        user_agent TEXT,
        previous_hash VARCHAR(64) NOT NULL,
        hash VARCHAR(64) NOT NULL,
        signature VARCHAR(64) NOT NULL,
        nonce INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_audit_hash ON tamper_proof_audit_logs(hash)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_audit_previous_hash ON tamper_proof_audit_logs(previous_hash)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON tamper_proof_audit_logs(timestamp)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_audit_user ON tamper_proof_audit_logs(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_audit_org ON tamper_proof_audit_logs(organization_id)
    `);
  }

  async verifyChain(startFrom?: string, limit: number = 1000): Promise<{
    valid: boolean;
    entriesVerified: number;
    error?: string;
    brokenAtEntry?: string;
  }> {
    const entries = await this.getEntries(startFrom, limit);

    if (entries.length === 0) {
      return { valid: true, entriesVerified: 0 };
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const entryForHash: Omit<AuditEntry, 'hash' | 'signature'> = {
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        userId: entry.userId,
        organizationId: entry.organizationId,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        previousHash: entry.previousHash,
        nonce: entry.nonce,
      };

      const recomputedHash = this.computeHash(entryForHash);
      if (entry.hash !== recomputedHash) {
        return {
          valid: false,
          entriesVerified: i,
          error: `Hash mismatch at entry ${entry.id}`,
          brokenAtEntry: entry.id,
        };
      }

      const expectedSignature = this.generateSignature(entry.hash);
      if (entry.signature !== expectedSignature) {
        return {
          valid: false,
          entriesVerified: i,
          error: `Invalid signature at entry ${entry.id}`,
          brokenAtEntry: entry.id,
        };
      }

      if (i > 0) {
        const previousEntry = entries[i - 1];
        if (entry.previousHash !== previousEntry.hash) {
          return {
            valid: false,
            entriesVerified: i,
            error: `Chain broken at entry ${entry.id}`,
            brokenAtEntry: entry.id,
          };
        }
      }

      if (this.enableProofOfWork) {
        const target = '0'.repeat(this.difficulty);
        if (!entry.hash.startsWith(target)) {
          return {
            valid: false,
            entriesVerified: i,
            error: `Invalid proof-of-work at entry ${entry.id}`,
            brokenAtEntry: entry.id,
          };
        }
      }
    }

    return { valid: true, entriesVerified: entries.length };
  }

  private async getEntries(startFrom?: string, limit: number = 1000): Promise<AuditEntry[]> {
    let result;

    if (startFrom) {
      result = await db.execute(sql`
        SELECT * FROM tamper_proof_audit_logs
        WHERE timestamp >= (SELECT timestamp FROM tamper_proof_audit_logs WHERE id = ${startFrom})
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `);
    } else {
      result = await db.execute(sql`
        SELECT * FROM tamper_proof_audit_logs
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `);
    }

    return (result.rows || []).map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      userId: row.user_id,
      organizationId: row.organization_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      previousHash: row.previous_hash,
      hash: row.hash,
      signature: row.signature,
      nonce: row.nonce,
    }));
  }

  async getAuditTrail(params: {
    userId?: number;
    organizationId?: number;
    resourceType?: string;
    resourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: AuditEntry[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];

    if (params.userId !== undefined) {
      values.push(params.userId);
      whereClause += ` AND user_id = $${values.length}`;
    }
    if (params.organizationId !== undefined) {
      values.push(params.organizationId);
      whereClause += ` AND organization_id = $${values.length}`;
    }
    if (params.resourceType) {
      values.push(params.resourceType);
      whereClause += ` AND resource_type = $${values.length}`;
    }
    if (params.resourceId) {
      values.push(params.resourceId);
      whereClause += ` AND resource_id = $${values.length}`;
    }
    if (params.action) {
      values.push(params.action);
      whereClause += ` AND action = $${values.length}`;
    }
    if (params.startDate) {
      values.push(params.startDate.toISOString());
      whereClause += ` AND timestamp >= $${values.length}`;
    }
    if (params.endDate) {
      values.push(params.endDate.toISOString());
      whereClause += ` AND timestamp <= $${values.length}`;
    }

    const limit = params.limit || 100;
    const offset = params.offset || 0;

    const countResult = await db.execute(sql.raw(`
      SELECT COUNT(*) as count FROM tamper_proof_audit_logs ${whereClause}
    `));

    const total = parseInt((countResult.rows?.[0] as any)?.count || '0', 10);

    values.push(limit, offset);
    const result = await db.execute(sql.raw(`
      SELECT * FROM tamper_proof_audit_logs 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `));

    const entries = (result.rows || []).map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      userId: row.user_id,
      organizationId: row.organization_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      previousHash: row.previous_hash,
      hash: row.hash,
      signature: row.signature,
      nonce: row.nonce,
    }));

    return { entries, total };
  }

  generateMerkleRoot(entries: AuditEntry[]): string {
    if (entries.length === 0) {
      return crypto.createHash(this.ALGORITHM).update('EMPTY').digest('hex');
    }

    let hashes = entries.map(e => e.hash);

    while (hashes.length > 1) {
      const newHashes: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        const combined = crypto.createHash(this.ALGORITHM)
          .update(left + right)
          .digest('hex');
        newHashes.push(combined);
      }
      hashes = newHashes;
    }

    return hashes[0];
  }
}

let auditLoggerInstance: TamperProofAuditLogger | null = null;

export function getAuditLogger(): TamperProofAuditLogger {
  if (!auditLoggerInstance) {
    const signingKey = process.env.AUDIT_SIGNING_KEY || 
                       process.env.SESSION_SECRET || 
                       'default-audit-signing-key-change-in-production';

    auditLoggerInstance = new TamperProofAuditLogger({
      signingKey,
      difficulty: 2,
      enableProofOfWork: process.env.AUDIT_ENABLE_POW === 'true',
    });
  }
  return auditLoggerInstance;
}

export async function logSecurityEvent(params: {
  action: string;
  userId?: number | null;
  organizationId?: number | null;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<AuditEntry> {
  return getAuditLogger().log(params);
}
