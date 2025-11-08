import { db } from "@/lib/db";
import { eventLogs, discoveredModels, conformanceResults } from "@/shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

interface EventLog {
  caseId: string;
  activity: string;
  timestamp: Date;
  resource: string | null;
}

interface ProcessModel {
  activities: Set<string>;
  transitions: Map<string, Set<string>>;
  startActivities: Set<string>;
  endActivities: Set<string>;
}

interface ConformanceResult {
  caseId: string;
  conformant: boolean;
  fitness: number;
  deviationType: string | null;
  deviationDetails: {
    missingTokens: number;
    remainingTokens: number;
    producedTokens: number;
    consumedTokens: number;
    totalActivities: number;
    deviations: Array<{
      activity: string;
      type: 'missing' | 'unexpected' | 'wrong_order';
      timestamp: Date;
    }>;
  };
}

export class TokenBasedReplayChecker {
  private model: ProcessModel;

  constructor(modelData: any) {
    this.model = {
      activities: new Set(modelData.activities || []),
      transitions: new Map(
        Object.entries(modelData.transitions || {}).map(([from, toSet]: [string, any]) => [
          from,
          new Set(Array.isArray(toSet) ? toSet : []),
        ])
      ),
      startActivities: new Set(modelData.startActivities || []),
      endActivities: new Set(modelData.endActivities || []),
    };
  }

  public async checkConformance(processId: number): Promise<ConformanceResult[]> {
    const logs = await db
      .select({
        caseId: eventLogs.caseId,
        activity: eventLogs.activity,
        timestamp: eventLogs.timestamp,
        resource: eventLogs.resource,
      })
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    const caseGroups = this.groupByCaseId(logs);
    const results: ConformanceResult[] = [];

    for (const [caseId, events] of caseGroups.entries()) {
      const result = this.replayCase(caseId, events);
      results.push(result);
    }

    return results;
  }

  private groupByCaseId(logs: EventLog[]): Map<string, EventLog[]> {
    const groups = new Map<string, EventLog[]>();
    for (const log of logs) {
      if (!groups.has(log.caseId)) {
        groups.set(log.caseId, []);
      }
      groups.get(log.caseId)!.push(log);
    }
    return groups;
  }

  private replayCase(caseId: string, events: EventLog[]): ConformanceResult {
    let producedTokens = 0;
    let consumedTokens = 0;
    let missingTokens = 0;
    let remainingTokens = 0;

    const deviations: Array<{
      activity: string;
      type: 'missing' | 'unexpected' | 'wrong_order';
      timestamp: Date;
    }> = [];

    const placeTokens = new Map<string, number>();
    const executedActivities = new Set<string>();

    for (const startActivity of this.model.startActivities) {
      placeTokens.set(`start_${startActivity}`, 1);
      producedTokens++;
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const activity = event.activity;

      if (!this.model.activities.has(activity)) {
        deviations.push({
          activity,
          type: 'unexpected',
          timestamp: event.timestamp,
        });
        continue;
      }

      const incomingPlaces = this.getIncomingPlaces(activity);
      let canFire = true;
      let localMissing = 0;
      let hasWrongOrder = false;

      for (const place of incomingPlaces) {
        if (!placeTokens.get(place) || placeTokens.get(place)! < 1) {
          canFire = false;
          localMissing++;
          
          if (place.includes('_to_')) {
            const predecessorActivity = place.split('_to_')[0];
            if (this.model.activities.has(predecessorActivity) && !executedActivities.has(predecessorActivity)) {
              hasWrongOrder = true;
            }
          }
        }
      }

      if (hasWrongOrder && localMissing > 0) {
        deviations.push({
          activity,
          type: 'wrong_order',
          timestamp: event.timestamp,
        });
        missingTokens += localMissing;
        
        for (const place of incomingPlaces) {
          if (!placeTokens.get(place) || placeTokens.get(place)! < 1) {
            placeTokens.set(place, 1);
            producedTokens++;
          }
        }
        canFire = true;
      } else if (localMissing > 0) {
        missingTokens += localMissing;
        deviations.push({
          activity,
          type: 'missing',
          timestamp: event.timestamp,
        });
        
        for (const place of incomingPlaces) {
          if (!placeTokens.get(place) || placeTokens.get(place)! < 1) {
            placeTokens.set(place, 1);
            producedTokens++;
          }
        }
        canFire = true;
      }

      executedActivities.add(activity);

      if (canFire || incomingPlaces.length === 0) {
        for (const place of incomingPlaces) {
          const current = placeTokens.get(place) || 0;
          if (current > 0) {
            placeTokens.set(place, current - 1);
            consumedTokens++;
          }
        }

        const outgoingPlaces = this.getOutgoingPlaces(activity);
        for (const place of outgoingPlaces) {
          const current = placeTokens.get(place) || 0;
          placeTokens.set(place, current + 1);
          producedTokens++;
        }
      } else if (this.model.startActivities.has(activity) && i === 0) {
        const outgoingPlaces = this.getOutgoingPlaces(activity);
        for (const place of outgoingPlaces) {
          const current = placeTokens.get(place) || 0;
          placeTokens.set(place, current + 1);
          producedTokens++;
        }
      }
    }

    for (const [place, tokens] of placeTokens.entries()) {
      if (tokens > 0 && !place.startsWith('end_')) {
        remainingTokens += tokens;
      }
    }

    const fitness = this.calculateFitness(
      producedTokens,
      consumedTokens,
      missingTokens,
      remainingTokens,
      events.length
    );

    const conformant = fitness >= 0.95 && deviations.length === 0;
    const deviationType = this.classifyDeviationType(deviations);

    return {
      caseId,
      conformant,
      fitness,
      deviationType,
      deviationDetails: {
        missingTokens,
        remainingTokens,
        producedTokens,
        consumedTokens,
        totalActivities: events.length,
        deviations,
      },
    };
  }

  private getIncomingPlaces(activity: string): string[] {
    const places: string[] = [];
    
    if (this.model.startActivities.has(activity)) {
      places.push(`start_${activity}`);
    }

    for (const [fromActivity, toActivities] of this.model.transitions.entries()) {
      if (toActivities.has(activity)) {
        places.push(`${fromActivity}_to_${activity}`);
      }
    }

    return places;
  }

  private getOutgoingPlaces(activity: string): string[] {
    const places: string[] = [];
    const nextActivities = this.model.transitions.get(activity);

    if (nextActivities) {
      for (const nextActivity of nextActivities) {
        places.push(`${activity}_to_${nextActivity}`);
      }
    }

    if (this.model.endActivities.has(activity)) {
      places.push(`end_${activity}`);
    }

    return places;
  }

  private calculateFitness(
    produced: number,
    consumed: number,
    missing: number,
    remaining: number,
    totalActivities: number
  ): number {
    if (totalActivities === 0) return 1.0;

    const numerator = consumed - missing;
    const denominator = consumed + remaining;

    if (denominator === 0) {
      return produced > 0 ? 1.0 : 0.0;
    }

    const fitness = numerator / denominator;
    return Math.max(0, Math.min(1, fitness));
  }

  private classifyDeviationType(
    deviations: Array<{ activity: string; type: string; timestamp: Date }>
  ): string | null {
    if (deviations.length === 0) return null;

    const types = new Set(deviations.map((d) => d.type));

    if (types.has('unexpected')) return 'unexpected_activity';
    if (types.has('wrong_order')) return 'wrong_order';
    if (types.has('missing')) return 'missing_transition';

    return 'other';
  }
}

export async function performConformanceCheck(
  processId: number,
  modelId?: number
): Promise<{
  results: ConformanceResult[];
  summary: {
    totalCases: number;
    conformantCases: number;
    nonConformantCases: number;
    averageFitness: number;
    commonDeviations: Array<{ type: string; count: number }>;
  };
}> {
  let model;
  
  if (modelId) {
    const models = await db
      .select()
      .from(discoveredModels)
      .where(and(eq(discoveredModels.processId, processId), eq(discoveredModels.id, modelId)))
      .limit(1);
    model = models[0];
  } else {
    const models = await db
      .select()
      .from(discoveredModels)
      .where(eq(discoveredModels.processId, processId))
      .orderBy(sql`${discoveredModels.createdAt} DESC`)
      .limit(1);
    model = models[0];
  }

  if (!model) {
    throw new Error('No process model found for conformance checking');
  }

  const checker = new TokenBasedReplayChecker(model.modelData);
  const results = await checker.checkConformance(processId);

  await db.delete(conformanceResults).where(eq(conformanceResults.processId, processId));

  for (const result of results) {
    await db.insert(conformanceResults).values({
      processId,
      modelId: model.id,
      caseId: result.caseId,
      conformant: result.conformant,
      deviationType: result.deviationType,
      deviationDetails: result.deviationDetails,
      fitness: result.fitness,
    });
  }

  const summary = generateSummary(results);

  return { results, summary };
}

function generateSummary(results: ConformanceResult[]) {
  const totalCases = results.length;
  const conformantCases = results.filter((r) => r.conformant).length;
  const nonConformantCases = totalCases - conformantCases;
  const averageFitness =
    results.reduce((sum, r) => sum + r.fitness, 0) / (totalCases || 1);

  const deviationCounts = new Map<string, number>();
  for (const result of results) {
    if (result.deviationType) {
      const count = deviationCounts.get(result.deviationType) || 0;
      deviationCounts.set(result.deviationType, count + 1);
    }
  }

  const commonDeviations = Array.from(deviationCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCases,
    conformantCases,
    nonConformantCases,
    averageFitness,
    commonDeviations,
  };
}
