import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedReports, processes, eventLogs, performanceMetrics } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { REPORT_GENERATION_LIMIT } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(req, 'report-generate', REPORT_GENERATION_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const { processId, title, type, format } = await req.json();

    if (processId) {
      const userProcess = await db.query.processes.findFirst({
        where: and(
          eq(processes.id, processId),
          eq(processes.userId, user.id)
        ),
      });

      if (!userProcess) {
        return NextResponse.json({ error: "Process not found" }, { status: 404 });
      }
    }

    const reportData = await generateReportData(processId, type, user.id);

    const [report] = await db
      .insert(generatedReports)
      .values({
        userId: user.id,
        processId: processId || null,
        title,
        type,
        format,
        status: "completed",
        metadata: reportData,
      })
      .returning();

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generateReportData(processId: number | null, type: string, userId: number) {
  const data: any = { generatedAt: new Date().toISOString() };

  if (processId) {
    const process = await db.query.processes.findFirst({
      where: eq(processes.id, processId),
    });
    
    const logs = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .limit(1000);

    const metrics = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.processId, processId))
      .limit(100);

    data.process = process;
    data.totalEvents = logs.length;
    data.uniqueCases = new Set(logs.map(l => l.caseId)).size;
    data.metrics = metrics;
  } else {
    const userProcesses = await db
      .select()
      .from(processes)
      .where(eq(processes.userId, userId))
      .limit(10);

    data.totalProcesses = userProcesses.length;
    data.processes = userProcesses;
  }

  return data;
}
