import crypto from 'crypto';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { KeyManagementServiceClient } from '@google-cloud/kms';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys';

export type KMSProvider = 'aws' | 'gcp' | 'azure' | 'local';

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
  azureConfig?: {
    vaultUrl: string;
    keyName: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
  };
  localConfig?: {
    masterKey: string;
  };
}

export class EnvelopeEncryptionService {
  private kmsClient: KMSClient | null = null;
  private gcpKmsClient: KeyManagementServiceClient | null = null;
  private azureKeyClient: KeyClient | null = null;
  private azureCryptoClient: CryptographyClient | null = null;
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
    } else if (this.config.provider === 'azure' && this.config.azureConfig) {
      const { vaultUrl, keyName, tenantId, clientId, clientSecret } = this.config.azureConfig;
      
      const credential = tenantId && clientId && clientSecret
        ? new ClientSecretCredential(tenantId, clientId, clientSecret)
        : new DefaultAzureCredential();
      
      this.azureKeyClient = new KeyClient(vaultUrl, credential);
      this.initializeAzureCryptoClient(keyName, credential);
    }
  }

  private async initializeAzureCryptoClient(keyName: string, credential: DefaultAzureCredential | ClientSecretCredential): Promise<void> {
    if (this.azureKeyClient && this.config.azureConfig) {
      try {
        const key = await this.azureKeyClient.getKey(keyName);
        if (key.id) {
          this.azureCryptoClient = new CryptographyClient(key.id, credential);
        }
      } catch (error) {
        console.warn('Azure Key Vault key not found, will be created on first use');
      }
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
      case 'azure':
        ({ dek, encryptedDEK, kekVersion } = await this.generateDEKWithAzure());
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

    if (envelope.provider !== this.config.provider) {
      const providerService = createEnvelopeEncryptionServiceForProvider(envelope.provider);
      return providerService.decrypt(envelope);
    }

    switch (envelope.provider) {
      case 'aws':
        dek = await this.decryptDEKWithAWS(Buffer.from(envelope.encryptedDEK, 'base64'));
        break;
      case 'gcp':
        dek = await this.decryptDEKWithGCP(Buffer.from(envelope.encryptedDEK, 'base64'));
        break;
      case 'azure':
        dek = await this.decryptDEKWithAzure(Buffer.from(envelope.encryptedDEK, 'base64'));
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
      ) as crypto.DecipherGCM;
      
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

  private async generateDEKWithAzure(): Promise<{ dek: Buffer; encryptedDEK: Buffer; kekVersion: string }> {
    if (!this.azureKeyClient || !this.config.azureConfig) {
      throw new Error('Azure Key Vault not configured');
    }

    const { keyName, vaultUrl, tenantId, clientId, clientSecret } = this.config.azureConfig;

    const credential = tenantId && clientId && clientSecret
      ? new ClientSecretCredential(tenantId, clientId, clientSecret)
      : new DefaultAzureCredential();

    let key;
    try {
      key = await this.azureKeyClient.getKey(keyName);
      
      if (key.keyType !== 'RSA-HSM') {
        console.warn(`Azure Key Vault key '${keyName}' is not HSM-backed (type: ${key.keyType}). For enterprise compliance (HIPAA/SOX/PCI), use RSA-HSM keys.`);
      }
    } catch (error: any) {
      if (error.code === 'KeyNotFound' || error.statusCode === 404) {
        throw new Error(
          `Azure Key Vault key '${keyName}' not found. ` +
          `For enterprise security, please create an HSM-backed key manually in Azure Portal: ` +
          `Key Vault -> Keys -> Generate/Import -> Key type: RSA-HSM, Key size: 2048 or higher. ` +
          `Automatic key creation is disabled to ensure HSM protection.`
        );
      }
      throw error;
    }

    if (!key.id) {
      throw new Error('Failed to retrieve Azure Key Vault key');
    }

    const cryptoClient = new CryptographyClient(key.id, credential);
    const dek = crypto.randomBytes(this.DEK_SIZE);

    const wrapResult = await cryptoClient.wrapKey('RSA-OAEP', dek);

    return {
      dek,
      encryptedDEK: Buffer.from(wrapResult.result),
      kekVersion: key.properties.version || 'latest',
    };
  }

  private async decryptDEKWithAzure(encryptedDEK: Buffer): Promise<Buffer> {
    if (!this.azureKeyClient || !this.config.azureConfig) {
      throw new Error('Azure Key Vault not configured');
    }

    const { keyName, tenantId, clientId, clientSecret } = this.config.azureConfig;

    const credential = tenantId && clientId && clientSecret
      ? new ClientSecretCredential(tenantId, clientId, clientSecret)
      : new DefaultAzureCredential();

    const key = await this.azureKeyClient.getKey(keyName);

    if (!key.id) {
      throw new Error('Azure Key Vault key not found');
    }

    const cryptoClient = new CryptographyClient(key.id, credential);
    const unwrapResult = await cryptoClient.unwrapKey('RSA-OAEP', encryptedDEK);

    return Buffer.from(unwrapResult.result);
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

export function createEnvelopeEncryptionServiceForProvider(provider: KMSProvider): EnvelopeEncryptionService {
  const config: KMSConfig = {
    provider,
  };

  if (provider === 'aws') {
    if (!process.env.AWS_KMS_KEY_ID) {
      throw new Error('AWS KMS configuration required: AWS_KMS_KEY_ID not set');
    }
    config.awsConfig = {
      region: process.env.AWS_REGION || 'us-east-1',
      keyId: process.env.AWS_KMS_KEY_ID,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  } else if (provider === 'gcp') {
    if (!process.env.GCP_PROJECT_ID || !process.env.GCP_KMS_KEYRING || !process.env.GCP_KMS_KEY) {
      throw new Error('GCP KMS configuration required: GCP_PROJECT_ID, GCP_KMS_KEYRING, GCP_KMS_KEY not set');
    }
    config.gcpConfig = {
      projectId: process.env.GCP_PROJECT_ID,
      locationId: process.env.GCP_KMS_LOCATION || 'global',
      keyRingId: process.env.GCP_KMS_KEYRING,
      keyId: process.env.GCP_KMS_KEY,
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  } else if (provider === 'azure') {
    if (!process.env.AZURE_KEYVAULT_URL || !process.env.AZURE_KEY_NAME) {
      throw new Error('Azure Key Vault configuration required: AZURE_KEYVAULT_URL and AZURE_KEY_NAME not set');
    }
    config.azureConfig = {
      vaultUrl: process.env.AZURE_KEYVAULT_URL,
      keyName: process.env.AZURE_KEY_NAME,
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    };
  } else {
    if (!process.env.MASTER_ENCRYPTION_KEY) {
      console.warn('MASTER_ENCRYPTION_KEY not set, using ephemeral key (not recommended for production)');
    }
    config.localConfig = {
      masterKey: process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    };
  }

  return new EnvelopeEncryptionService(config);
}

export function createEnvelopeEncryptionService(): EnvelopeEncryptionService {
  const provider = (process.env.KMS_PROVIDER || 'local') as KMSProvider;
  return createEnvelopeEncryptionServiceForProvider(provider);
}
