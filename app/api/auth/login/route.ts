import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Login attempt for:", email);

    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));

    console.log("User found:", !!user, "Has password:", !!user?.password);

    if (!user || !user.password) {
      console.log("User not found or no password");
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);

    console.log("Password valid:", isValid);

    if (!isValid) {
      console.log("Password comparison failed");
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

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
      { status: 200 }
    );

    response.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
