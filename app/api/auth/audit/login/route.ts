import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               request.ip || 
               "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const userId = parseInt((session.user as any).id);

    await db.insert(schema.auditLogs).values({
      userId,
      action: "auth.login.success",
      resource: "authentication",
      resourceId: userId.toString(),
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { email: session.user.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRITICAL: Login audit failed:", error);
    return NextResponse.json(
      { error: "Audit logging failed" },
      { status: 500 }
    );
  }
}
