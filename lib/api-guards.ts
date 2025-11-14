import { NextRequest, NextResponse } from "next/server";
import { requireCSRF } from "./csrf";
import { checkRateLimit, getClientIdentifier, RateLimitConfig } from "./rate-limiter";

/**
 * Shared API guard helper that enforces CSRF protection and rate limiting
 * CRITICAL: Call this AFTER authentication to ensure proper user-scoped rate limiting
 * 
 * @param request - Next.js request object
 * @param scope - Rate limit scope identifier (e.g., 'process-analyze', 'document-upload')
 * @param limitConfig - Rate limit configuration (e.g., API_ANALYSIS_LIMIT, API_WRITE_LIMIT)
 * @param userId - Authenticated user ID for stable rate limiting (REQUIRED for best security)
 * @returns NextResponse with error if guards fail, null if all checks pass
 * 
 * @example Correct usage:
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * 
 * const guardError = withApiGuards(request, 'process-analyze', API_ANALYSIS_LIMIT, user.id);
 * if (guardError) return guardError;
 * 
 * // Continue with business logic
 */
export function withApiGuards(
  request: NextRequest,
  scope: string,
  limitConfig: RateLimitConfig,
  userId?: number | string
): NextResponse | null {
  // CSRF protection - fail fast for invalid CSRF tokens
  const csrfError = requireCSRF(request);
  if (csrfError) return csrfError;

  // Rate limiting - use user ID for stable limiting if available
  const clientId = getClientIdentifier(request, userId);
  const rateLimit = checkRateLimit(`${scope}:${clientId}`, limitConfig);
  
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(0, Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    
    return NextResponse.json(
      { 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: retryAfterSeconds
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': limitConfig.maxAttempts.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': Math.floor(rateLimit.resetTime / 1000).toString(), // Unix epoch for client compatibility
        }
      }
    );
  }

  // All guards passed
  return null;
}
