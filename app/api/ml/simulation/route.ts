/**
 * ML Simulation API - Monte Carlo and Process Simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { withApiGuards } from '@/lib/api-guards';
import { API_ANALYSIS_LIMIT } from '@/lib/rate-limiter';
import { db } from '@/lib/db';
import { discoveredModels, eventLogs } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import { runSimulationWithML } from '@/lib/ml-client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'ml-simulation', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { 
      processId, 
      numSimulations = 1000, 
      algorithm = 'monte_carlo',
      parameters = {}
    } = body;

    if (!processId) {
      return NextResponse.json({ error: 'Process ID required' }, { status: 400 });
    }

    const [model] = await db
      .select()
      .from(discoveredModels)
      .where(eq(discoveredModels.processId, parseInt(processId)))
      .orderBy(desc(discoveredModels.createdAt))
      .limit(1);

    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, parseInt(processId)))
      .orderBy(eventLogs.timestamp);

    const caseGroups = new Map<string, typeof events>();
    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const cycleTimes: number[] = [];
    for (const [, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      if (sorted.length >= 2) {
        const start = new Date(sorted[0].timestamp).getTime();
        const end = new Date(sorted[sorted.length - 1].timestamp).getTime();
        cycleTimes.push((end - start) / (1000 * 60));
      }
    }

    const baseCycleTime = cycleTimes.length > 0 
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length 
      : parameters.base_cycle_time || 60;

    const variance = cycleTimes.length > 0
      ? Math.sqrt(cycleTimes.reduce((sum, val) => sum + Math.pow(val - baseCycleTime, 2), 0) / cycleTimes.length) / baseCycleTime
      : parameters.variance || 0.2;

    const modelActivities = model?.activities as string[] || [];
    const modelTransitions = model?.transitions as any[] || [];
    
    const processModel = model ? {
      activities: modelActivities,
      transitions: modelTransitions,
    } : {
      activities: Array.from(new Set(events.map(e => e.activity))),
      transitions: [],
    };

    const mlResult = await runSimulationWithML(
      processModel,
      {
        base_cycle_time: baseCycleTime,
        variance,
        ...parameters,
      },
      {
        numSimulations,
        algorithm: algorithm as 'monte_carlo' | 'parameter_based',
      }
    );

    if (mlResult) {
      return NextResponse.json({
        success: true,
        source: 'ml_api',
        algorithm: mlResult.algorithm,
        numSimulations: mlResult.num_simulations,
        results: mlResult.results,
        statistics: mlResult.statistics,
        processInfo: {
          activities: processModel.activities.length,
          baseCycleTime,
          variance,
        },
      });
    }

    const simulated: number[] = [];
    for (let i = 0; i < numSimulations; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const value = Math.max(1, baseCycleTime + z * baseCycleTime * variance);
      simulated.push(value);
    }

    simulated.sort((a, b) => a - b);

    return NextResponse.json({
      success: true,
      source: 'statistical_fallback',
      algorithm: 'monte_carlo',
      numSimulations,
      results: {
        cycle_times: simulated.slice(0, 100),
        percentiles: {
          p10: simulated[Math.floor(numSimulations * 0.1)],
          p25: simulated[Math.floor(numSimulations * 0.25)],
          p50: simulated[Math.floor(numSimulations * 0.5)],
          p75: simulated[Math.floor(numSimulations * 0.75)],
          p90: simulated[Math.floor(numSimulations * 0.9)],
          p95: simulated[Math.floor(numSimulations * 0.95)],
          p99: simulated[Math.floor(numSimulations * 0.99)],
        },
      },
      statistics: {
        mean: simulated.reduce((a, b) => a + b, 0) / numSimulations,
        median: simulated[Math.floor(numSimulations * 0.5)],
        std_dev: Math.sqrt(simulated.reduce((sum, val) => {
          const mean = simulated.reduce((a, b) => a + b, 0) / numSimulations;
          return sum + Math.pow(val - mean, 2);
        }, 0) / numSimulations),
        min: simulated[0],
        max: simulated[numSimulations - 1],
      },
      processInfo: {
        activities: processModel.activities.length,
        baseCycleTime,
        variance,
      },
    });
  } catch (error) {
    console.error('ML simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}
