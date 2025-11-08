import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { signupSchema, sanitizeInput } from "@/lib/validation";
import { checkRateLimit, getClientIdentifier, SIGNUP_RATE_LIMIT } from "@/lib/rate-limiter";
import { requireCSRF } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const csrfError = requireCSRF(request);
    if (csrfError) {
      return csrfError;
    }

    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`signup:${clientId}`, SIGNUP_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": SIGNUP_RATE_LIMIT.maxAttempts.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      );
    }

    const body = await request.json();
    
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = validation.data;
    
    const normalizedEmail = sanitizeInput(email.toLowerCase());

    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, normalizedEmail));

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: normalizedEmail,
        password: hashedPassword,
        firstName: firstName ? sanitizeInput(firstName) : null,
        lastName: lastName ? sanitizeInput(lastName) : null,
        role: "user",
      })
      .returning();

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "user.signup",
      resource: "user",
      resourceId: user.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { email: user.email },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { 
        status: 201,
        headers: {
          "X-RateLimit-Limit": SIGNUP_RATE_LIMIT.maxAttempts.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
        }
      }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
