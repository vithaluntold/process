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

export function getClientIdentifier(request: Request): string {
  const trustedProxies = (process.env.TRUSTED_PROXIES || "")
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && trustedProxies.length > 0) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    
    for (let i = ips.length - 1; i >= 0; i--) {
      if (!trustedProxies.includes(ips[i])) {
        return ips[i];
      }
    }
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp && trustedProxies.length > 0) {
    return xRealIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && trustedProxies.length > 0) {
    return cfConnectingIp;
  }

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
