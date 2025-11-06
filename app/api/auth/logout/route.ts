import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (session?.user) {
      await db.insert(schema.auditLogs).values({
        userId: parseInt((session.user as any).id),
        action: "auth.logout",
        resource: "authentication",
        resourceId: (session.user as any).id,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: { email: session.user.email },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout audit error:", error);
    return NextResponse.json({ success: true });
  }
}
