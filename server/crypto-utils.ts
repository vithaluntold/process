import { createHash, randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

export class CryptoUtils {
  private static readonly ARGON2_SALT_LENGTH = 16;
  private static readonly API_KEY_LENGTH = 40;
  private static readonly AES_ALGORITHM = 'aes-256-gcm';
  private static readonly AES_KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;

  static generateApiKey(): { fullKey: string; prefix: string; hashedKey: string } {
    const keyBytes = randomBytes(this.API_KEY_LENGTH);
    const fullKey = `epix_${keyBytes.toString('base64url')}`;
    
    const prefix = fullKey.substring(0, 12);
    
    const hashedKey = this.hashApiKey(fullKey);
    
    return {
      fullKey,
      prefix,
      hashedKey,
    };
  }

  static hashApiKey(apiKey: string): string {
    const salt = randomBytes(this.ARGON2_SALT_LENGTH);
    
    const hash = scryptSync(apiKey, salt, 64);
    
    return `${salt.toString('base64')}:${hash.toString('base64')}`;
  }

  static verifyApiKey(providedKey: string, storedHash: string): boolean {
    try {
      const [saltB64, hashB64] = storedHash.split(':');
      if (!saltB64 || !hashB64) return false;

      const salt = Buffer.from(saltB64, 'base64');
      const storedHashBuffer = Buffer.from(hashB64, 'base64');
      
      const providedHashBuffer = scryptSync(providedKey, salt, 64);
      
      return this.timingSafeEqual(providedHashBuffer, storedHashBuffer);
    } catch (error) {
      return false;
    }
  }

  private static timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  static generateAESKey(): { key: string; encryptedKey: string } {
    const aesKey = randomBytes(this.AES_KEY_LENGTH);
    const keyString = aesKey.toString('base64');
    
    const masterKey = this.getMasterKey();
    const encryptedKey = this.encryptAESKey(keyString, masterKey);
    
    return {
      key: keyString,
      encryptedKey,
    };
  }

  static encryptAESKey(keyString: string, masterKey: Buffer): string {
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.AES_ALGORITHM, masterKey, iv);
    
    let encrypted = cipher.update(keyString, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;
  }

  static decryptAESKey(encryptedKey: string, masterKey: Buffer): string {
    const [ivB64, encryptedB64, authTagB64] = encryptedKey.split(':');
    if (!ivB64 || !encryptedB64 || !authTagB64) {
      throw new Error('Invalid encrypted key format');
    }

    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = encryptedB64;
    const authTag = Buffer.from(authTagB64, 'base64');
    
    const decipher = createDecipheriv(this.AES_ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static encryptData(data: string, aesKey: string): { encrypted: string; iv: string; authTag: string } {
    const keyBuffer = Buffer.from(aesKey, 'base64');
    const iv = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.AES_ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  static decryptData(encrypted: string, iv: string, authTag: string, aesKey: string): string {
    const keyBuffer = Buffer.from(aesKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');
    
    const decipher = createDecipheriv(this.AES_ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static decryptPayload(payload: any, aesKey: string): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    if (payload.encrypted && payload.iv && payload.authTag) {
      try {
        const decrypted = this.decryptData(
          payload.encrypted,
          payload.iv,
          payload.authTag,
          aesKey
        );
        return JSON.parse(decrypted);
      } catch (error) {
        console.error('Failed to decrypt payload:', error);
        return payload;
      }
    }

    const decrypted: any = {};
    for (const [key, value] of Object.entries(payload)) {
      if (value && typeof value === 'object' && 'encrypted' in value && 'iv' in value && 'authTag' in value) {
        try {
          const decryptedValue = this.decryptData(
            (value as any).encrypted,
            (value as any).iv,
            (value as any).authTag,
            aesKey
          );
          decrypted[key] = decryptedValue;
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error);
          decrypted[key] = value;
        }
      } else if (Array.isArray(value)) {
        decrypted[key] = value.map(item => this.decryptPayload(item, aesKey));
      } else if (value && typeof value === 'object') {
        decrypted[key] = this.decryptPayload(value, aesKey);
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  private static getMasterKey(): Buffer {
    const masterKeyB64 = process.env.MASTER_ENCRYPTION_KEY;
    
    if (!masterKeyB64) {
      throw new Error(
        'MASTER_ENCRYPTION_KEY environment variable is required. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }
    
    return Buffer.from(masterKeyB64, 'base64');
  }

  static generateMasterKey(): string {
    const masterKey = randomBytes(this.AES_KEY_LENGTH);
    return masterKey.toString('base64');
  }
}
