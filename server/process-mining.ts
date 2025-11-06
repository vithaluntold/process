interface EventLog {
  caseId: string;
  activity: string;
  timestamp: Date;
  resource?: string;
}

interface ProcessNode {
  id: string;
  label: string;
  type: "start" | "end" | "activity" | "gateway";
  frequency: number;
}

interface ProcessEdge {
  from: string;
  to: string;
  frequency: number;
  percentage?: number;
}

interface ProcessModel {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  totalCases: number;
  activities: string[];
  avgCycleTime: number;
}

export function discoverProcess(events: EventLog[]): ProcessModel {
  if (events.length === 0) {
    return {
      nodes: [],
      edges: [],
      totalCases: 0,
      activities: [],
      avgCycleTime: 0,
    };
  }

  const cases = groupByCaseId(events);
  const activityFrequency = new Map<string, number>();
  const transitions = new Map<string, Map<string, number>>();
  const activities = new Set<string>();

  let totalDuration = 0;
  let validCases = 0;

  for (const [caseId, caseEvents] of cases) {
    const sortedEvents = caseEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (sortedEvents.length > 0) {
      const startTime = sortedEvents[0].timestamp.getTime();
      const endTime = sortedEvents[sortedEvents.length - 1].timestamp.getTime();
      const duration = (endTime - startTime) / (1000 * 60 * 60);
      
      if (duration > 0) {
        totalDuration += duration;
        validCases++;
      }
    }

    for (const event of sortedEvents) {
      activities.add(event.activity);
      activityFrequency.set(
        event.activity,
        (activityFrequency.get(event.activity) || 0) + 1
      );
    }

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const from = sortedEvents[i].activity;
      const to = sortedEvents[i + 1].activity;
      
      if (!transitions.has(from)) {
        transitions.set(from, new Map());
      }
      
      const fromTransitions = transitions.get(from)!;
      fromTransitions.set(to, (fromTransitions.get(to) || 0) + 1);
    }
  }

  const nodes: ProcessNode[] = [];
  const edges: ProcessEdge[] = [];

  const sortedActivities = Array.from(activities).sort();
  
  nodes.push({
    id: "start",
    label: "Start",
    type: "start",
    frequency: cases.size,
  });

  sortedActivities.forEach((activity, index) => {
    nodes.push({
      id: `activity_${index}`,
      label: activity,
      type: "activity",
      frequency: activityFrequency.get(activity) || 0,
    });
  });

  nodes.push({
    id: "end",
    label: "End",
    type: "end",
    frequency: cases.size,
  });

  const activityToNodeId = new Map<string, string>();
  sortedActivities.forEach((activity, index) => {
    activityToNodeId.set(activity, `activity_${index}`);
  });

  const firstActivities = new Map<string, number>();
  for (const [, caseEvents] of cases) {
    const sorted = caseEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (sorted.length > 0) {
      const first = sorted[0].activity;
      firstActivities.set(first, (firstActivities.get(first) || 0) + 1);
    }
  }

  for (const [activity, count] of firstActivities) {
    edges.push({
      from: "start",
      to: activityToNodeId.get(activity)!,
      frequency: count,
      percentage: (count / cases.size) * 100,
    });
  }

  for (const [fromActivity, toMap] of transitions) {
    const fromNodeId = activityToNodeId.get(fromActivity)!;
    
    for (const [toActivity, count] of toMap) {
      const toNodeId = activityToNodeId.get(toActivity)!;
      edges.push({
        from: fromNodeId,
        to: toNodeId,
        frequency: count,
      });
    }
  }

  const lastActivities = new Map<string, number>();
  for (const [, caseEvents] of cases) {
    const sorted = caseEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1].activity;
      lastActivities.set(last, (lastActivities.get(last) || 0) + 1);
    }
  }

  for (const [activity, count] of lastActivities) {
    edges.push({
      from: activityToNodeId.get(activity)!,
      to: "end",
      frequency: count,
      percentage: (count / cases.size) * 100,
    });
  }

  return {
    nodes,
    edges,
    totalCases: cases.size,
    activities: sortedActivities,
    avgCycleTime: validCases > 0 ? totalDuration / validCases : 0,
  };
}

export function calculatePerformanceMetrics(events: EventLog[]) {
  const cases = groupByCaseId(events);
  const metrics = {
    totalCases: cases.size,
    totalEvents: events.length,
    avgCycleTime: 0,
    throughput: 0,
    reworkRate: 0,
  };

  let totalDuration = 0;
  let reworkCases = 0;

  for (const [, caseEvents] of cases) {
    const sorted = caseEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (sorted.length > 0) {
      const startTime = sorted[0].timestamp.getTime();
      const endTime = sorted[sorted.length - 1].timestamp.getTime();
      totalDuration += (endTime - startTime) / (1000 * 60 * 60);
    }

    const activityCounts = new Map<string, number>();
    for (const event of sorted) {
      activityCounts.set(event.activity, (activityCounts.get(event.activity) || 0) + 1);
    }
    
    if (Array.from(activityCounts.values()).some(count => count > 1)) {
      reworkCases++;
    }
  }

  metrics.avgCycleTime = cases.size > 0 ? totalDuration / cases.size : 0;
  metrics.throughput = cases.size;
  metrics.reworkRate = cases.size > 0 ? (reworkCases / cases.size) * 100 : 0;

  return metrics;
}

export function identifyAutomationOpportunities(events: EventLog[]) {
  const activityStats = new Map<string, {
    frequency: number;
    totalDuration: number;
    resources: Set<string>;
  }>();

  const cases = groupByCaseId(events);

  for (const [, caseEvents] of cases) {
    const sorted = caseEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i];
      const activity = event.activity;

      if (!activityStats.has(activity)) {
        activityStats.set(activity, {
          frequency: 0,
          totalDuration: 0,
          resources: new Set(),
        });
      }

      const stats = activityStats.get(activity)!;
      stats.frequency++;
      
      if (event.resource) {
        stats.resources.add(event.resource);
      }

      if (i < sorted.length - 1) {
        const nextEvent = sorted[i + 1];
        const duration = (nextEvent.timestamp.getTime() - event.timestamp.getTime()) / (1000 * 60);
        stats.totalDuration += duration;
      }
    }
  }

  const opportunities = [];

  for (const [activity, stats] of activityStats) {
    const avgDuration = stats.frequency > 0 ? stats.totalDuration / stats.frequency : 0;
    
    const isRepetitive = stats.frequency > 10;
    const isMultipleResources = stats.resources.size > 3;
    const hasReasonableDuration = avgDuration > 1 && avgDuration < 60;

    let automationPotential = 0;
    if (isRepetitive) automationPotential += 40;
    if (isMultipleResources) automationPotential += 30;
    if (hasReasonableDuration) automationPotential += 30;

    if (automationPotential > 50) {
      opportunities.push({
        taskName: activity,
        frequency: stats.frequency,
        duration: avgDuration,
        automationPotential,
        savingsEstimate: stats.frequency * avgDuration * 50,
      });
    }
  }

  return opportunities.sort((a, b) => b.automationPotential - a.automationPotential);
}

function groupByCaseId(events: EventLog[]): Map<string, EventLog[]> {
  const cases = new Map<string, EventLog[]>();
  
  for (const event of events) {
    if (!cases.has(event.caseId)) {
      cases.set(event.caseId, []);
    }
    cases.get(event.caseId)!.push(event);
  }
  
  return cases;
}
