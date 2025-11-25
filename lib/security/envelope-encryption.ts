import crypto from 'crypto';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { KeyManagementServiceClient } from '@google-cloud/kms';

export type KMSProvider = 'aws' | 'gcp' | 'local';

export interface EncryptionEnvelope {
  ciphertext: string;
  encryptedDEK: string;
  iv: string;
  authTag: string;
  algorithm: string;
  provider: KMSProvider;
  kekVersion: string;
  timestamp: string;
}

export interface KMSConfig {
  provider: KMSProvider;
  awsConfig?: {
    region: string;
    keyId: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  gcpConfig?: {
    projectId: string;
    locationId: string;
    keyRingId: string;
    keyId: string;
    credentialsPath?: string;
  };
  localConfig?: {
    masterKey: string;
  };
}

export class EnvelopeEncryptionService {
  private kmsClient: KMSClient | null = null;
  private gcpKmsClient: KeyManagementServiceClient | null = null;
  private config: KMSConfig;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly DEK_SIZE = 32; // 256-bit

  constructor(config: KMSConfig) {
    this.config = config;
    this.initializeKMS();
  }

  private initializeKMS(): void {
    if (this.config.provider === 'aws' && this.config.awsConfig) {
      const clientConfig: any = {
        region: this.config.awsConfig.region,
      };
      
      if (this.config.awsConfig.accessKeyId && this.config.awsConfig.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: this.config.awsConfig.accessKeyId,
          secretAccessKey: this.config.awsConfig.secretAccessKey,
        };
      }
      
      this.kmsClient = new KMSClient(clientConfig);
    } else if (this.config.provider === 'gcp' && this.config.gcpConfig) {
      const options: any = {};
      if (this.config.gcpConfig.credentialsPath) {
        options.keyFilename = this.config.gcpConfig.credentialsPath;
      }
      this.gcpKmsClient = new KeyManagementServiceClient(options);
    }
  }

  async encrypt(plaintext: string | Buffer): Promise<EncryptionEnvelope> {
    const plaintextBuffer = Buffer.isBuffer(plaintext) 
      ? plaintext 
      : Buffer.from(plaintext, 'utf8');

    let dek: Buffer;
    let encryptedDEK: Buffer;
    let kekVersion: string;

    switch (this.config.provider) {
      case 'aws':
        ({ dek, encryptedDEK, kekVersion } = await this.generateDEKWithAWS());
        break;
      case 'gcp':
        ({ dek, encryptedDEK, kekVersion } = await this.generateDEKWithGCP());
        break;
      case 'local':
        ({ dek, encryptedDEK, kekVersion } = await this.generateDEKLocally());
        break;
      default:
        throw new Error(`Unsupported KMS provider: ${this.config.provider}`);
    }

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.ALGORITHM, dek, iv);
      
      const ciphertext = Buffer.concat([
        cipher.update(plaintextBuffer),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();

      dek.fill(0);

      return {
        ciphertext: ciphertext.toString('base64'),
        encryptedDEK: encryptedDEK.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.ALGORITHM,
        provider: this.config.provider,
        kekVersion,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      dek.fill(0);
      throw error;
    }
  }

  async decrypt(envelope: EncryptionEnvelope): Promise<Buffer> {
    let dek: Buffer;

    switch (envelope.provider) {
      case 'aws':
        dek = await this.decryptDEKWithAWS(Buffer.from(envelope.encryptedDEK, 'base64'));
        break;
      case 'gcp':
        dek = await this.decryptDEKWithGCP(Buffer.from(envelope.encryptedDEK, 'base64'));
        break;
      case 'local':
        dek = await this.decryptDEKLocally(Buffer.from(envelope.encryptedDEK, 'base64'));
        break;
      default:
        throw new Error(`Unsupported KMS provider: ${envelope.provider}`);
    }

    try {
      const decipher = crypto.createDecipheriv(
        envelope.algorithm,
        dek,
        Buffer.from(envelope.iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
      
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
        decipher.final()
      ]);

      dek.fill(0);

      return plaintext;
    } catch (error) {
      dek.fill(0);
      throw new Error('Decryption failed: Invalid ciphertext or authentication tag');
    }
  }

  async decryptToString(envelope: EncryptionEnvelope): Promise<string> {
    const buffer = await this.decrypt(envelope);
    return buffer.toString('utf8');
  }

  private async generateDEKWithAWS(): Promise<{ dek: Buffer; encryptedDEK: Buffer; kekVersion: string }> {
    if (!this.kmsClient || !this.config.awsConfig) {
      throw new Error('AWS KMS not configured');
    }

    const command = new GenerateDataKeyCommand({
      KeyId: this.config.awsConfig.keyId,
      KeySpec: 'AES_256',
    });

    const response = await this.kmsClient.send(command);

    if (!response.Plaintext || !response.CiphertextBlob) {
      throw new Error('Failed to generate data key from AWS KMS');
    }

    return {
      dek: Buffer.from(response.Plaintext),
      encryptedDEK: Buffer.from(response.CiphertextBlob),
      kekVersion: this.config.awsConfig.keyId,
    };
  }

  private async decryptDEKWithAWS(encryptedDEK: Buffer): Promise<Buffer> {
    if (!this.kmsClient) {
      throw new Error('AWS KMS not configured');
    }

    const command = new DecryptCommand({
      CiphertextBlob: encryptedDEK,
    });

    const response = await this.kmsClient.send(command);

    if (!response.Plaintext) {
      throw new Error('Failed to decrypt data key from AWS KMS');
    }

    return Buffer.from(response.Plaintext);
  }

  private async generateDEKWithGCP(): Promise<{ dek: Buffer; encryptedDEK: Buffer; kekVersion: string }> {
    if (!this.gcpKmsClient || !this.config.gcpConfig) {
      throw new Error('GCP KMS not configured');
    }

    const dek = crypto.randomBytes(this.DEK_SIZE);

    const keyName = this.gcpKmsClient.cryptoKeyPath(
      this.config.gcpConfig.projectId,
      this.config.gcpConfig.locationId,
      this.config.gcpConfig.keyRingId,
      this.config.gcpConfig.keyId
    );

    const [encryptResult] = await this.gcpKmsClient.encrypt({
      name: keyName,
      plaintext: dek,
    });

    if (!encryptResult.ciphertext) {
      throw new Error('Failed to encrypt data key with GCP KMS');
    }

    return {
      dek,
      encryptedDEK: Buffer.from(encryptResult.ciphertext as Uint8Array),
      kekVersion: keyName,
    };
  }

  private async decryptDEKWithGCP(encryptedDEK: Buffer): Promise<Buffer> {
    if (!this.gcpKmsClient || !this.config.gcpConfig) {
      throw new Error('GCP KMS not configured');
    }

    const keyName = this.gcpKmsClient.cryptoKeyPath(
      this.config.gcpConfig.projectId,
      this.config.gcpConfig.locationId,
      this.config.gcpConfig.keyRingId,
      this.config.gcpConfig.keyId
    );

    const [decryptResult] = await this.gcpKmsClient.decrypt({
      name: keyName,
      ciphertext: encryptedDEK,
    });

    if (!decryptResult.plaintext) {
      throw new Error('Failed to decrypt data key from GCP KMS');
    }

    return Buffer.from(decryptResult.plaintext as Uint8Array);
  }

  private async generateDEKLocally(): Promise<{ dek: Buffer; encryptedDEK: Buffer; kekVersion: string }> {
    if (!this.config.localConfig?.masterKey) {
      throw new Error('Local master key not configured');
    }

    const dek = crypto.randomBytes(this.DEK_SIZE);
    const kek = crypto.createHash('sha256').update(this.config.localConfig.masterKey).digest();
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, kek, iv);
    
    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedDEK = Buffer.concat([
      iv,
      authTag,
      encrypted
    ]);

    return {
      dek,
      encryptedDEK,
      kekVersion: 'local-v1',
    };
  }

  private async decryptDEKLocally(encryptedDEK: Buffer): Promise<Buffer> {
    if (!this.config.localConfig?.masterKey) {
      throw new Error('Local master key not configured');
    }

    const kek = crypto.createHash('sha256').update(this.config.localConfig.masterKey).digest();
    
    const iv = encryptedDEK.subarray(0, 12);
    const authTag = encryptedDEK.subarray(12, 28);
    const ciphertext = encryptedDEK.subarray(28);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, kek, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  async rotateKEK(oldEnvelope: EncryptionEnvelope, newKMSConfig: KMSConfig): Promise<EncryptionEnvelope> {
    const plaintext = await this.decrypt(oldEnvelope);
    
    const newService = new EnvelopeEncryptionService(newKMSConfig);
    const newEnvelope = await newService.encrypt(plaintext);
    
    plaintext.fill(0);
    
    return newEnvelope;
  }
}

export function createEnvelopeEncryptionService(): EnvelopeEncryptionService {
  const provider = (process.env.KMS_PROVIDER || 'local') as KMSProvider;
  
  const config: KMSConfig = {
    provider,
  };

  if (provider === 'aws') {
    config.awsConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      keyId: process.env.AWS_KMS_KEY_ID || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else if (provider === 'gcp') {
    config.gcpConfig = {
      projectId: process.env.GCP_PROJECT_ID || '',
      locationId: process.env.GCP_KMS_LOCATION || 'global',
      keyRingId: process.env.GCP_KMS_KEYRING || '',
      keyId: process.env.GCP_KMS_KEY || '',
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  } else {
    config.localConfig = {
      masterKey: process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    };
  }

  return new EnvelopeEncryptionService(config);
}
