import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { costMetrics, roiCalculations, processes, eventLogs } from "@/shared/schema";
import { eq, and, sum, count } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processId = req.nextUrl.searchParams.get("processId");

    if (!processId) {
      return NextResponse.json({ error: "Process ID required" }, { status: 400 });
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

    const metrics = await db
      .select()
      .from(costMetrics)
      .where(eq(costMetrics.processId, parseInt(processId)));

    const roiData = await db
      .select()
      .from(roiCalculations)
      .where(eq(roiCalculations.processId, parseInt(processId)))
      .orderBy(roiCalculations.createdAt);

    if (metrics.length === 0) {
      await generateCostMetrics(parseInt(processId));
      const newMetrics = await db
        .select()
        .from(costMetrics)
        .where(eq(costMetrics.processId, parseInt(processId)));
      
      return NextResponse.json({ metrics: newMetrics, roiCalculations: roiData });
    }

    return NextResponse.json({ metrics, roiCalculations: roiData });
  } catch (error) {
    console.error("Failed to fetch cost analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost analysis" },
      { status: 500 }
    );
  }
}

async function generateCostMetrics(processId: number) {
  const logs = await db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.processId, processId));

  const activityCounts = new Map<string, number>();
  logs.forEach(log => {
    const count = activityCounts.get(log.activity) || 0;
    activityCounts.set(log.activity, count + 1);
  });

  for (const [activity, frequency] of activityCounts.entries()) {
    const resourceCost = Math.random() * 50 + 10;
    const timeCost = Math.random() * 100 + 20;
    const totalCost = (resourceCost + timeCost) * frequency;
    const costPerExecution = resourceCost + timeCost;

    await db.insert(costMetrics).values({
      processId,
      activityName: activity,
      resourceCost,
      timeCost,
      totalCost,
      currency: "USD",
      frequency,
      costPerExecution,
      metadata: { generated: true },
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { processId, currentCost, optimizedCost, implementationCost } = await req.json();

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, processId),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const savings = currentCost - optimizedCost;
    const savingsPercentage = (savings / currentCost) * 100;
    const timeToRoi = implementationCost ? Math.ceil(implementationCost / (savings / 12)) : null;

    const [calculation] = await db
      .insert(roiCalculations)
      .values({
        processId,
        userId: user.id,
        currentCost,
        optimizedCost,
        savings,
        savingsPercentage,
        timeToRoi,
        implementationCost: implementationCost || null,
        metadata: { calculatedAt: new Date().toISOString() },
      })
      .returning();

    return NextResponse.json(calculation);
  } catch (error) {
    console.error("Failed to calculate ROI:", error);
    return NextResponse.json(
      { error: "Failed to calculate ROI" },
      { status: 500 }
    );
  }
}
