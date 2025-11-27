import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

describe('Security Module - Hash Chain Integrity', () => {
  const ALGORITHM = 'sha256';

  function computeHash(data: Record<string, unknown>): string {
    return crypto.createHash(ALGORITHM).update(JSON.stringify(data)).digest('hex');
  }

  function generateSignature(hash: string, key: Buffer): string {
    return crypto.createHmac(ALGORITHM, key).update(hash).digest('hex');
  }

  describe('Hash Computation', () => {
    it('should generate consistent hashes for same input', () => {
      const data = { action: 'LOGIN', userId: 1, timestamp: '2025-01-01T00:00:00Z' };
      const hash1 = computeHash(data);
      const hash2 = computeHash(data);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const data1 = { action: 'LOGIN', userId: 1 };
      const data2 = { action: 'LOGOUT', userId: 1 };
      const hash1 = computeHash(data1);
      const hash2 = computeHash(data2);
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex hashes', () => {
      const data = { test: 'data' };
      const hash = computeHash(data);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('HMAC Signature', () => {
    const signingKey = crypto.createHash('sha256').update('test-signing-key').digest();

    it('should generate consistent signatures for same hash', () => {
      const hash = 'abcd1234';
      const sig1 = generateSignature(hash, signingKey);
      const sig2 = generateSignature(hash, signingKey);
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different hashes', () => {
      const sig1 = generateSignature('hash1', signingKey);
      const sig2 = generateSignature('hash2', signingKey);
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures with different keys', () => {
      const key1 = crypto.createHash('sha256').update('key1').digest();
      const key2 = crypto.createHash('sha256').update('key2').digest();
      const sig1 = generateSignature('same-hash', key1);
      const sig2 = generateSignature('same-hash', key2);
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('Hash Chain Verification', () => {
    interface AuditEntry {
      id: string;
      action: string;
      previousHash: string;
      hash: string;
      signature: string;
    }

    function createChainEntry(
      action: string, 
      previousHash: string, 
      signingKey: Buffer
    ): AuditEntry {
      const id = crypto.randomUUID();
      const entryData = { id, action, previousHash };
      const hash = computeHash(entryData);
      const signature = generateSignature(hash, signingKey);
      return { id, action, previousHash, hash, signature };
    }

    it('should create valid hash chain', () => {
      const signingKey = crypto.createHash('sha256').update('chain-key').digest();
      const chain: AuditEntry[] = [];

      const entry1 = createChainEntry('CREATE', 'GENESIS', signingKey);
      chain.push(entry1);

      const entry2 = createChainEntry('UPDATE', entry1.hash, signingKey);
      chain.push(entry2);

      const entry3 = createChainEntry('DELETE', entry2.hash, signingKey);
      chain.push(entry3);

      expect(chain[1].previousHash).toBe(chain[0].hash);
      expect(chain[2].previousHash).toBe(chain[1].hash);
    });

    it('should detect chain tampering', () => {
      const signingKey = crypto.createHash('sha256').update('chain-key').digest();
      const entry1 = createChainEntry('CREATE', 'GENESIS', signingKey);
      const entry2 = createChainEntry('UPDATE', entry1.hash, signingKey);

      const tamperedEntry1 = { ...entry1, action: 'TAMPERED' };
      const recomputedHash = computeHash({
        id: tamperedEntry1.id,
        action: tamperedEntry1.action,
        previousHash: tamperedEntry1.previousHash
      });

      expect(recomputedHash).not.toBe(tamperedEntry1.hash);
      expect(entry2.previousHash).not.toBe(recomputedHash);
    });

    it('should verify signatures', () => {
      const signingKey = crypto.createHash('sha256').update('sig-key').digest();
      const entry = createChainEntry('ACTION', 'PREV', signingKey);
      const expectedSignature = generateSignature(entry.hash, signingKey);
      expect(entry.signature).toBe(expectedSignature);
    });
  });
});

describe('Encryption Module - AES-256-GCM', () => {
  const ALGORITHM = 'aes-256-gcm';
  const KEY_SIZE = 32;
  const IV_SIZE = 16;
  const AUTH_TAG_SIZE = 16;

  function encrypt(plaintext: string, key: Buffer): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(IV_SIZE);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
    };
  }

  function decrypt(ciphertext: string, key: Buffer, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  describe('Encryption/Decryption', () => {
    const testKey = crypto.randomBytes(KEY_SIZE);

    it('should encrypt and decrypt successfully', () => {
      const plaintext = 'Hello, secure world!';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const decrypted = decrypt(ciphertext, testKey, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const decrypted = decrypt(ciphertext, testKey, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '日本語テスト 🔐 éàü';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const decrypted = decrypt(ciphertext, testKey, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle large data', () => {
      const plaintext = 'A'.repeat(100000);
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const decrypted = decrypt(ciphertext, testKey, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Security Properties', () => {
    const testKey = crypto.randomBytes(KEY_SIZE);

    it('should generate different IVs for same plaintext', () => {
      const plaintext = 'Same text';
      const result1 = encrypt(plaintext, testKey);
      const result2 = encrypt(plaintext, testKey);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.ciphertext).not.toBe(result2.ciphertext);
    });

    it('should fail decryption with wrong key', () => {
      const plaintext = 'Secret data';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const wrongKey = crypto.randomBytes(KEY_SIZE);
      
      expect(() => decrypt(ciphertext, wrongKey, iv, authTag)).toThrow();
    });

    it('should fail decryption with tampered ciphertext', () => {
      const plaintext = 'Original data';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const tamperedCiphertext = ciphertext.slice(0, -4) + '0000';
      
      expect(() => decrypt(tamperedCiphertext, testKey, iv, authTag)).toThrow();
    });

    it('should fail decryption with wrong auth tag', () => {
      const plaintext = 'Protected data';
      const { ciphertext, iv, authTag } = encrypt(plaintext, testKey);
      const wrongAuthTag = crypto.randomBytes(AUTH_TAG_SIZE).toString('hex');
      
      expect(() => decrypt(ciphertext, testKey, iv, wrongAuthTag)).toThrow();
    });
  });

  describe('Key Generation', () => {
    it('should generate 256-bit keys', () => {
      const key = crypto.randomBytes(KEY_SIZE);
      expect(key.length).toBe(KEY_SIZE);
    });

    it('should generate unique keys', () => {
      const key1 = crypto.randomBytes(KEY_SIZE);
      const key2 = crypto.randomBytes(KEY_SIZE);
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });
  });
});

describe('Rate Limiter Logic', () => {
  interface RateLimitEntry {
    count: number;
    firstRequest: number;
    lastRequest: number;
  }

  class SimpleRateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number) {
      this.maxRequests = maxRequests;
      this.windowMs = windowMs;
    }

    check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const entry = this.limits.get(key);

      if (!entry || now - entry.firstRequest > this.windowMs) {
        this.limits.set(key, { count: 1, firstRequest: now, lastRequest: now });
        return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
      }

      if (entry.count >= this.maxRequests) {
        return { 
          allowed: false, 
          remaining: 0, 
          resetAt: entry.firstRequest + this.windowMs 
        };
      }

      entry.count++;
      entry.lastRequest = now;
      return { 
        allowed: true, 
        remaining: this.maxRequests - entry.count, 
        resetAt: entry.firstRequest + this.windowMs 
      };
    }

    reset(key: string): void {
      this.limits.delete(key);
    }
  }

  describe('Request Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new SimpleRateLimiter(5, 60000);
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user1');
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new SimpleRateLimiter(2, 60000);
      limiter.check('user1');
      limiter.check('user1');
      const result = limiter.check('user1');
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track remaining requests', () => {
      const limiter = new SimpleRateLimiter(5, 60000);
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user1');
      
      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
    });

    it('should isolate different keys', () => {
      const limiter = new SimpleRateLimiter(2, 60000);
      limiter.check('user1');
      limiter.check('user1');
      const user1Result = limiter.check('user1');
      const user2Result = limiter.check('user2');
      
      expect(user1Result.allowed).toBe(false);
      expect(user2Result.allowed).toBe(true);
    });
  });

  describe('Window Management', () => {
    it('should reset after window expires', async () => {
      const limiter = new SimpleRateLimiter(2, 100);
      limiter.check('user1');
      limiter.check('user1');
      expect(limiter.check('user1').allowed).toBe(false);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(limiter.check('user1').allowed).toBe(true);
    });

    it('should provide reset time', () => {
      const limiter = new SimpleRateLimiter(5, 60000);
      const now = Date.now();
      const result = limiter.check('user1');
      
      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBeLessThanOrEqual(now + 60000);
    });
  });
});

describe('Input Validation Patterns', () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(emailPattern.test('user@example.com')).toBe(true);
      expect(emailPattern.test('user.name@domain.co.uk')).toBe(true);
      expect(emailPattern.test('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(emailPattern.test('invalid')).toBe(false);
      expect(emailPattern.test('@example.com')).toBe(false);
      expect(emailPattern.test('user@')).toBe(false);
      expect(emailPattern.test('user @example.com')).toBe(false);
    });
  });

  describe('UUID Validation', () => {
    it('should accept valid UUIDs', () => {
      expect(uuidPattern.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(uuidPattern.test('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidPattern.test('not-a-uuid')).toBe(false);
      expect(uuidPattern.test('550e8400-e29b-41d4-a716')).toBe(false);
      expect(uuidPattern.test('550e8400e29b41d4a716446655440000')).toBe(false);
    });
  });
});
