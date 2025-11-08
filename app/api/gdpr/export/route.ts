import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
      columns: {
        password: false,
      },
    });

    const processes = await db.query.processes.findMany({
      where: eq(schema.processes.userId, user.id),
      with: {
        eventLogs: true,
        processModels: true,
        activities: true,
        performanceMetrics: true,
        deviations: true,
        automationOpportunities: true,
      },
    });

    const documents = await db.query.documents.findMany({
      where: eq(schema.documents.userId, user.id),
    });

    const auditLogs = await db.query.auditLogs.findMany({
      where: eq(schema.auditLogs.userId, user.id),
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
    });

    const userProcessIds = await db
      .select({ id: schema.processes.id })
      .from(schema.processes)
      .where(eq(schema.processes.userId, user.id));
    
    const processIds = userProcessIds.map(p => p.id);
    
    const simulationScenarios = processIds.length > 0
      ? await db.query.simulationScenarios.findMany({
          where: inArray(schema.simulationScenarios.processId, processIds),
        })
      : [];
    
    const userConsents = await db.query.userConsents.findMany({
      where: eq(schema.userConsents.userId, user.id),
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData,
      processes,
      documents,
      auditLogs,
      simulationScenarios,
      consents: userConsents,
      dataRetentionPolicy: "Data exported as per GDPR Article 20 (Right to Data Portability)",
    };

    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="epi-xray-data-export-${user.id}-${Date.now()}.json"`,
      },
    });

    await db.insert(schema.auditLogs).values({
      userId: user.id,
      action: "gdpr.data_export",
      resource: "user_data",
      resourceId: user.id.toString(),
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: { exportDate: new Date().toISOString() },
    });

    return response;
  } catch (error) {
    console.error("GDPR export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
