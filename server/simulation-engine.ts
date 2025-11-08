import { db } from "@/lib/db";
import { eventLogs, discoveredModels, simulationScenarios } from "@/shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface SimulationEvent {
  id: string;
  time: number;
  type: 'activity_start' | 'activity_end' | 'token_arrival';
  caseId: string;
  activity?: string;
  data?: any;
}

interface SimulationCase {
  id: string;
  currentActivity: string | null;
  tokens: Map<string, number>;
  startTime: number;
  completedActivities: string[];
  waitingFor: string[];
}

interface ActivityStats {
  activity: string;
  avgDuration: number;
  stdDev: number;
  minDuration: number;
  maxDuration: number;
  executionCount: number;
}

interface ProcessModel {
  activities: Set<string>;
  startActivities: Set<string>;
  endActivities: Set<string>;
  transitions: Map<string, Set<string>>;
  transitionFrequencies: Map<string, number>;
}

interface ScenarioParameters {
  durationMultipliers?: Record<string, number>;
  numberOfCases?: number;
  arrivalRate?: number;
}

interface SimulationResults {
  totalCases: number;
  completedCases: number;
  avgCycleTime: number;
  throughput: number;
  activityStats: Array<{
    activity: string;
    avgWaitTime: number;
    avgProcessingTime: number;
    utilizationRate: number;
    completionCount: number;
  }>;
  bottlenecks: string[];
  caseTimes: number[];
}

export class DiscreteEventSimulator {
  private eventQueue: SimulationEvent[] = [];
  private currentTime: number = 0;
  private cases: Map<string, SimulationCase> = new Map();
  private activityStats: Map<string, ActivityStats> = new Map();
  private processModel: ProcessModel;
  private scenarioParams: ScenarioParameters;
  private completedCases: Array<{ caseId: string; cycleTime: number }> = [];
  private activityExecutions: Map<string, number[]> = new Map();
  private activityWaitTimes: Map<string, number[]> = new Map();

  constructor(
    processModel: ProcessModel,
    activityStats: Map<string, ActivityStats>,
    scenarioParams: ScenarioParameters
  ) {
    this.processModel = processModel;
    this.activityStats = activityStats;
    this.scenarioParams = scenarioParams;
  }

  private scheduleEvent(event: SimulationEvent): void {
    this.eventQueue.push(event);
    this.eventQueue.sort((a, b) => a.time - b.time);
  }

  private getNextEvent(): SimulationEvent | null {
    return this.eventQueue.shift() || null;
  }

  private sampleActivityDuration(activity: string): number {
    const stats = this.activityStats.get(activity);
    if (!stats) return 60000;

    const activityMultiplier = this.scenarioParams.durationMultipliers?.[activity];
    const globalMultiplier = this.scenarioParams.durationMultipliers?.['*'];
    const multiplier = activityMultiplier ?? globalMultiplier ?? 1.0;
    
    const mean = stats.avgDuration;
    const stdDev = stats.stdDev;
    
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    let duration = mean + z * stdDev;
    duration = Math.max(stats.minDuration, Math.min(stats.maxDuration, duration));
    
    return duration * multiplier;
  }

  private getNextActivities(currentActivity: string | null): string[] {
    if (!currentActivity) {
      return Array.from(this.processModel.startActivities);
    }

    const nextActivities = this.processModel.transitions.get(currentActivity);
    if (!nextActivities || nextActivities.size === 0) {
      return [];
    }

    return Array.from(nextActivities);
  }

  private selectNextActivity(activities: string[], caseId: string): string | null {
    if (activities.length === 0) return null;
    if (activities.length === 1) return activities[0];

    const totalFreq = activities.reduce((sum, activity) => {
      const key = `${this.cases.get(caseId)?.currentActivity}_${activity}`;
      return sum + (this.processModel.transitionFrequencies.get(key) || 1);
    }, 0);

    let random = Math.random() * totalFreq;
    for (const activity of activities) {
      const key = `${this.cases.get(caseId)?.currentActivity}_${activity}`;
      const freq = this.processModel.transitionFrequencies.get(key) || 1;
      random -= freq;
      if (random <= 0) return activity;
    }

    return activities[0];
  }

  private startActivity(caseId: string, activity: string, time: number): void {
    const duration = this.sampleActivityDuration(activity);
    
    this.scheduleEvent({
      id: `${caseId}_${activity}_end`,
      time: time + duration,
      type: 'activity_end',
      caseId,
      activity,
    });

    if (!this.activityExecutions.has(activity)) {
      this.activityExecutions.set(activity, []);
    }
    this.activityExecutions.get(activity)!.push(duration);
  }

  private completeActivity(caseId: string, activity: string, time: number): void {
    const simCase = this.cases.get(caseId);
    if (!simCase) return;

    simCase.completedActivities.push(activity);
    simCase.currentActivity = null;

    const nextActivities = this.getNextActivities(activity);
    
    if (nextActivities.length === 0 || this.processModel.endActivities.has(activity)) {
      const cycleTime = time - simCase.startTime;
      this.completedCases.push({ caseId, cycleTime });
      this.cases.delete(caseId);
    } else {
      const nextActivity = this.selectNextActivity(nextActivities, caseId);
      if (nextActivity) {
        this.startActivity(caseId, nextActivity, time);
        simCase.currentActivity = nextActivity;
      }
    }
  }

  public async simulate(numberOfCases: number = 100): Promise<SimulationResults> {
    const casesToSimulate = this.scenarioParams.numberOfCases || numberOfCases;
    const arrivalRate = this.scenarioParams.arrivalRate || 300000;

    for (let i = 0; i < casesToSimulate; i++) {
      const caseId = `sim_case_${i}`;
      const arrivalTime = i * arrivalRate;

      const startActivities = Array.from(this.processModel.startActivities);
      const firstActivity = startActivities[Math.floor(Math.random() * startActivities.length)];

      const simCase: SimulationCase = {
        id: caseId,
        currentActivity: firstActivity,
        tokens: new Map(),
        startTime: arrivalTime,
        completedActivities: [],
        waitingFor: [],
      };

      this.cases.set(caseId, simCase);
      this.startActivity(caseId, firstActivity, arrivalTime);
    }

    while (this.eventQueue.length > 0) {
      const event = this.getNextEvent();
      if (!event) break;

      this.currentTime = event.time;

      switch (event.type) {
        case 'activity_end':
          if (event.activity) {
            this.completeActivity(event.caseId, event.activity, event.time);
          }
          break;
      }
    }

    return this.computeResults();
  }

  private computeResults(): SimulationResults {
    const caseTimes = this.completedCases.map((c) => c.cycleTime);
    const avgCycleTime = caseTimes.length > 0
      ? caseTimes.reduce((sum, t) => sum + t, 0) / caseTimes.length
      : 0;

    const simulationHorizon = this.currentTime || 1;
    const throughput = simulationHorizon > 0 
      ? (this.completedCases.length / (simulationHorizon / 3600000))
      : 0;

    const activityStats: SimulationResults['activityStats'] = [];
    for (const [activity, durations] of this.activityExecutions.entries()) {
      const avgProcessingTime = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;
      const waitTimes = this.activityWaitTimes.get(activity) || [];
      const avgWaitTime = waitTimes.length > 0
        ? waitTimes.reduce((sum, w) => sum + w, 0) / waitTimes.length
        : 0;

      const utilizationRate = this.completedCases.length > 0
        ? durations.length / this.completedCases.length
        : 0;

      activityStats.push({
        activity,
        avgWaitTime,
        avgProcessingTime,
        utilizationRate: Math.min(utilizationRate, 1.0),
        completionCount: durations.length,
      });
    }

    activityStats.sort((a, b) => b.avgProcessingTime - a.avgProcessingTime);
    const bottlenecks = activityStats.slice(0, 3).map((s) => s.activity);

    return {
      totalCases: this.completedCases.length + this.cases.size,
      completedCases: this.completedCases.length,
      avgCycleTime,
      throughput,
      activityStats,
      bottlenecks,
      caseTimes,
    };
  }
}

export async function runSimulation(
  processId: number,
  scenarioParams: ScenarioParameters
): Promise<SimulationResults> {
  const models = await db
    .select()
    .from(discoveredModels)
    .where(eq(discoveredModels.processId, processId))
    .orderBy(sql`${discoveredModels.createdAt} DESC`)
    .limit(1);

  const model = models[0];
  if (!model) {
    throw new Error('No process model found for simulation');
  }

  const logs = await db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.processId, processId));

  const activityDurations = new Map<string, number[]>();
  const caseActivities = new Map<string, Array<{ activity: string; timestamp: Date }>>();

  for (const log of logs) {
    if (!caseActivities.has(log.caseId)) {
      caseActivities.set(log.caseId, []);
    }
    caseActivities.get(log.caseId)!.push({
      activity: log.activity,
      timestamp: log.timestamp,
    });
  }

  for (const [caseId, activities] of caseActivities.entries()) {
    activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];
      const duration = next.timestamp.getTime() - current.timestamp.getTime();
      
      if (!activityDurations.has(current.activity)) {
        activityDurations.set(current.activity, []);
      }
      activityDurations.get(current.activity)!.push(duration);
    }
  }

  const activityStats = new Map<string, ActivityStats>();
  for (const [activity, durations] of activityDurations.entries()) {
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    activityStats.set(activity, {
      activity,
      avgDuration: mean,
      stdDev,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      executionCount: durations.length,
    });
  }

  const transitionsArray = model.transitions as Array<{ from: string; to: string; frequency: number }>;
  const transitionsMap = new Map<string, Set<string>>();
  const transitionFreqMap = new Map<string, number>();

  for (const transition of transitionsArray) {
    if (!transitionsMap.has(transition.from)) {
      transitionsMap.set(transition.from, new Set());
    }
    transitionsMap.get(transition.from)!.add(transition.to);
    
    const key = `${transition.from}_${transition.to}`;
    transitionFreqMap.set(key, transition.frequency);
  }

  const processModel: ProcessModel = {
    activities: new Set(model.activities as string[]),
    startActivities: new Set(model.startActivities as string[]),
    endActivities: new Set(model.endActivities as string[]),
    transitions: transitionsMap,
    transitionFrequencies: transitionFreqMap,
  };

  const simulator = new DiscreteEventSimulator(processModel, activityStats, scenarioParams);
  return await simulator.simulate(scenarioParams.numberOfCases || 100);
}

export async function createAndRunScenario(
  processId: number,
  name: string,
  description: string | null,
  parameters: ScenarioParameters
): Promise<number> {
  const [scenario] = await db
    .insert(simulationScenarios)
    .values({
      processId,
      name,
      description,
      parameters,
      status: 'running',
    })
    .returning();

  try {
    const results = await runSimulation(processId, parameters);

    await db
      .update(simulationScenarios)
      .set({
        results,
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(simulationScenarios.id, scenario.id));

    return scenario.id;
  } catch (error) {
    await db
      .update(simulationScenarios)
      .set({
        status: 'failed',
      })
      .where(eq(simulationScenarios.id, scenario.id));

    throw error;
  }
}
