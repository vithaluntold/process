import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { createEnvelopeEncryptionService, EncryptionEnvelope } from '../lib/security/envelope-encryption';
import crypto from 'crypto';

const OLD_ALGORITHM = 'aes-256-gcm';

interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: Array<{ recordId: string; error: string }>;
}

async function decryptOldFormat(
  encryptedData: string,
  iv: string,
  authTag: string,
  masterKey: string
): Promise<string> {
  const key = crypto.createHash('sha256').update(masterKey).digest();
  const decipher = crypto.createDecipheriv(
    OLD_ALGORITHM,
    key,
    Buffer.from(iv, 'base64')
  ) as crypto.DecipherGCM;
  
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

async function migrateApiKeys(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    totalRecords: 0,
    migratedRecords: 0,
    failedRecords: 0,
    errors: [],
  };

  try {
    const apiKeys = await db.execute(sql`
      SELECT id, encrypted_api_key, encryption_iv, encryption_auth_tag, encryption_version
      FROM ai_configurations
      WHERE encrypted_api_key IS NOT NULL
        AND (encryption_version IS NULL OR encryption_version < 2)
    `);

    result.totalRecords = apiKeys.rows?.length || 0;

    if (result.totalRecords === 0) {
      console.log('No API keys to migrate');
      return result;
    }

    const encryptionService = createEnvelopeEncryptionService();
    const masterKey = process.env.MASTER_ENCRYPTION_KEY;

    if (!masterKey) {
      throw new Error('MASTER_ENCRYPTION_KEY not set');
    }

    for (const row of apiKeys.rows || []) {
      try {
        const record = row as any;
        
        const plaintext = await decryptOldFormat(
          record.encrypted_api_key,
          record.encryption_iv,
          record.encryption_auth_tag,
          masterKey
        );

        const envelope = await encryptionService.encrypt(plaintext);

        await db.execute(sql`
          UPDATE ai_configurations
          SET 
            encrypted_api_key = ${envelope.ciphertext},
            encryption_iv = ${envelope.iv},
            encryption_auth_tag = ${envelope.authTag},
            encryption_version = 2,
            encrypted_dek = ${envelope.encryptedDEK},
            kms_provider = ${envelope.provider},
            kek_version = ${envelope.kekVersion}
          WHERE id = ${record.id}
        `);

        result.migratedRecords++;
        console.log(`Migrated API key for ai_configuration ${record.id}`);
      } catch (error: any) {
        result.failedRecords++;
        result.errors.push({
          recordId: (row as any).id?.toString() || 'unknown',
          error: error.message,
        });
        console.error(`Failed to migrate API key ${(row as any).id}:`, error.message);
      }
    }

    result.success = result.failedRecords === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push({ recordId: 'database', error: error.message });
  }

  return result;
}

async function addEnvelopeColumns(): Promise<void> {
  console.log('Adding envelope encryption columns to ai_configurations...');
  
  try {
    await db.execute(sql`
      ALTER TABLE ai_configurations 
      ADD COLUMN IF NOT EXISTS encrypted_dek TEXT,
      ADD COLUMN IF NOT EXISTS kms_provider VARCHAR(50),
      ADD COLUMN IF NOT EXISTS kek_version TEXT
    `);
    console.log('Columns added successfully');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('Columns already exist');
    } else {
      throw error;
    }
  }
}

async function createAuditTable(): Promise<void> {
  console.log('Creating tamper-proof audit log table...');
  
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
      created_at TIMESTAMPTZ DEFAULT NOW()
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

  console.log('Audit table created successfully');
}

async function main() {
  console.log('=== EPI-Q Enterprise Security Migration ===');
  console.log('Starting migration to envelope encryption...\n');

  try {
    await addEnvelopeColumns();
    console.log('');

    await createAuditTable();
    console.log('');

    console.log('Migrating encrypted API keys...');
    const apiKeyResult = await migrateApiKeys();
    
    console.log('\n=== Migration Summary ===');
    console.log(`API Keys Migration:`);
    console.log(`  Total: ${apiKeyResult.totalRecords}`);
    console.log(`  Migrated: ${apiKeyResult.migratedRecords}`);
    console.log(`  Failed: ${apiKeyResult.failedRecords}`);
    
    if (apiKeyResult.errors.length > 0) {
      console.log('\nErrors:');
      apiKeyResult.errors.forEach(e => {
        console.log(`  - ${e.recordId}: ${e.error}`);
      });
    }

    console.log('\n=== Migration Complete ===');
    
    if (!apiKeyResult.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
