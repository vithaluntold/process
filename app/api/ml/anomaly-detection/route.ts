/**
 * ML Anomaly Detection API - Enhanced with Python ML Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { withApiGuards } from '@/lib/api-guards';
import { API_ANALYSIS_LIMIT } from '@/lib/rate-limiter';
import { db } from '@/lib/db';
import { eventLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { detectAnomaliesWithML } from '@/lib/ml-client';

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

    const durations: number[] = [];
    const caseGroups = new Map<string, typeof events>();

    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    for (const [, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const duration = new Date(sorted[i + 1].timestamp).getTime() - 
                        new Date(sorted[i].timestamp).getTime();
        durations.push(duration);
      }
    }

    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(
      durations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / durations.length
    );

    const anomalies: Array<{
      caseId: string;
      activity: string;
      timestamp: Date;
      score: number;
      severity: string;
    }> = [];

    let durationIndex = 0;
    for (const [caseId, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const duration = durations[durationIndex++];
        const zScore = stdDev > 0 ? Math.abs((duration - mean) / stdDev) : 0;
        
        if (zScore > 3) {
          anomalies.push({
            caseId,
            activity: sorted[i].activity,
            timestamp: sorted[i].timestamp,
            score: zScore,
            severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: 'statistical_fallback',
      algorithm: 'z_score',
      totalEvents: events.length,
      anomaliesDetected: anomalies.length,
      anomalyRate: anomalies.length / events.length,
      anomalies: anomalies.slice(0, 100),
      modelMetrics: {
        mean: mean / 1000,
        stdDev: stdDev / 1000,
        threshold: 3,
      },
    });
  } catch (error) {
    console.error('ML anomaly detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}
