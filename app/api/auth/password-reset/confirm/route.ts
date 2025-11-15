import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { passwordResetConfirmSchema, sanitizeInput } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter";
import { requireCSRF } from "@/lib/csrf";

const PASSWORD_RESET_CONFIRM_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCSRF(request);
    if (csrfError) {
      return csrfError;
    }

    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`password-reset-confirm:${clientId}`, PASSWORD_RESET_CONFIRM_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": PASSWORD_RESET_CONFIRM_RATE_LIMIT.maxAttempts.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    
    const validation = passwordResetConfirmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    const sanitizedToken = sanitizeInput(token);

    const [resetToken] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(
        and(
          eq(schema.passwordResetTokens.token, sanitizedToken),
          eq(schema.passwordResetTokens.used, false),
          gt(schema.passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.users.id, resetToken.userId));

      await tx
        .update(schema.passwordResetTokens)
        .set({ used: true, usedAt: new Date() })
        .where(eq(schema.passwordResetTokens.id, resetToken.id));

      await tx.insert(schema.auditLogs).values({
        userId: resetToken.userId,
        action: "password.reset.completed",
        resource: "user",
        resourceId: resetToken.userId.toString(),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
    });

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
