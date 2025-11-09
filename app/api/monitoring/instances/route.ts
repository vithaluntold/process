import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processInstances, eventLogs, processes } from "@/shared/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processIdParam = req.nextUrl.searchParams.get("processId");
    const statusParam = req.nextUrl.searchParams.get("status");

    const conditions = [eq(processes.userId, user.id)];
    
    if (processIdParam) {
      conditions.push(eq(processInstances.processId, parseInt(processIdParam)));
    }
    
    if (statusParam) {
      conditions.push(eq(processInstances.status, statusParam));
    }

    const instances = await db
      .select()
      .from(processInstances)
      .innerJoin(processes, eq(processInstances.processId, processes.id))
      .where(and(...conditions))
      .orderBy(desc(processInstances.createdAt))
      .limit(100);

    return NextResponse.json(instances);
  } catch (error) {
    console.error("Failed to fetch process instances:", error);
    return NextResponse.json(
      { error: "Failed to fetch instances" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { processId } = await req.json();

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, processId),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const logs = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    const caseMap = new Map<string, any[]>();
    logs.forEach((log) => {
      if (!caseMap.has(log.caseId)) {
        caseMap.set(log.caseId, []);
      }
      caseMap.get(log.caseId)!.push(log);
    });

    const newInstances = [];
    for (const [caseId, caseLogs] of caseMap.entries()) {
      const typedLogs = caseLogs as Array<typeof eventLogs.$inferSelect>;
      const existing = await db.query.processInstances.findFirst({
        where: and(
          eq(processInstances.processId, processId),
          eq(processInstances.caseId, caseId)
        ),
      });

      if (!existing) {
        const startTime = new Date(Math.min(...typedLogs.map((l) => l.timestamp.getTime())));
        const endTime = typedLogs.length > 1 
          ? new Date(Math.max(...typedLogs.map((l) => l.timestamp.getTime())))
          : null;
        
        const duration = endTime 
          ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
          : null;
        
        const currentActivity = typedLogs[typedLogs.length - 1].activity;
        const status = endTime ? "completed" : "running";

        const [instance] = await db
          .insert(processInstances)
          .values({
            processId,
            caseId,
            status,
            currentActivity,
            startTime,
            endTime: endTime || undefined,
            duration: duration || undefined,
            slaStatus: "on_track",
          })
          .returning();

        newInstances.push(instance);
      }
    }

    return NextResponse.json({
      message: "Process instances synchronized",
      count: newInstances.length,
      instances: newInstances,
    });
  } catch (error) {
    console.error("Failed to sync instances:", error);
    return NextResponse.json(
      { error: "Failed to sync instances" },
      { status: 500 }
    );
  }
}
