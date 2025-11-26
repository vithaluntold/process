import crypto from 'crypto';
import { KMSClient, GenerateRandomCommand, GetPublicKeyCommand, SignCommand, VerifyCommand, CreateKeyCommand, ScheduleKeyDeletionCommand, ListKeysCommand, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { KeyManagementServiceClient } from '@google-cloud/kms';
import { logSecurityEvent } from './tamper-proof-audit';

export type HSMProvider = 'aws-kms' | 'gcp-kms' | 'local-hsm-simulation';

export interface HSMConfig {
  provider: HSMProvider;
  awsConfig?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  gcpConfig?: {
    projectId: string;
    locationId: string;
    credentialsPath?: string;
  };
  localConfig?: {
    masterSeed: string;
  };
}

export interface KeyMetadata {
  keyId: string;
  algorithm: string;
  keyUsage: 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY';
  createdAt: string;
  expiresAt?: string;
  provider: HSMProvider;
  keyState: 'ENABLED' | 'DISABLED' | 'PENDING_DELETION';
}

export interface SplitKeyShare {
  shareIndex: number;
  totalShares: number;
  threshold: number;
  share: string;
  checksum: string;
}

export class HSMKeyManagementService {
  private kmsClient: KMSClient | null = null;
  private gcpKmsClient: KeyManagementServiceClient | null = null;
  private config: HSMConfig;

  constructor(config: HSMConfig) {
    this.config = config;
    this.initializeHSM();
  }

  private initializeHSM(): void {
    if (this.config.provider === 'aws-kms' && this.config.awsConfig) {
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
    } else if (this.config.provider === 'gcp-kms' && this.config.gcpConfig) {
      const options: any = {};
      if (this.config.gcpConfig.credentialsPath) {
        options.keyFilename = this.config.gcpConfig.credentialsPath;
      }
      this.gcpKmsClient = new KeyManagementServiceClient(options);
    }
  }

  async generateSecureRandom(byteLength: number): Promise<Buffer> {
    switch (this.config.provider) {
      case 'aws-kms':
        return this.generateRandomAWS(byteLength);
      case 'gcp-kms':
        return this.generateRandomGCP(byteLength);
      case 'local-hsm-simulation':
        return this.generateRandomLocal(byteLength);
      default:
        throw new Error(`Unsupported HSM provider: ${this.config.provider}`);
    }
  }

  private async generateRandomAWS(byteLength: number): Promise<Buffer> {
    if (!this.kmsClient) {
      throw new Error('AWS KMS not configured');
    }

    const command = new GenerateRandomCommand({
      NumberOfBytes: byteLength,
    });

    const response = await this.kmsClient.send(command);

    if (!response.Plaintext) {
      throw new Error('Failed to generate random bytes from AWS KMS');
    }

    await logSecurityEvent({
      action: 'HSM_GENERATE_RANDOM',
      resourceType: 'hsm-key',
      metadata: { provider: 'aws-kms', byteLength },
    });

    return Buffer.from(response.Plaintext);
  }

  private async generateRandomGCP(byteLength: number): Promise<Buffer> {
    if (!this.gcpKmsClient || !this.config.gcpConfig) {
      throw new Error('GCP KMS not configured');
    }

    const [response] = await this.gcpKmsClient.generateRandomBytes({
      location: `projects/${this.config.gcpConfig.projectId}/locations/${this.config.gcpConfig.locationId}`,
      lengthBytes: byteLength,
      protectionLevel: 'HSM',
    });

    if (!response.data) {
      throw new Error('Failed to generate random bytes from GCP KMS');
    }

    await logSecurityEvent({
      action: 'HSM_GENERATE_RANDOM',
      resourceType: 'hsm-key',
      metadata: { provider: 'gcp-kms', byteLength },
    });

    return Buffer.from(response.data as Uint8Array);
  }

  private async generateRandomLocal(byteLength: number): Promise<Buffer> {
    if (!this.config.localConfig?.masterSeed) {
      throw new Error('Local HSM simulation not configured');
    }

    const contextKey = crypto.createHash('sha256')
      .update(this.config.localConfig.masterSeed + Date.now().toString())
      .digest();

    const hmac = crypto.createHmac('sha512', contextKey);
    hmac.update(crypto.randomBytes(byteLength));
    const derived = hmac.digest();

    await logSecurityEvent({
      action: 'HSM_GENERATE_RANDOM',
      resourceType: 'hsm-key',
      metadata: { provider: 'local-hsm-simulation', byteLength },
    });

    return derived.subarray(0, byteLength);
  }

  async createMasterKey(alias: string, description: string): Promise<KeyMetadata> {
    if (this.config.provider !== 'aws-kms' || !this.kmsClient) {
      throw new Error('Master key creation only supported with AWS KMS');
    }

    const command = new CreateKeyCommand({
      Description: description,
      KeyUsage: 'ENCRYPT_DECRYPT',
      CustomerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      Tags: [
        { TagKey: 'Alias', TagValue: alias },
        { TagKey: 'CreatedBy', TagValue: 'EPI-Q-HSM-Service' },
      ],
    });

    const response = await this.kmsClient.send(command);

    if (!response.KeyMetadata) {
      throw new Error('Failed to create master key');
    }

    await logSecurityEvent({
      action: 'HSM_CREATE_MASTER_KEY',
      resourceType: 'hsm-key',
      resourceId: response.KeyMetadata.KeyId,
      metadata: { alias, description, provider: 'aws-kms' },
    });

    return {
      keyId: response.KeyMetadata.KeyId || '',
      algorithm: 'AES_256',
      keyUsage: 'ENCRYPT_DECRYPT',
      createdAt: response.KeyMetadata.CreationDate?.toISOString() || new Date().toISOString(),
      provider: 'aws-kms',
      keyState: 'ENABLED',
    };
  }

  async listKeys(): Promise<KeyMetadata[]> {
    if (this.config.provider !== 'aws-kms' || !this.kmsClient) {
      throw new Error('Key listing only supported with AWS KMS');
    }

    const command = new ListKeysCommand({});
    const response = await this.kmsClient.send(command);

    const keys: KeyMetadata[] = [];

    for (const key of response.Keys || []) {
      if (key.KeyId) {
        const describeCommand = new DescribeKeyCommand({ KeyId: key.KeyId });
        const describeResponse = await this.kmsClient.send(describeCommand);
        
        if (describeResponse.KeyMetadata) {
          keys.push({
            keyId: describeResponse.KeyMetadata.KeyId || '',
            algorithm: describeResponse.KeyMetadata.KeySpec || 'SYMMETRIC_DEFAULT',
            keyUsage: describeResponse.KeyMetadata.KeyUsage as 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY' || 'ENCRYPT_DECRYPT',
            createdAt: describeResponse.KeyMetadata.CreationDate?.toISOString() || '',
            provider: 'aws-kms',
            keyState: describeResponse.KeyMetadata.KeyState as 'ENABLED' | 'DISABLED' | 'PENDING_DELETION' || 'ENABLED',
          });
        }
      }
    }

    return keys;
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays: number = 30): Promise<void> {
    if (this.config.provider !== 'aws-kms' || !this.kmsClient) {
      throw new Error('Key deletion only supported with AWS KMS');
    }

    const command = new ScheduleKeyDeletionCommand({
      KeyId: keyId,
      PendingWindowInDays: pendingWindowInDays,
    });

    await this.kmsClient.send(command);

    await logSecurityEvent({
      action: 'HSM_SCHEDULE_KEY_DELETION',
      resourceType: 'hsm-key',
      resourceId: keyId,
      metadata: { pendingWindowInDays, provider: 'aws-kms' },
    });
  }

  splitKeyWithShamirSharing(
    secret: Buffer,
    totalShares: number,
    threshold: number
  ): SplitKeyShare[] {
    if (threshold > totalShares) {
      throw new Error('Threshold cannot be greater than total shares');
    }
    if (threshold < 2) {
      throw new Error('Threshold must be at least 2');
    }

    const shares: SplitKeyShare[] = [];
    const coefficients: Buffer[] = [secret];

    for (let i = 1; i < threshold; i++) {
      coefficients.push(crypto.randomBytes(secret.length));
    }

    for (let x = 1; x <= totalShares; x++) {
      const share = Buffer.alloc(secret.length);
      
      for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
        let value = 0;
        for (let coefIdx = 0; coefIdx < coefficients.length; coefIdx++) {
          value ^= this.gfMul(coefficients[coefIdx][byteIdx], this.gfPow(x, coefIdx));
        }
        share[byteIdx] = value;
      }

      const checksum = crypto.createHash('sha256')
        .update(share)
        .digest('hex')
        .substring(0, 8);

      shares.push({
        shareIndex: x,
        totalShares,
        threshold,
        share: share.toString('base64'),
        checksum,
      });
    }

    return shares;
  }

  reconstructKeyFromShares(shares: SplitKeyShare[]): Buffer {
    if (shares.length < shares[0].threshold) {
      throw new Error(`Need at least ${shares[0].threshold} shares to reconstruct`);
    }

    for (const share of shares) {
      const shareBuffer = Buffer.from(share.share, 'base64');
      const checksum = crypto.createHash('sha256')
        .update(shareBuffer)
        .digest('hex')
        .substring(0, 8);
      
      if (checksum !== share.checksum) {
        throw new Error(`Invalid checksum for share ${share.shareIndex}`);
      }
    }

    const selectedShares = shares.slice(0, shares[0].threshold);
    const shareLength = Buffer.from(selectedShares[0].share, 'base64').length;
    const secret = Buffer.alloc(shareLength);

    for (let byteIdx = 0; byteIdx < shareLength; byteIdx++) {
      let value = 0;
      
      for (let i = 0; i < selectedShares.length; i++) {
        const shareBuffer = Buffer.from(selectedShares[i].share, 'base64');
        let basis = 1;
        
        for (let j = 0; j < selectedShares.length; j++) {
          if (i !== j) {
            const xi = selectedShares[i].shareIndex;
            const xj = selectedShares[j].shareIndex;
            basis = this.gfMul(basis, this.gfMul(xj, this.gfInv(xi ^ xj)));
          }
        }
        
        value ^= this.gfMul(shareBuffer[byteIdx], basis);
      }
      
      secret[byteIdx] = value;
    }

    return secret;
  }

  private gfMul(a: number, b: number): number {
    let result = 0;
    for (let i = 0; i < 8; i++) {
      if ((b & 1) !== 0) {
        result ^= a;
      }
      const highBit = (a & 0x80) !== 0;
      a = (a << 1) & 0xff;
      if (highBit) {
        a ^= 0x1b;
      }
      b >>= 1;
    }
    return result;
  }

  private gfPow(base: number, exp: number): number {
    let result = 1;
    for (let i = 0; i < exp; i++) {
      result = this.gfMul(result, base);
    }
    return result;
  }

  private gfInv(a: number): number {
    if (a === 0) {
      throw new Error('Cannot invert zero in GF(256)');
    }
    return this.gfPow(a, 254);
  }
}

export interface MultiPartyAuthorizationConfig {
  requiredApprovals: number;
  approvers: string[];
  expirationMinutes: number;
}

export interface PendingOperation {
  operationId: string;
  operationType: string;
  resourceId: string;
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  approvals: Array<{
    approverId: string;
    approvedAt: string;
    signature: string;
  }>;
  requiredApprovals: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export class MultiPartyAuthorizationService {
  private pendingOperations: Map<string, PendingOperation> = new Map();
  private readonly signingKey: Buffer;

  constructor(signingKey: string) {
    this.signingKey = crypto.createHash('sha256').update(signingKey).digest();
  }

  async requestOperation(params: {
    operationType: string;
    resourceId: string;
    requestedBy: string;
    config: MultiPartyAuthorizationConfig;
  }): Promise<PendingOperation> {
    const operationId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + params.config.expirationMinutes * 60 * 1000);

    const operation: PendingOperation = {
      operationId,
      operationType: params.operationType,
      resourceId: params.resourceId,
      requestedBy: params.requestedBy,
      requestedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      approvals: [],
      requiredApprovals: params.config.requiredApprovals,
      status: 'PENDING',
    };

    this.pendingOperations.set(operationId, operation);

    await logSecurityEvent({
      action: 'MPA_OPERATION_REQUESTED',
      resourceType: 'mpa-operation',
      resourceId: operationId,
      metadata: {
        operationType: params.operationType,
        targetResourceId: params.resourceId,
        requiredApprovals: params.config.requiredApprovals,
      },
    });

    return operation;
  }

  async approveOperation(operationId: string, approverId: string): Promise<PendingOperation> {
    const operation = this.pendingOperations.get(operationId);

    if (!operation) {
      throw new Error('Operation not found');
    }

    if (new Date() > new Date(operation.expiresAt)) {
      operation.status = 'EXPIRED';
      throw new Error('Operation has expired');
    }

    if (operation.status !== 'PENDING') {
      throw new Error(`Operation is ${operation.status}`);
    }

    if (operation.approvals.some(a => a.approverId === approverId)) {
      throw new Error('Already approved by this user');
    }

    if (operation.requestedBy === approverId) {
      throw new Error('Requester cannot approve their own operation');
    }

    const signatureData = `${operationId}:${approverId}:${Date.now()}`;
    const signature = crypto.createHmac('sha256', this.signingKey)
      .update(signatureData)
      .digest('hex');

    operation.approvals.push({
      approverId,
      approvedAt: new Date().toISOString(),
      signature,
    });

    if (operation.approvals.length >= operation.requiredApprovals) {
      operation.status = 'APPROVED';
    }

    await logSecurityEvent({
      action: 'MPA_OPERATION_APPROVED',
      resourceType: 'mpa-operation',
      resourceId: operationId,
      metadata: {
        approverId,
        currentApprovals: operation.approvals.length,
        requiredApprovals: operation.requiredApprovals,
        status: operation.status,
      },
    });

    return operation;
  }

  async rejectOperation(operationId: string, rejectedBy: string, reason: string): Promise<PendingOperation> {
    const operation = this.pendingOperations.get(operationId);

    if (!operation) {
      throw new Error('Operation not found');
    }

    operation.status = 'REJECTED';

    await logSecurityEvent({
      action: 'MPA_OPERATION_REJECTED',
      resourceType: 'mpa-operation',
      resourceId: operationId,
      metadata: { rejectedBy, reason },
    });

    return operation;
  }

  getOperation(operationId: string): PendingOperation | undefined {
    return this.pendingOperations.get(operationId);
  }

  isOperationApproved(operationId: string): boolean {
    const operation = this.pendingOperations.get(operationId);
    return operation?.status === 'APPROVED';
  }
}

let hsmServiceInstance: HSMKeyManagementService | null = null;

export function getHSMService(): HSMKeyManagementService {
  if (!hsmServiceInstance) {
    const provider = (process.env.HSM_PROVIDER || 'local-hsm-simulation') as HSMProvider;

    const config: HSMConfig = {
      provider,
    };

    if (provider === 'aws-kms') {
      config.awsConfig = {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    } else if (provider === 'gcp-kms') {
      config.gcpConfig = {
        projectId: process.env.GCP_PROJECT_ID || '',
        locationId: process.env.GCP_KMS_LOCATION || 'global',
        credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      };
    } else {
      config.localConfig = {
        masterSeed: process.env.MASTER_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
      };
    }

    hsmServiceInstance = new HSMKeyManagementService(config);
  }

  return hsmServiceInstance;
}
