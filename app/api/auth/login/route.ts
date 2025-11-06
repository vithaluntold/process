import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { signIn } from "next-auth/react";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               request.ip || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (!email || !password) {
      await db.insert(schema.auditLogs).values({
        userId: null,
        action: "auth.login.failed",
        resource: "authentication",
        resourceId: null,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { reason: "missing_credentials", email: email || null },
      });
      
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));

    if (!user || !user.password) {
      await db.insert(schema.auditLogs).values({
        userId: null,
        action: "auth.login.failed",
        resource: "authentication",
        resourceId: null,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { reason: "user_not_found", email },
      });
      
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      await db.insert(schema.auditLogs).values({
        userId: user.id,
        action: "auth.login.failed",
        resource: "authentication",
        resourceId: user.id.toString(),
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { reason: "invalid_password", email },
      });
      
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "auth.login.success",
      resource: "authentication",
      resourceId: user.id.toString(),
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { email: user.email },
    });

    return NextResponse.json({ 
      success: true,
      user: {
        email: user.email,
        id: user.id.toString()
      }
    });
  } catch (error) {
    console.error("CRITICAL: Login/audit failed:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
