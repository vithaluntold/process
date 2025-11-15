/**
 * Process Analysis API - Tenant-Safe Implementation
 * 
 * SECURITY: Uses tenant-safe API factory
 * Migration: COMPLETED (v2 - Factory Pattern)
 */

import { NextResponse } from "next/server";
import { createTenantSafeHandler } from "@/lib/tenant-api-factory";
import { getEventLogsByProcessWithTenantCheck } from "@/server/tenant-storage";
import * as storage from "@/server/storage";
import { discoverProcess, calculatePerformanceMetrics, identifyAutomationOpportunities } from "@/server/process-mining";
import { withApiGuards } from "@/lib/api-guards";
import { API_ANALYSIS_LIMIT } from "@/lib/rate-limiter";

export const POST = createTenantSafeHandler(async (request, context, params) => {
  const guardError = withApiGuards(request, 'process-analyze', API_ANALYSIS_LIMIT);
  if (guardError) return guardError;

  const { id } = params;
  const processId = parseInt(id);
  
  if (isNaN(processId)) {
    return NextResponse.json(
      { error: "Invalid process ID" },
      { status: 400 }
    );
  }

  // SECURITY: Automatically validates organizationId ownership
  const events = await getEventLogsByProcessWithTenantCheck(processId);

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

  function getRecommendation(potential: number): string {
    if (potential >= 80) return "RPA automation recommended - High ROI expected";
    if (potential >= 70) return "Process automation via workflow engine";
    return "Semi-automation with human oversight";
  }

  const formattedOpportunities = automationOps.map(opp => ({
    taskName: opp.taskName,
    potential: opp.automationPotential,
    savings: (opp.savingsEstimate / 50).toFixed(1),
    recommendation: getRecommendation(opp.automationPotential),
    frequency: opp.frequency,
    duration: opp.duration,
    automationPotential: opp.automationPotential,
    savingsEstimate: opp.savingsEstimate
  }));

  const totalSavings = automationOps.reduce((sum, opp) => sum + (opp.savingsEstimate / 50), 0);
  const highPriorityCount = automationOps.filter(opp => opp.automationPotential > 70).length;

  return NextResponse.json({
    processModel,
    performanceMetrics,
    automationOpportunities: {
      opportunities: formattedOpportunities,
      totalSavings: Math.round(totalSavings),
      highPriorityCount,
      raw: automationOps
    },
  });
});
