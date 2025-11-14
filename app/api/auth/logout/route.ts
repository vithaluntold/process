import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session");

    let userId: number | undefined;

    if (token) {
      try {
        const { payload } = await jwtVerify(token.value, JWT_SECRET);
        userId = payload.userId as number;

        const guardError = withApiGuards(request, 'auth-logout', API_WRITE_LIMIT, userId);
        if (guardError) return guardError;

        await db.insert(schema.auditLogs).values({
          userId,
          action: "auth.logout",
          resource: "authentication",
          resourceId: userId.toString(),
          ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        });
      } catch (error) {
        console.log("Token verification failed during logout");
      }
    }

    cookieStore.delete("session");

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
