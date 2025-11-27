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
import { MonteCarloSimulator } from '@/lib/ts-ml-algorithms';

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

    const simulationResult = MonteCarloSimulator.simulate(
      baseCycleTime,
      variance,
      numSimulations
    );

    return NextResponse.json({
      success: true,
      source: 'typescript_ml',
      algorithm: 'monte_carlo',
      numSimulations,
      results: {
        cycle_times: simulationResult.samples,
        percentiles: simulationResult.percentiles,
      },
      statistics: simulationResult.statistics,
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
