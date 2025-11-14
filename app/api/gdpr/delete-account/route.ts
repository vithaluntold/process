import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'gdpr-delete-account', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { password, confirmation } = body;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion" },
        { status: 400 }
      );
    }

    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isValidPassword = await compare(password, dbUser.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "gdpr.account_deletion_request",
      resource: "user",
      resourceId: user.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { deletionDate: new Date().toISOString() },
    });

    const userProcesses = await db
      .select({ id: schema.processes.id })
      .from(schema.processes)
      .where(eq(schema.processes.userId, user.id));
    
    const processIds = userProcesses.map(p => p.id);

    if (processIds.length > 0) {
      for (const processId of processIds) {
        await db.delete(schema.eventLogs).where(eq(schema.eventLogs.processId, processId));
        await db.delete(schema.simulationScenarios).where(eq(schema.simulationScenarios.processId, processId));
        await db.delete(schema.performanceMetrics).where(eq(schema.performanceMetrics.processId, processId));
        await db.delete(schema.activities).where(eq(schema.activities.processId, processId));
        await db.delete(schema.processModels).where(eq(schema.processModels.processId, processId));
        await db.delete(schema.discoveredModels).where(eq(schema.discoveredModels.processId, processId));
        await db.delete(schema.aiInsights).where(eq(schema.aiInsights.processId, processId));
        await db.delete(schema.conformanceResults).where(eq(schema.conformanceResults.processId, processId));
        await db.delete(schema.deviations).where(eq(schema.deviations.processId, processId));
        await db.delete(schema.automationOpportunities).where(eq(schema.automationOpportunities.processId, processId));
      }
    }

    await db.delete(schema.processes).where(eq(schema.processes.userId, user.id));
    await db.delete(schema.documents).where(eq(schema.documents.userId, user.id));
    await db.delete(schema.userConsents).where(eq(schema.userConsents.userId, user.id));
    await db.delete(schema.auditLogs).where(eq(schema.auditLogs.userId, user.id));
    await db.delete(schema.users).where(eq(schema.users.id, user.id));

    const response = NextResponse.json(
      { message: "Account and all associated data deleted successfully" },
      { status: 200 }
    );

    response.cookies.delete("session");
    response.cookies.delete("csrf-token");

    return response;
  } catch (error) {
    console.error("GDPR deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
