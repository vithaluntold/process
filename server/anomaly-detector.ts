import { db } from "@/lib/db";
import { eventLogs, aiInsights } from "@/shared/schema";
import { eq, sql, and } from "drizzle-orm";
import OpenAI from "openai";
import pRetry from "p-retry";

interface AnomalyDetection {
  type: 'duration_outlier' | 'sequence_violation' | 'resource_anomaly' | 'temporal_anomaly' | 'frequency_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  activity: string;
  caseId: string;
  description: string;
  details: Record<string, any>;
}

interface AnomalyReport {
  totalAnomalies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  anomalies: AnomalyDetection[];
  aiInsights: string[];
}

export class AnomalyDetector {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async detectAnomalies(processId: number): Promise<AnomalyReport> {
    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    if (events.length === 0) {
      return {
        totalAnomalies: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        anomalies: [],
        aiInsights: [],
      };
    }

    const anomalies: AnomalyDetection[] = [];

    anomalies.push(...this.detectDurationOutliers(events));
    anomalies.push(...this.detectSequenceViolations(events));
    anomalies.push(...this.detectResourceAnomalies(events));
    anomalies.push(...this.detectTemporalAnomalies(events));
    anomalies.push(...this.detectFrequencyAnomalies(events));

    const severityCounts = {
      critical: anomalies.filter(a => a.severity === 'critical').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length,
    };

    const aiInsights = await this.generateAIInsights(processId, anomalies, events);

    await this.persistInsights(processId, anomalies, aiInsights);

    return {
      totalAnomalies: anomalies.length,
      criticalCount: severityCounts.critical,
      highCount: severityCounts.high,
      mediumCount: severityCounts.medium,
      lowCount: severityCounts.low,
      anomalies,
      aiInsights,
    };
  }

  private detectDurationOutliers(events: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const activityDurations = new Map<string, number[]>();
    const caseGroups = new Map<string, any[]>();

    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const sortedCases = new Map<string, any[]>();
    for (const [caseId, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      sortedCases.set(caseId, sorted);

      for (let i = 0; i < sorted.length - 1; i++) {
        const activity = sorted[i].activity;
        const duration = new Date(sorted[i + 1].timestamp).getTime() - 
                        new Date(sorted[i].timestamp).getTime();

        if (!activityDurations.has(activity)) {
          activityDurations.set(activity, []);
        }
        activityDurations.get(activity)!.push(duration);
      }
    }

    const activityStats = new Map<string, { mean: number; stdDev: number; p95: number }>();
    for (const [activity, durations] of activityDurations) {
      if (durations.length < 3) continue;

      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const stdDev = Math.sqrt(
        durations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / durations.length
      );
      const sorted = [...durations].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index];

      activityStats.set(activity, { mean, stdDev, p95 });
    }

    for (const [caseId, sortedEvents] of sortedCases) {
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const activity = sortedEvents[i].activity;
        const duration = new Date(sortedEvents[i + 1].timestamp).getTime() - 
                        new Date(sortedEvents[i].timestamp).getTime();

        const stats = activityStats.get(activity);
        if (!stats) continue;

        const zScore = stats.stdDev > 0 
          ? Math.abs((duration - stats.mean) / stats.stdDev)
          : (duration !== stats.mean ? 10 : 0);

        if (zScore > 3) {
          const severity: 'low' | 'medium' | 'high' | 'critical' = 
            zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';
          
          anomalies.push({
            type: 'duration_outlier',
            severity,
            activity,
            caseId,
            description: `Activity "${activity}" took ${(duration / 1000 / 60).toFixed(1)} minutes, which is ${zScore.toFixed(1)} standard deviations from the mean (${(stats.mean / 1000 / 60).toFixed(1)} minutes, 95th percentile: ${(stats.p95 / 1000 / 60).toFixed(1)} min)`,
            details: {
              duration: duration / 1000,
              mean: stats.mean / 1000,
              stdDev: stats.stdDev / 1000,
              p95: stats.p95 / 1000,
              zScore: zScore.toFixed(2),
            },
          });
        }
      }
    }

    return anomalies;
  }

  private detectSequenceViolations(events: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const sequenceUniqueCases = new Map<string, Set<string>>();
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

      const uniqueSequences = new Set<string>();
      for (let i = 0; i < sorted.length - 1; i++) {
        const pair = `${sorted[i].activity}→${sorted[i + 1].activity}`;
        uniqueSequences.add(pair);
      }
      
      for (const pair of uniqueSequences) {
        if (!sequenceUniqueCases.has(pair)) {
          sequenceUniqueCases.set(pair, new Set());
        }
        sequenceUniqueCases.get(pair)!.add(caseId);
      }
    }

    const totalCases = caseGroups.size;

    for (const [pair, cases] of sequenceUniqueCases) {
      const uniqueCaseCount = cases.size;
      const percentage = (uniqueCaseCount / totalCases) * 100;

      let severity: 'low' | 'medium' | 'high' | 'critical' | null = null;
      
      if (uniqueCaseCount === 1) {
        severity = 'critical';
      } else if (percentage < 2) {
        severity = 'high';
      } else if (percentage < 5) {
        severity = 'medium';
      } else if (percentage < 10) {
        severity = 'low';
      }

      if (severity) {
        const allAffectedCases = Array.from(cases);
        const displayCaseId = uniqueCaseCount === 1 ? allAffectedCases[0] : 'Multiple';
        
        anomalies.push({
          type: 'sequence_violation',
          severity,
          activity: pair.split('→')[0],
          caseId: displayCaseId,
          description: `Unusual activity sequence "${pair}" found in only ${uniqueCaseCount} out of ${totalCases} cases (${percentage.toFixed(1)}%)`,
          details: {
            sequence: pair,
            uniqueCases: uniqueCaseCount,
            totalCases,
            affectedCases: allAffectedCases.slice(0, 10),
            allCasesCount: allAffectedCases.length,
            percentage: percentage.toFixed(1),
          },
        });
      }
    }

    return anomalies;
  }

  private detectResourceAnomalies(events: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const resourceWorkload = new Map<string, number>();
    const activityResourceMap = new Map<string, Set<string>>();

    for (const event of events) {
      if (event.resource) {
        resourceWorkload.set(event.resource, (resourceWorkload.get(event.resource) || 0) + 1);

        if (!activityResourceMap.has(event.activity)) {
          activityResourceMap.set(event.activity, new Set());
        }
        activityResourceMap.get(event.activity)!.add(event.resource);
      }
    }

    const workloads = Array.from(resourceWorkload.values());
    if (workloads.length < 3) return anomalies;

    const mean = workloads.reduce((a, b) => a + b, 0) / workloads.length;
    const stdDev = Math.sqrt(
      workloads.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / workloads.length
    );

    for (const [resource, workload] of resourceWorkload) {
      const zScore = Math.abs((workload - mean) / (stdDev || 1));

      if (zScore > 2.5) {
        const severity = zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium';
        anomalies.push({
          type: 'resource_anomaly',
          severity,
          activity: 'Multiple',
          caseId: 'N/A',
          description: `Resource "${resource}" has unusual workload: ${workload} activities (${zScore.toFixed(1)} std dev from mean of ${mean.toFixed(1)})`,
          details: {
            resource,
            workload,
            mean: mean.toFixed(1),
            stdDev: stdDev.toFixed(1),
            zScore: zScore.toFixed(2),
          },
        });
      }
    }

    for (const [activity, resources] of activityResourceMap) {
      if (resources.size > 5) {
        anomalies.push({
          type: 'resource_anomaly',
          severity: 'low',
          activity,
          caseId: 'N/A',
          description: `Activity "${activity}" is performed by ${resources.size} different resources, indicating potential skill dilution or lack of specialization`,
          details: {
            activity,
            resourceCount: resources.size,
            resources: Array.from(resources),
          },
        });
      }
    }

    return anomalies;
  }

  private detectTemporalAnomalies(events: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const hourlyDistribution = new Array(24).fill(0);

    for (const event of events) {
      const date = new Date(event.timestamp);
      hourlyDistribution[date.getHours()]++;
    }

    const meanHourly = hourlyDistribution.reduce((a, b) => a + b, 0) / 24;
    const stdDevHourly = Math.sqrt(
      hourlyDistribution.reduce((sum, val) => sum + Math.pow(val - meanHourly, 2), 0) / 24
    );

    hourlyDistribution.forEach((count, hour) => {
      if (count > 0) {
        const zScore = stdDevHourly > 0
          ? Math.abs((count - meanHourly) / stdDevHourly)
          : (count !== meanHourly ? 10 : 0);
        if (zScore > 3) {
          const severity: 'low' | 'medium' | 'high' | 'critical' = 
            zScore > 5 ? 'critical' : 
            zScore > 4 ? 'high' : 
            zScore > 3.5 ? 'medium' : 'low';
          
          anomalies.push({
            type: 'temporal_anomaly',
            severity,
            activity: 'Multiple',
            caseId: 'N/A',
            description: `Unusual activity spike at ${hour}:00 with ${count} events (${zScore.toFixed(1)} std dev from mean of ${meanHourly.toFixed(1)})`,
            details: {
              hour,
              count,
              mean: meanHourly.toFixed(1),
              stdDev: stdDevHourly.toFixed(1),
              zScore: zScore.toFixed(2),
            },
          });
        }
      }
    });

    return anomalies;
  }

  private detectFrequencyAnomalies(events: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    const caseActivityCount = new Map<string, Map<string, number>>();

    for (const event of events) {
      if (!caseActivityCount.has(event.caseId)) {
        caseActivityCount.set(event.caseId, new Map());
      }
      const caseMap = caseActivityCount.get(event.caseId)!;
      caseMap.set(event.activity, (caseMap.get(event.activity) || 0) + 1);
    }

    for (const [caseId, activityMap] of caseActivityCount) {
      for (const [activity, count] of activityMap) {
        if (count > 3) {
          const severity: 'low' | 'medium' | 'high' | 'critical' = 
            count > 15 ? 'critical' : 
            count > 10 ? 'high' : 
            count > 5 ? 'medium' : 'low';
          
          anomalies.push({
            type: 'frequency_anomaly',
            severity,
            activity,
            caseId,
            description: `Activity "${activity}" was executed ${count} times in case ${caseId}, indicating ${count > 10 ? 'severe' : 'possible'} rework or loops`,
            details: {
              activity,
              caseId,
              executionCount: count,
            },
          });
        }
      }
    }

    return anomalies;
  }

  private async generateAIInsights(
    processId: number,
    anomalies: AnomalyDetection[],
    events: any[]
  ): Promise<string[]> {
    if (anomalies.length === 0) {
      return ['No anomalies detected. Process execution appears normal.'];
    }

    try {
      const summary = this.createAnomalySummary(anomalies, events);

      const completion = await pRetry(
        async () => {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a process mining expert analyzing business process anomalies. Provide concise, actionable insights about detected anomalies and their potential root causes.",
              },
              {
                role: "user",
                content: `Analyze these process anomalies and provide 3-5 key insights:\n\n${summary}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          });
          return response;
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000,
          onFailedAttempt: (ctx) => {
            console.warn(`AI insight generation attempt ${ctx.attemptNumber} failed:`, ctx.error.message);
          },
        }
      );

      const content = completion.choices[0]?.message?.content || '';
      const lines = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[\d\.\-\*\s]+/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
      
      return lines.length > 0 ? lines : ['AI insights generated successfully.'];
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      return ['AI analysis temporarily unavailable. Statistical anomalies have been detected.'];
    }
  }

  private createAnomalySummary(anomalies: AnomalyDetection[], events: any[]): string {
    const byType = new Map<string, number>();
    const bySeverity = new Map<string, number>();

    for (const anomaly of anomalies) {
      byType.set(anomaly.type, (byType.get(anomaly.type) || 0) + 1);
      bySeverity.set(anomaly.severity, (bySeverity.get(anomaly.severity) || 0) + 1);
    }

    let summary = `Process Analysis Summary:\n`;
    summary += `Total Events: ${events.length}\n`;
    summary += `Total Anomalies: ${anomalies.length}\n\n`;

    summary += `Anomalies by Severity:\n`;
    for (const [severity, count] of bySeverity) {
      summary += `- ${severity}: ${count}\n`;
    }

    summary += `\nAnomalies by Type:\n`;
    for (const [type, count] of byType) {
      summary += `- ${type.replace(/_/g, ' ')}: ${count}\n`;
    }

    summary += `\nTop 5 Critical Anomalies:\n`;
    const topAnomalies = anomalies
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .slice(0, 5);

    for (const anomaly of topAnomalies) {
      summary += `- ${anomaly.description}\n`;
    }

    return summary;
  }

  private async persistInsights(
    processId: number,
    anomalies: AnomalyDetection[],
    insights: string[]
  ): Promise<void> {
    try {
      await db
        .delete(aiInsights)
        .where(
          and(
            eq(aiInsights.processId, processId),
            eq(aiInsights.type, 'anomaly_detection')
          )
        );

      const impact = anomalies.some(a => a.severity === 'critical') ? 'critical' : 
                    anomalies.some(a => a.severity === 'high') ? 'high' : 'medium';
      
      const combinedDescription = insights.join('\n\n');
      
      await db.insert(aiInsights).values({
        processId,
        type: 'anomaly_detection',
        category: 'quality',
        title: `Anomaly Detection Report - ${anomalies.length} Issues Found`,
        description: combinedDescription,
        confidence: 0.85,
        impact,
        recommendations: anomalies.slice(0, 20).map(a => ({
          type: a.type,
          description: a.description,
          severity: a.severity,
          activity: a.activity,
          caseId: a.caseId,
          details: a.details,
        })),
        metadata: {
          totalAnomalies: anomalies.length,
          criticalCount: anomalies.filter(a => a.severity === 'critical').length,
          highCount: anomalies.filter(a => a.severity === 'high').length,
          mediumCount: anomalies.filter(a => a.severity === 'medium').length,
          lowCount: anomalies.filter(a => a.severity === 'low').length,
          detectionTimestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to persist AI insights:', error);
    }
  }
}
