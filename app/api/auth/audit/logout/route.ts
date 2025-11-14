import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { requireCSRF } from "@/lib/csrf";
import { checkRateLimit, API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id);

    const csrfError = requireCSRF(request);
    if (csrfError) return csrfError;

    const rateLimitResult = checkRateLimit(`api-write:${userId}`, API_WRITE_LIMIT);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": API_WRITE_LIMIT.maxAttempts.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await db.insert(schema.auditLogs).values({
      userId,
      action: "auth.logout",
      resource: "authentication",
      resourceId: userId.toString(),
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { email: session.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRITICAL: Logout audit failed:", error);
    return NextResponse.json(
      { error: "Audit logging failed" },
      { status: 500 }
    );
  }
}
