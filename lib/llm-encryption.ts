import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'llm-provider-keys-salt';

function getMasterKey(): Buffer {
  const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;
  
  if (!MASTER_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MASTER_ENCRYPTION_KEY environment variable is required in production. ' +
        'Generate a secure key with: openssl rand -base64 32'
      );
    }
    console.warn(
      'WARNING: Using default encryption key in development. ' +
      'Set MASTER_ENCRYPTION_KEY environment variable for production.'
    );
    const key = crypto.scryptSync('dev-only-insecure-key-32bytes!!', SALT, 32);
    return key;
  }
  
  const key = crypto.scryptSync(MASTER_KEY, SALT, 32);
  return key;
}

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = getMasterKey();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  const combined = JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex'),
  });
  
  return Buffer.from(combined).toString('base64');
}

export function decryptApiKey(encryptedData: string): string {
  try {
    const combined = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
    
    const iv = Buffer.from(combined.iv, 'hex');
    const encrypted = combined.encrypted;
    const authTag = Buffer.from(combined.authTag, 'hex');
    
    const key = getMasterKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }
  
  const prefix = apiKey.slice(0, 8);
  const suffix = apiKey.slice(-4);
  
  return `${prefix}...${suffix}`;
}
