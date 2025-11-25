import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier, AUTH_RATE_LIMIT } from "@/lib/rate-limiter";
import { addCSRFCookie } from "@/lib/csrf";
import { getJwtSecret, JWT_ALGORITHM, JWT_EXPIRATION } from "@/lib/jwt-config";

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`login:${clientId}`, AUTH_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": AUTH_RATE_LIMIT.maxAttempts.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()));

    if (!user || !user.password) {
      console.log(`Login failed: User not found or no password for email: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      console.log(`Login failed: Invalid password for email: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log(`Login successful for user: ${email} (ID: ${user.id})`);

    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setExpirationTime(JWT_EXPIRATION.session)
      .sign(getJwtSecret());

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "auth.login",
      resource: "authentication",
      resourceId: user.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { email: user.email },
    });

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { 
        status: 200,
        headers: {
          "X-RateLimit-Limit": AUTH_RATE_LIMIT.maxAttempts.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
        }
      }
    );

    response.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    addCSRFCookie(response);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
