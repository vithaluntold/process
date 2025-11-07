import { NextRequest, NextResponse } from "next/server";
import { getProcesses, getPerformanceMetrics, getAutomationOpportunities } from "@/server/storage";

export async function GET(request: NextRequest) {
  try {
    const processes = await getProcesses();
    
    let totalCycleTime = 0;
    let totalConformance = 0;
    let totalAutomation = 0;
    let processesWithMetrics = 0;
    let processesWithAutomation = 0;

    for (const process of processes) {
      const metrics = await getPerformanceMetrics(process.id, 1);
      if (metrics.length > 0) {
        totalCycleTime += metrics[0].cycleTime || 0;
        totalConformance += metrics[0].conformanceRate || 0;
        processesWithMetrics++;
      }

      const opportunities = await getAutomationOpportunities(process.id);
      if (opportunities.length > 0) {
        const avgPotential = opportunities.reduce((sum: number, opp: any) => sum + (opp.automationPotential || 0), 0) / opportunities.length;
        totalAutomation += avgPotential;
        processesWithAutomation++;
      }
    }

    const stats = {
      processCount: processes.length,
      avgCycleTime: processesWithMetrics > 0 ? Math.round((totalCycleTime / processesWithMetrics) * 10) / 10 : 0,
      conformanceRate: processesWithMetrics > 0 ? Math.round((totalConformance / processesWithMetrics) * 10) / 10 : 0,
      automationPotential: processesWithAutomation > 0 ? Math.round((totalAutomation / processesWithAutomation) * 10) / 10 : 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
