import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
import { discoverProcess, calculatePerformanceMetrics, identifyAutomationOpportunities } from "@/server/process-mining";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = parseInt(params.id);
    
    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const events = await storage.getEventLogsByProcess(processId);

    if (events.length === 0) {
      return NextResponse.json(
        { error: "No event logs found for this process" },
        { status: 404 }
      );
    }

    const processModel = discoverProcess(events.map(e => ({
      caseId: e.caseId,
      activity: e.activity,
      timestamp: new Date(e.timestamp),
      resource: e.resource || undefined,
    })));

    const performanceMetrics = calculatePerformanceMetrics(events.map(e => ({
      caseId: e.caseId,
      activity: e.activity,
      timestamp: new Date(e.timestamp),
      resource: e.resource || undefined,
    })));

    const automationOps = identifyAutomationOpportunities(events.map(e => ({
      caseId: e.caseId,
      activity: e.activity,
      timestamp: new Date(e.timestamp),
      resource: e.resource || undefined,
    })));

    await storage.createActivities(
      processId,
      processModel.activities.map(activity => ({
        name: activity,
        frequency: processModel.nodes.find(n => n.label === activity)?.frequency || 0,
        avgDuration: performanceMetrics.avgCycleTime,
      }))
    );

    if (automationOps.length > 0) {
      await storage.createAutomationOpportunities(processId, automationOps);
    }

    await storage.createPerformanceMetrics([{
      processId,
      period: new Date().toISOString().slice(0, 7),
      cycleTime: performanceMetrics.avgCycleTime,
      throughput: performanceMetrics.throughput,
      reworkRate: performanceMetrics.reworkRate,
      conformanceRate: 100 - performanceMetrics.reworkRate,
    }]);

    return NextResponse.json({
      processModel,
      performanceMetrics,
      automationOpportunities: automationOps,
    });
  } catch (error) {
    console.error("Error analyzing process:", error);
    return NextResponse.json(
      { error: "Failed to analyze process" },
      { status: 500 }
    );
  }
}
