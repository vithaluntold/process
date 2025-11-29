import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { passwordResetRequestSchema, sanitizeInput } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { randomBytes } from "crypto";

const PASSWORD_RESET_REQUEST_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`password-reset:${clientId}`, PASSWORD_RESET_REQUEST_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": PASSWORD_RESET_REQUEST_RATE_LIMIT.maxAttempts.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    
    const validation = passwordResetRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = sanitizeInput(email.toLowerCase());

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (!user) {
      await db.insert(schema.auditLogs).values({
        action: "password.reset.failed",
        resource: "user",
        resourceId: normalizedEmail,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: { reason: "user_not_found", email: normalizedEmail },
      });

      return NextResponse.json(
        { 
          message: "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "password.reset.requested",
      resource: "user",
      resourceId: user.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { email: normalizedEmail },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV ONLY] Password reset requested for ${normalizedEmail}`);
      console.log(`[DEV ONLY] Reset token: ${token}`);
      console.log(`[DEV ONLY] Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/auth/reset-password?token=${token}`);
    }

    return NextResponse.json(
      { 
        message: "If an account with that email exists, a password reset link has been sent.",
        devToken: process.env.NODE_ENV === "development" ? token : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
