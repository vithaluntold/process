import { db } from "@/lib/db";
import { eventLogs, discoveredModels, activities as activitiesTable } from "@/shared/schema";
import { eq } from "drizzle-orm";

interface EventLog {
  id: number;
  processId: number;
  caseId: string;
  activity: string;
  timestamp: Date;
  resource: string | null;
  metadata: any;
}

interface AlphaMinerResult {
  activities: Set<string>;
  startActivities: Set<string>;
  endActivities: Set<string>;
  directSuccession: Map<string, Set<string>>;
  causalRelations: Array<[string, string]>;
  parallelRelations: Array<[string, string]>;
  choiceRelations: Array<[string, string]>;
  transitions: Array<{
    from: string;
    to: string;
    frequency: number;
  }>;
  modelData: any;
}

export class AlphaMiner {
  private events: EventLog[] = [];
  private traces: Map<string, EventLog[]> = new Map();

  constructor(events: EventLog[]) {
    this.events = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.groupTraces();
  }

  private groupTraces(): void {
    for (const event of this.events) {
      if (!this.traces.has(event.caseId)) {
        this.traces.set(event.caseId, []);
      }
      this.traces.get(event.caseId)!.push(event);
    }
  }

  public discover(): AlphaMinerResult {
    const activities = this.discoverActivities();
    const startActivities = this.discoverStartActivities();
    const endActivities = this.discoverEndActivities();
    const directSuccession = this.discoverDirectSuccession();
    const causalRelations = this.discoverCausalRelations(directSuccession);
    const parallelRelations = this.discoverParallelRelations(directSuccession);
    const choiceRelations = this.discoverChoiceRelations(activities, causalRelations, parallelRelations);
    const transitions = this.buildTransitions(directSuccession);

    const modelData = {
      algorithm: "alpha-miner",
      timestamp: new Date().toISOString(),
      traceCount: this.traces.size,
      eventCount: this.events.length,
      relations: {
        causal: causalRelations.length,
        parallel: parallelRelations.length,
        choice: choiceRelations.length,
      },
    };

    return {
      activities,
      startActivities,
      endActivities,
      directSuccession,
      causalRelations,
      parallelRelations,
      choiceRelations,
      transitions,
      modelData,
    };
  }

  private discoverActivities(): Set<string> {
    const activities = new Set<string>();
    for (const event of this.events) {
      activities.add(event.activity);
    }
    return activities;
  }

  private discoverStartActivities(): Set<string> {
    const startActivities = new Set<string>();
    for (const trace of this.traces.values()) {
      if (trace.length > 0) {
        startActivities.add(trace[0].activity);
      }
    }
    return startActivities;
  }

  private discoverEndActivities(): Set<string> {
    const endActivities = new Set<string>();
    for (const trace of this.traces.values()) {
      if (trace.length > 0) {
        endActivities.add(trace[trace.length - 1].activity);
      }
    }
    return endActivities;
  }

  private discoverDirectSuccession(): Map<string, Set<string>> {
    const directSuccession = new Map<string, Set<string>>();
    
    for (const trace of this.traces.values()) {
      for (let i = 0; i < trace.length - 1; i++) {
        const current = trace[i].activity;
        const next = trace[i + 1].activity;
        
        if (!directSuccession.has(current)) {
          directSuccession.set(current, new Set());
        }
        directSuccession.get(current)!.add(next);
      }
    }
    
    return directSuccession;
  }

  private discoverCausalRelations(
    directSuccession: Map<string, Set<string>>
  ): Array<[string, string]> {
    const causalRelations: Array<[string, string]> = [];
    
    for (const [from, toSet] of directSuccession.entries()) {
      for (const to of toSet) {
        const reverseExists = directSuccession.get(to)?.has(from) ?? false;
        
        if (!reverseExists) {
          causalRelations.push([from, to]);
        }
      }
    }
    
    return causalRelations;
  }

  private discoverParallelRelations(
    directSuccession: Map<string, Set<string>>
  ): Array<[string, string]> {
    const parallelRelations: Array<[string, string]> = [];
    const processed = new Set<string>();
    
    for (const [from, toSet] of directSuccession.entries()) {
      for (const to of toSet) {
        const reverseExists = directSuccession.get(to)?.has(from) ?? false;
        const pairKey = [from, to].sort().join("→");
        
        if (reverseExists && !processed.has(pairKey)) {
          parallelRelations.push([from, to]);
          processed.add(pairKey);
        }
      }
    }
    
    return parallelRelations;
  }

  private discoverChoiceRelations(
    activities: Set<string>,
    causalRelations: Array<[string, string]>,
    parallelRelations: Array<[string, string]>
  ): Array<[string, string]> {
    const choiceRelations: Array<[string, string]> = [];
    const causalMap = new Map<string, Set<string>>();
    const parallelSet = new Set(parallelRelations.map(([a, b]) => [a, b].sort().join("→")));
    
    for (const [from, to] of causalRelations) {
      if (!causalMap.has(from)) {
        causalMap.set(from, new Set());
      }
      causalMap.get(from)!.add(to);
    }
    
    for (const activity of activities) {
      const outputs = causalMap.get(activity) || new Set();
      const outputsArray = Array.from(outputs);
      
      for (let i = 0; i < outputsArray.length; i++) {
        for (let j = i + 1; j < outputsArray.length; j++) {
          const a = outputsArray[i];
          const b = outputsArray[j];
          const pairKey = [a, b].sort().join("→");
          
          if (!parallelSet.has(pairKey)) {
            choiceRelations.push([a, b]);
          }
        }
      }
    }
    
    return choiceRelations;
  }

  private buildTransitions(
    directSuccession: Map<string, Set<string>>
  ): Array<{ from: string; to: string; frequency: number }> {
    const transitions: Array<{ from: string; to: string; frequency: number }> = [];
    const transitionCounts = new Map<string, number>();
    
    for (const trace of this.traces.values()) {
      for (let i = 0; i < trace.length - 1; i++) {
        const from = trace[i].activity;
        const to = trace[i + 1].activity;
        const key = `${from}→${to}`;
        transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
      }
    }
    
    for (const [key, frequency] of transitionCounts.entries()) {
      const [from, to] = key.split("→");
      transitions.push({ from, to, frequency });
    }
    
    return transitions.sort((a, b) => b.frequency - a.frequency);
  }
}

export async function runAlphaMiner(processId: number): Promise<any> {
  const events = await db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.processId, processId));

  if (events.length === 0) {
    throw new Error("No event logs found for this process");
  }

  const miner = new AlphaMiner(events as any);
  const result = miner.discover();

  const modelId = await db
    .insert(discoveredModels)
    .values({
      processId,
      algorithm: "alpha-miner",
      version: 1,
      modelData: result.modelData,
      activities: Array.from(result.activities),
      transitions: result.transitions,
      startActivities: Array.from(result.startActivities),
      endActivities: Array.from(result.endActivities),
      metadata: {
        causalRelations: result.causalRelations,
        parallelRelations: result.parallelRelations,
        choiceRelations: result.choiceRelations,
      },
    })
    .returning({ id: discoveredModels.id });

  return {
    modelId: modelId[0].id,
    activities: Array.from(result.activities),
    startActivities: Array.from(result.startActivities),
    endActivities: Array.from(result.endActivities),
    transitions: result.transitions,
    causalRelations: result.causalRelations,
    parallelRelations: result.parallelRelations,
    choiceRelations: result.choiceRelations,
    metadata: result.modelData,
  };
}
