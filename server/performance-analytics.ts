import { db } from "@/lib/db";
import { eventLogs, performanceMetrics, kpiMetrics } from "@/shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";

interface PerformanceMetrics {
  averageCycleTime: number;
  medianCycleTime: number;
  throughput: number;
  totalCases: number;
  completedCases: number;
  activeCases: number;
  bottlenecks: Array<{
    activity: string;
    avgDuration: number;
    medianDuration: number;
    stdDev: number;
    count: number;
    percentile95: number;
  }>;
  activityStats: Array<{
    activity: string;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalExecutions: number;
    reworkRate: number;
  }>;
  resourceUtilization: Array<{
    resource: string;
    totalActivities: number;
    avgDuration: number;
    utilizationRate: number;
  }>;
}

export class PerformanceAnalyzer {
  async analyzeProcess(processId: number): Promise<PerformanceMetrics> {
    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    if (events.length === 0) {
      return {
        averageCycleTime: 0,
        medianCycleTime: 0,
        throughput: 0,
        totalCases: 0,
        completedCases: 0,
        activeCases: 0,
        bottlenecks: [],
        activityStats: [],
        resourceUtilization: [],
      };
    }

    const caseCycleTimes = this.calculateCycleTimes(events);
    const activityDurations = this.calculateActivityDurations(events);
    const resourceStats = this.calculateResourceUtilization(events);

    const totalCases = new Set(events.map((e) => e.caseId)).size;
    const completedCases = caseCycleTimes.length;
    const activeCases = totalCases - completedCases;

    const cycleTimes = caseCycleTimes.map((c) => c.duration);
    const averageCycleTime = this.mean(cycleTimes);
    const medianCycleTime = this.median(cycleTimes);

    const timeSpanHours = this.calculateTimeSpan(events);
    const throughput = completedCases / timeSpanHours;

    const bottlenecks = this.identifyBottlenecks(activityDurations);
    const activityStats = this.calculateActivityStats(events, activityDurations);

    await this.persistKPIs(processId, {
      averageCycleTime,
      medianCycleTime,
      throughput,
      totalCases,
      completedCases,
    });

    return {
      averageCycleTime,
      medianCycleTime,
      throughput,
      totalCases,
      completedCases,
      activeCases,
      bottlenecks,
      activityStats,
      resourceUtilization: resourceStats,
    };
  }

  private calculateCycleTimes(
    events: any[]
  ): Array<{ caseId: string; duration: number }> {
    const caseGroups = new Map<string, any[]>();

    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const cycleTimes: Array<{ caseId: string; duration: number }> = [];

    for (const [caseId, caseEvents] of caseGroups) {
      if (caseEvents.length < 2) continue;

      const sortedEvents = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const startTime = new Date(sortedEvents[0].timestamp).getTime();
      const endTime = new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime();
      const durationMs = endTime - startTime;

      cycleTimes.push({
        caseId,
        duration: durationMs,
      });
    }

    return cycleTimes;
  }

  /**
   * Calculates activity durations based on time gaps between consecutive events.
   * Note: Duration is measured from an activity's timestamp to the next event's timestamp.
   * Terminal activities (last in a case) will not have duration data and are handled
   * separately in activity statistics to avoid skewing KPI interpretation.
   */
  private calculateActivityDurations(events: any[]): Map<string, number[]> {
    const activityDurations = new Map<string, number[]>();
    const caseGroups = new Map<string, any[]>();

    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    for (const [_, caseEvents] of caseGroups) {
      const sortedEvents = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentActivity = sortedEvents[i].activity;
        const currentTime = new Date(sortedEvents[i].timestamp).getTime();
        const nextTime = new Date(sortedEvents[i + 1].timestamp).getTime();
        const duration = nextTime - currentTime;

        if (!activityDurations.has(currentActivity)) {
          activityDurations.set(currentActivity, []);
        }
        activityDurations.get(currentActivity)!.push(duration);
      }
    }

    return activityDurations;
  }

  private calculateResourceUtilization(
    events: any[]
  ): Array<{
    resource: string;
    totalActivities: number;
    avgDuration: number;
    utilizationRate: number;
  }> {
    const resourceStats = new Map<
      string,
      { count: number; totalDuration: number }
    >();

    const caseGroups = new Map<string, any[]>();
    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    for (const [_, caseEvents] of caseGroups) {
      const sortedEvents = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const resource = sortedEvents[i].resource || "Unknown";
        const currentTime = new Date(sortedEvents[i].timestamp).getTime();
        const nextTime = new Date(sortedEvents[i + 1].timestamp).getTime();
        const duration = nextTime - currentTime;

        if (!resourceStats.has(resource)) {
          resourceStats.set(resource, { count: 0, totalDuration: 0 });
        }
        const stats = resourceStats.get(resource)!;
        stats.count++;
        stats.totalDuration += duration;
      }
    }

    const totalTimeSpan = this.calculateTimeSpan(events) * 3600000; // Convert hours to ms
    const results: Array<{
      resource: string;
      totalActivities: number;
      avgDuration: number;
      utilizationRate: number;
    }> = [];

    for (const [resource, stats] of resourceStats) {
      results.push({
        resource,
        totalActivities: stats.count,
        avgDuration: stats.totalDuration / stats.count,
        utilizationRate: (stats.totalDuration / totalTimeSpan) * 100,
      });
    }

    return results.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  private identifyBottlenecks(
    activityDurations: Map<string, number[]>
  ): Array<{
    activity: string;
    avgDuration: number;
    medianDuration: number;
    stdDev: number;
    count: number;
    percentile95: number;
  }> {
    const bottlenecks: Array<{
      activity: string;
      avgDuration: number;
      medianDuration: number;
      stdDev: number;
      count: number;
      percentile95: number;
    }> = [];

    for (const [activity, durations] of activityDurations) {
      if (durations.length === 0) continue;

      const avg = this.mean(durations);
      const median = this.median(durations);
      const stdDev = this.standardDeviation(durations);
      const p95 = this.percentile(durations, 95);

      bottlenecks.push({
        activity,
        avgDuration: avg,
        medianDuration: median,
        stdDev,
        count: durations.length,
        percentile95: p95,
      });
    }

    return bottlenecks.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  private calculateActivityStats(
    events: any[],
    activityDurations: Map<string, number[]>
  ): Array<{
    activity: string;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalExecutions: number;
    reworkRate: number;
  }> {
    const activityCounts = new Map<string, number>();
    const activityRework = new Map<string, number>();
    const caseActivities = new Map<string, Set<string>>();

    for (const event of events) {
      const activity = event.activity;
      activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);

      if (!caseActivities.has(event.caseId)) {
        caseActivities.set(event.caseId, new Set());
      }

      if (caseActivities.get(event.caseId)!.has(activity)) {
        activityRework.set(activity, (activityRework.get(activity) || 0) + 1);
      }

      caseActivities.get(event.caseId)!.add(activity);
    }

    const stats: Array<{
      activity: string;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      totalExecutions: number;
      reworkRate: number;
    }> = [];

    const allActivities = new Set([
      ...activityDurations.keys(),
      ...activityCounts.keys(),
    ]);

    for (const activity of allActivities) {
      const durations = activityDurations.get(activity) || [];
      const totalExecutions = activityCounts.get(activity) || 0;
      const reworkCount = activityRework.get(activity) || 0;

      if (totalExecutions === 0) continue;

      if (durations.length > 0) {
        stats.push({
          activity,
          avgDuration: this.mean(durations),
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          totalExecutions,
          reworkRate: (reworkCount / totalExecutions) * 100,
        });
      } else {
        stats.push({
          activity,
          avgDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          totalExecutions,
          reworkRate: (reworkCount / totalExecutions) * 100,
        });
      }
    }

    return stats.sort((a, b) => b.totalExecutions - a.totalExecutions);
  }

  private calculateTimeSpan(events: any[]): number {
    if (events.length === 0) return 1;

    const timestamps = events.map((e) => new Date(e.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationMs = maxTime - minTime;

    return Math.max(durationMs / 3600000, 1); // Convert to hours, minimum 1 hour
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
    const variance = this.mean(squareDiffs);
    return Math.sqrt(variance);
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private async persistKPIs(
    processId: number,
    metrics: {
      averageCycleTime: number;
      medianCycleTime: number;
      throughput: number;
      totalCases: number;
      completedCases: number;
    }
  ): Promise<void> {
    try {
      await db.insert(kpiMetrics).values({
        processId,
        metricType: "cycle_time_avg",
        value: metrics.averageCycleTime,
        unit: "milliseconds",
        timestamp: new Date(),
      });

      await db.insert(kpiMetrics).values({
        processId,
        metricType: "cycle_time_median",
        value: metrics.medianCycleTime,
        unit: "milliseconds",
        timestamp: new Date(),
      });

      await db.insert(kpiMetrics).values({
        processId,
        metricType: "throughput",
        value: metrics.throughput,
        unit: "cases_per_hour",
        timestamp: new Date(),
      });

      await db.insert(kpiMetrics).values({
        processId,
        metricType: "completion_rate",
        value: (metrics.completedCases / metrics.totalCases) * 100,
        unit: "percentage",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to persist KPIs:", error);
    }
  }
}

export async function analyzeProcessPerformance(
  processId: number
): Promise<PerformanceMetrics> {
  const analyzer = new PerformanceAnalyzer();
  return analyzer.analyzeProcess(processId);
}
