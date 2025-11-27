/**
 * ML Anomaly Detection API - Enhanced with Python ML Backend + TypeScript Fallbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { withApiGuards } from '@/lib/api-guards';
import { API_ANALYSIS_LIMIT } from '@/lib/rate-limiter';
import { db } from '@/lib/db';
import { eventLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { detectAnomaliesWithML } from '@/lib/ml-client';
import { AnomalyDetector, StatisticalAnalyzer } from '@/lib/ts-ml-algorithms';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'ml-anomaly', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { processId, algorithm = 'isolation_forest', contamination = 0.05 } = body;

    if (!processId) {
      return NextResponse.json({ error: 'Process ID required' }, { status: 400 });
    }

    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, parseInt(processId)))
      .orderBy(eventLogs.timestamp);

    if (events.length < 10) {
      return NextResponse.json(
        { error: 'Insufficient data: need at least 10 events' },
        { status: 400 }
      );
    }

    const formattedEvents = events.map(e => ({
      caseId: e.caseId,
      activity: e.activity,
      timestamp: e.timestamp,
      resource: e.resource || undefined,
    }));

    const mlResult = await detectAnomaliesWithML(formattedEvents, {
      algorithm: algorithm as 'isolation_forest' | 'statistical_zscore' | 'dbscan',
      contamination,
    });

    if (mlResult) {
      return NextResponse.json({
        success: true,
        source: 'ml_api',
        algorithm: mlResult.algorithm,
        totalEvents: mlResult.total_events,
        anomaliesDetected: mlResult.anomalies_detected,
        anomalyRate: mlResult.anomaly_rate,
        anomalies: mlResult.anomalies.map(a => ({
          caseId: a.case_id,
          activity: a.activity,
          timestamp: a.timestamp,
          score: a.anomaly_score || a.z_score || 0,
          severity: a.severity,
        })),
        modelMetrics: mlResult.model_metrics,
      });
    }

    const caseGroups = new Map<string, typeof events>();
    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const durations: number[] = [];
    const eventDurationMap: Array<{ caseId: string; activity: string; timestamp: Date; duration: number }> = [];

    for (const [caseId, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const duration = new Date(sorted[i + 1].timestamp).getTime() - 
                        new Date(sorted[i].timestamp).getTime();
        durations.push(duration);
        eventDurationMap.push({
          caseId,
          activity: sorted[i].activity,
          timestamp: sorted[i].timestamp,
          duration,
        });
      }
    }

    if (durations.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'statistical_fallback',
        algorithm,
        totalEvents: events.length,
        anomaliesDetected: 0,
        anomalyRate: 0,
        anomalies: [],
        modelMetrics: { message: 'No duration data available' },
      });
    }

    let detectedAnomalies: Array<{
      caseId: string;
      activity: string;
      timestamp: Date;
      score: number;
      severity: string;
    }> = [];

    let modelMetrics: Record<string, any> = {};

    if (algorithm === 'isolation_forest') {
      const results = AnomalyDetector.isolationScore(durations, contamination);
      detectedAnomalies = results.map(r => ({
        caseId: eventDurationMap[r.index].caseId,
        activity: eventDurationMap[r.index].activity,
        timestamp: eventDurationMap[r.index].timestamp,
        score: r.score,
        severity: r.severity,
      }));
      modelMetrics = {
        algorithm: 'isolation_forest_ts',
        contamination,
        threshold: StatisticalAnalyzer.percentile(durations, (1 - contamination) * 100),
      };
    } else if (algorithm === 'dbscan') {
      const results = AnomalyDetector.iqrDetection(durations, 1.5);
      detectedAnomalies = results.map(r => ({
        caseId: eventDurationMap[r.index].caseId,
        activity: eventDurationMap[r.index].activity,
        timestamp: eventDurationMap[r.index].timestamp,
        score: r.score,
        severity: r.severity,
      }));
      const { q1, q3, iqr } = StatisticalAnalyzer.iqr(durations);
      modelMetrics = {
        algorithm: 'iqr_detection',
        q1: q1 / 1000,
        q3: q3 / 1000,
        iqr: iqr / 1000,
      };
    } else {
      const results = AnomalyDetector.zScoreDetection(durations, 3);
      detectedAnomalies = results.map(r => ({
        caseId: eventDurationMap[r.index].caseId,
        activity: eventDurationMap[r.index].activity,
        timestamp: eventDurationMap[r.index].timestamp,
        score: r.score,
        severity: r.severity,
      }));
      modelMetrics = {
        algorithm: 'z_score',
        mean: StatisticalAnalyzer.mean(durations) / 1000,
        stdDev: StatisticalAnalyzer.standardDeviation(durations) / 1000,
        threshold: 3,
      };
    }

    return NextResponse.json({
      success: true,
      source: 'typescript_ml',
      algorithm: modelMetrics.algorithm || algorithm,
      totalEvents: events.length,
      anomaliesDetected: detectedAnomalies.length,
      anomalyRate: detectedAnomalies.length / events.length,
      anomalies: detectedAnomalies.slice(0, 100),
      modelMetrics,
    });
  } catch (error) {
    console.error('ML anomaly detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}
