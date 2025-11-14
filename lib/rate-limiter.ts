type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime,
    };
  }

  if (entry.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(request: Request, userId?: number | string): string {
  // CRITICAL FIX: Prefer authenticated user ID for stable rate limiting
  if (userId) {
    return `user-${userId}`;
  }

  const trustedProxies = (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    
    if (trustedProxies.length > 0) {
      for (let i = ips.length - 1; i >= 0; i--) {
        if (!trustedProxies.includes(ips[i])) {
          return `ip-${ips[i]}`;
        }
      }
    } else {
      return `ip-${ips[0]}`;
    }
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return `ip-${xRealIp}`;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return `ip-${cfConnectingIp}`;
  }

  // Last resort: try session cookie before random fallback
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
    if (sessionMatch) {
      return `session-${sessionMatch[1]}`;
    }
  }

  // Only for truly anonymous requests (should be rare in production)
  return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
};

export const SIGNUP_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
};

export const API_GENERAL_LIMIT: RateLimitConfig = {
  maxAttempts: 100,
  windowMs: 15 * 60 * 1000,
};

export const API_WRITE_LIMIT: RateLimitConfig = {
  maxAttempts: 50,
  windowMs: 15 * 60 * 1000,
};

export const API_ANALYSIS_LIMIT: RateLimitConfig = {
  maxAttempts: 20,
  windowMs: 15 * 60 * 1000,
};

export const AI_ASSISTANT_LIMIT: RateLimitConfig = {
  maxAttempts: 20,
  windowMs: 60 * 60 * 1000,
};

export const LLM_PROVIDER_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

export const INVITATION_ACCEPT_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
};

export const UPLOAD_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};

export const REPORT_GENERATION_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
};
