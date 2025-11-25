import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processHealthScores, processes, eventLogs, conformanceResults } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processId = req.nextUrl.searchParams.get("processId");

    if (!processId) {
      return NextResponse.json(
        { error: "Process ID required" },
        { status: 400 }
      );
    }

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, parseInt(processId)),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const latestScore = await db
      .select()
      .from(processHealthScores)
      .where(eq(processHealthScores.processId, parseInt(processId)))
      .orderBy(desc(processHealthScores.createdAt))
      .limit(1);

    if (latestScore.length > 0) {
      return NextResponse.json(latestScore[0]);
    }

    const healthScore = await calculateHealthScore(parseInt(processId));
    
    const [newScore] = await db
      .insert(processHealthScores)
      .values({
        processId: parseInt(processId),
        ...healthScore,
      })
      .returning();

    return NextResponse.json(newScore);
  } catch (error) {
    console.error("Failed to fetch health score:", error);
    return NextResponse.json(
      { error: "Failed to fetch health score" },
      { status: 500 }
    );
  }
}

async function calculateHealthScore(processId: number) {
  const logs = await db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.processId, processId));

  const conformance = await db
    .select()
    .from(conformanceResults)
    .where(eq(conformanceResults.processId, processId))
    .orderBy(desc(conformanceResults.timestamp))
    .limit(1);

  const performanceScore = logs.length > 10 ? 85 : 70;
  const complianceScore = conformance.length > 0 
    ? Math.min(100, (conformance[0].fitness || 0) * 100) 
    : 75;
  
  const efficiencyScore = logs.length > 0 ? 80 : 60;
  const healthScore = (performanceScore + complianceScore + efficiencyScore) / 3;

  return {
    healthScore: Math.round(healthScore),
    performanceScore: Math.round(performanceScore),
    complianceScore: Math.round(complianceScore),
    efficiencyScore: Math.round(efficiencyScore),
    metadata: {
      totalEvents: logs.length,
      conformanceChecked: conformance.length > 0,
    },
  };
}
