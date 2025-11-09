import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, performanceMetrics, automationOpportunities } from "@/shared/schema";
import { eq, sql, count, avg } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [processStats] = await db
      .select({
        processCount: count(processes.id),
      })
      .from(processes)
      .where(eq(processes.userId, user.id));

    const [metricsStats] = await db
      .select({
        avgCycleTime: avg(performanceMetrics.cycleTime),
        avgConformance: avg(performanceMetrics.conformanceRate),
      })
      .from(performanceMetrics)
      .innerJoin(processes, eq(processes.id, performanceMetrics.processId))
      .where(eq(processes.userId, user.id));

    const [automationStats] = await db
      .select({
        avgAutomation: avg(automationOpportunities.automationPotential),
      })
      .from(automationOpportunities)
      .innerJoin(processes, eq(processes.id, automationOpportunities.processId))
      .where(eq(processes.userId, user.id));

    const stats = {
      processCount: processStats?.processCount || 0,
      avgCycleTime: metricsStats?.avgCycleTime ? Math.round(Number(metricsStats.avgCycleTime) * 10) / 10 : 0,
      conformanceRate: metricsStats?.avgConformance ? Math.round(Number(metricsStats.avgConformance) * 10) / 10 : 0,
      automationPotential: automationStats?.avgAutomation ? Math.round(Number(automationStats.avgAutomation) * 10) / 10 : 0,
    };

    return NextResponse.json({ stats }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
