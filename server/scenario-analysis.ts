import { DiscreteEventSimulator } from "./simulation-engine";
import { db } from "@/lib/db";
import { eventLogs, discoveredModels } from "@/shared/schema";
import { eq } from "drizzle-orm";

interface ScenarioParams {
  name: string;
  durationMultiplier: number;
  resourceMultiplier: number;
  numberOfCases: number;
}

interface ScenarioResult {
  name: string;
  type: 'optimistic' | 'expected' | 'pessimistic';
  avgCycleTime: number;
  throughput: number;
  completedCases: number;
  bottlenecks: string[];
  utilizationRate: number;
}

interface ComparisonMetrics {
  metric: string;
  best: number;
  expected: number;
  worst: number;
  deltaVsExpected: number;
  percentChange: number;
}

interface RiskAssessment {
  slaBreachProbability: number;
  highRiskActivities: string[];
  recommendations: string[];
}

interface ScenarioAnalysisReport {
  processId: number;
  scenarios: ScenarioResult[];
  comparisons: ComparisonMetrics[];
  riskAssessment: RiskAssessment;
  chartData: Array<{
    scenario: string;
    cycleTime: number;
    throughput: number;
    utilization: number;
  }>;
}

export class ScenarioAnalysisService {
  async analyzeScenarios(processId: number): Promise<ScenarioAnalysisReport> {
    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    if (events.length === 0) {
      throw new Error("No event logs found for scenario analysis");
    }

    const processModel = await this.buildProcessModel(events);
    const activityStats = this.calculateActivityStats(events);

    const scenarios: ScenarioParams[] = [
      {
        name: "Best Case",
        durationMultiplier: 0.7,
        resourceMultiplier: 1.3,
        numberOfCases: 100,
      },
      {
        name: "Expected Case",
        durationMultiplier: 1.0,
        resourceMultiplier: 1.0,
        numberOfCases: 100,
      },
      {
        name: "Worst Case",
        durationMultiplier: 1.5,
        resourceMultiplier: 0.7,
        numberOfCases: 100,
      },
    ];

    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(
        processModel,
        activityStats,
        scenario
      );
      results.push(result);
    }

    const comparisons = this.buildComparisons(results);
    const riskAssessment = this.assessRisk(results, events);
    const chartData = this.buildChartData(results);

    return {
      processId,
      scenarios: results,
      comparisons,
      riskAssessment,
      chartData,
    };
  }

  private async buildProcessModel(events: any[]): Promise<any> {
    const activities = new Set<string>();
    const startActivities = new Set<string>();
    const endActivities = new Set<string>();
    const transitions = new Map<string, Set<string>>();
    const transitionFrequencies = new Map<string, number>();

    const caseGroups = new Map<string, any[]>();
    for (const event of events) {
      activities.add(event.activity);
      
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    for (const [caseId, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (sorted.length > 0) {
        startActivities.add(sorted[0].activity);
        endActivities.add(sorted[sorted.length - 1].activity);
      }

      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i].activity;
        const to = sorted[i + 1].activity;
        
        if (!transitions.has(from)) {
          transitions.set(from, new Set());
        }
        transitions.get(from)!.add(to);
        
        const key = `${from}->${to}`;
        transitionFrequencies.set(key, (transitionFrequencies.get(key) || 0) + 1);
      }
    }

    return {
      activities,
      startActivities,
      endActivities,
      transitions,
      transitionFrequencies,
    };
  }

  private calculateActivityStats(events: any[]): Map<string, any> {
    const activityData = new Map<string, number[]>();
    const caseGroups = new Map<string, any[]>();

    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    for (const [caseId, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const activity = sorted[i].activity;
        const duration = new Date(sorted[i + 1].timestamp).getTime() - 
                        new Date(sorted[i].timestamp).getTime();
        
        if (!activityData.has(activity)) {
          activityData.set(activity, []);
        }
        activityData.get(activity)!.push(duration);
      }
    }

    const stats = new Map<string, any>();
    for (const [activity, durations] of activityData) {
      if (durations.length === 0) continue;

      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const stdDev = Math.sqrt(
        durations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / durations.length
      );
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      stats.set(activity, {
        avgDuration: mean,
        stdDev,
        minDuration: min,
        maxDuration: max,
        executionCount: durations.length,
      });
    }

    return stats;
  }

  private async runScenario(
    processModel: any,
    activityStats: Map<string, any>,
    scenario: ScenarioParams
  ): Promise<ScenarioResult> {
    const effectiveDurationMultiplier = scenario.durationMultiplier / scenario.resourceMultiplier;
    
    const simulator = new DiscreteEventSimulator(
      processModel,
      activityStats,
      {
        durationMultipliers: { '*': effectiveDurationMultiplier },
        numberOfCases: scenario.numberOfCases,
      }
    );

    const results = await simulator.simulate(scenario.numberOfCases);

    const bottlenecks = results.bottlenecks || [];
    const utilizationRate = results.activityStats.length > 0
      ? results.activityStats.reduce((sum, s) => sum + s.utilizationRate, 0) / results.activityStats.length
      : 0;

    let scenarioType: 'optimistic' | 'expected' | 'pessimistic' = 'expected';
    if (scenario.name.includes("Best")) {
      scenarioType = 'optimistic';
    } else if (scenario.name.includes("Worst")) {
      scenarioType = 'pessimistic';
    }

    return {
      name: scenario.name,
      type: scenarioType,
      avgCycleTime: results.avgCycleTime / (1000 * 60 * 60),
      throughput: results.throughput,
      completedCases: results.completedCases,
      bottlenecks,
      utilizationRate,
    };
  }

  private buildComparisons(results: ScenarioResult[]): ComparisonMetrics[] {
    const best = results.find(r => r.type === 'optimistic');
    const expected = results.find(r => r.type === 'expected');
    const worst = results.find(r => r.type === 'pessimistic');

    if (!best || !expected || !worst) {
      return [];
    }

    const comparisons: ComparisonMetrics[] = [];

    const cycleTimePercent = expected.avgCycleTime !== 0
      ? ((best.avgCycleTime - expected.avgCycleTime) / expected.avgCycleTime) * 100
      : 0;

    comparisons.push({
      metric: "Cycle Time (hours)",
      best: best.avgCycleTime,
      expected: expected.avgCycleTime,
      worst: worst.avgCycleTime,
      deltaVsExpected: best.avgCycleTime - expected.avgCycleTime,
      percentChange: cycleTimePercent,
    });

    const throughputPercent = expected.throughput !== 0
      ? ((best.throughput - expected.throughput) / expected.throughput) * 100
      : 0;

    comparisons.push({
      metric: "Throughput (cases/hour)",
      best: best.throughput,
      expected: expected.throughput,
      worst: worst.throughput,
      deltaVsExpected: best.throughput - expected.throughput,
      percentChange: throughputPercent,
    });

    const utilizationPercent = expected.utilizationRate !== 0
      ? ((best.utilizationRate - expected.utilizationRate) / expected.utilizationRate) * 100
      : 0;

    comparisons.push({
      metric: "Resource Utilization (%)",
      best: best.utilizationRate,
      expected: expected.utilizationRate,
      worst: worst.utilizationRate,
      deltaVsExpected: best.utilizationRate - expected.utilizationRate,
      percentChange: utilizationPercent,
    });

    return comparisons;
  }

  private assessRisk(results: ScenarioResult[], events: any[]): RiskAssessment {
    const worst = results.find(r => r.type === 'pessimistic');
    const expected = results.find(r => r.type === 'expected');

    const slaBreachProbability = worst && expected
      ? Math.min(95, Math.max(5, (worst.avgCycleTime / expected.avgCycleTime - 1) * 100))
      : 0;

    const allBottlenecks = new Set<string>();
    for (const result of results) {
      for (const bottleneck of result.bottlenecks) {
        allBottlenecks.add(bottleneck);
      }
    }

    const highRiskActivities = Array.from(allBottlenecks).slice(0, 3);

    const recommendations: string[] = [];
    if (slaBreachProbability > 50) {
      recommendations.push("High risk of SLA breach detected. Consider adding more resources.");
    }
    if (worst && worst.avgCycleTime > (expected?.avgCycleTime || 0) * 2) {
      recommendations.push("Worst case scenario shows 2x cycle time increase. Plan contingency measures.");
    }
    if (highRiskActivities.length > 0) {
      recommendations.push(`Focus optimization efforts on: ${highRiskActivities.join(", ")}`);
    }

    return {
      slaBreachProbability,
      highRiskActivities,
      recommendations,
    };
  }

  private buildChartData(results: ScenarioResult[]): Array<{
    scenario: string;
    cycleTime: number;
    throughput: number;
    utilization: number;
  }> {
    return results.map(r => ({
      scenario: r.name,
      cycleTime: r.avgCycleTime,
      throughput: r.throughput,
      utilization: r.utilizationRate,
    }));
  }
}
