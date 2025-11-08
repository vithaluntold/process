import OpenAI from "openai";
import pRetry from "p-retry";
import pLimit from "p-limit";
import { getUserActivitiesBySession } from "./task-mining-storage";

const openai = new OpenAI();
const limit = pLimit(3);

interface Activity {
  id: number;
  activityType: string;
  application?: string | null;
  action: string;
  windowTitle?: string | null;
  timestamp: Date;
  duration?: number | null;
}

interface DetectedPattern {
  patternName: string;
  description: string;
  frequency: number;
  avgDuration: number;
  steps: any[];
  automationPotential: number;
  timeSavingsEstimate: number;
  aiInsight: string;
}

export async function analyzeTaskPatterns(
  sessionId: number,
  activities: Activity[]
): Promise<DetectedPattern[]> {
  if (activities.length < 5) {
    return [];
  }

  const sequences = findRepetitiveSequences(activities);
  const applicationPatterns = analyzeApplicationUsage(activities);
  
  const aiAnalyzedPatterns = await Promise.all(
    sequences.map((seq) =>
      limit(() => analyzePatternWithAI(seq, activities))
    )
  );

  return aiAnalyzedPatterns.filter(Boolean) as DetectedPattern[];
}

function findRepetitiveSequences(activities: Activity[]): any[] {
  const sequences: Map<string, { activities: Activity[]; count: number }> = new Map();
  const windowSize = 5;

  for (let i = 0; i <= activities.length - windowSize; i++) {
    const window = activities.slice(i, i + windowSize);
    const signature = window
      .map((a) => `${a.activityType}:${a.action}:${a.application || ""}`)
      .join("|");

    if (sequences.has(signature)) {
      const existing = sequences.get(signature)!;
      existing.count += 1;
    } else {
      sequences.set(signature, { activities: window, count: 1 });
    }
  }

  return Array.from(sequences.entries())
    .filter(([_, data]) => data.count >= 2)
    .map(([signature, data]) => ({
      signature,
      activities: data.activities,
      frequency: data.count,
    }));
}

function analyzeApplicationUsage(activities: Activity[]): Map<string, number> {
  const appUsage = new Map<string, number>();
  
  activities.forEach((activity) => {
    const app = activity.application || "Unknown";
    appUsage.set(app, (appUsage.get(app) || 0) + 1);
  });

  return appUsage;
}

async function analyzePatternWithAI(
  sequence: any,
  allActivities: Activity[]
): Promise<DetectedPattern | null> {
  const activityPrompt = `
Analyze this repetitive task pattern from user activity logs:

Pattern occurs ${sequence.frequency} times.
Activities in pattern:
${sequence.activities.map((a: Activity, i: number) => 
  `${i + 1}. ${a.activityType} - ${a.action} in ${a.application || 'Unknown'} (${a.windowTitle || 'N/A'})`
).join('\n')}

Provide a JSON response with:
{
  "patternName": "Brief descriptive name (e.g., 'Copy-Paste Invoice Data')",
  "description": "What this pattern represents",
  "automationPotential": 0.0-1.0 score (how automatable this is),
  "timeSavingsEstimate": estimated minutes saved per occurrence if automated,
  "aiInsight": "Why this pattern matters and automation recommendation"
}`;

  try {
    const analysis = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a task mining and RPA expert. Analyze repetitive user activities and suggest automation opportunities.",
            },
            { role: "user", content: activityPrompt },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0]?.message?.content || "{}");
      },
      {
        retries: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
          console.warn(`AI analysis attempt ${error.attemptNumber} failed`);
        },
      }
    );

    const avgDuration = sequence.activities.reduce((sum: number, a: Activity) => 
      sum + (a.duration || 30000), 0
    ) / sequence.activities.length / 1000;

    return {
      patternName: analysis.patternName || "Repetitive Task",
      description: analysis.description || "Identified repetitive task sequence",
      frequency: sequence.frequency,
      avgDuration: Math.round(avgDuration),
      steps: sequence.activities.map((a: Activity) => ({
        activityType: a.activityType,
        action: a.action,
        application: a.application,
        windowTitle: a.windowTitle,
      })),
      automationPotential: analysis.automationPotential || 0.5,
      timeSavingsEstimate: analysis.timeSavingsEstimate || Math.round(avgDuration * sequence.frequency / 60),
      aiInsight: analysis.aiInsight || "Pattern identified for automation consideration",
    };
  } catch (error) {
    console.error("AI pattern analysis failed:", error);
    return null;
  }
}

export async function detectBottlenecks(activities: Activity[]): Promise<any[]> {
  const activityDurations = activities
    .filter((a) => a.duration && a.duration > 0)
    .map((a) => ({
      activity: a,
      duration: a.duration!,
    }))
    .sort((a, b) => b.duration - a.duration);

  const slowActivities = activityDurations.slice(0, 10);

  return slowActivities.map((item) => ({
    activityType: item.activity.activityType,
    action: item.activity.action,
    application: item.activity.application,
    duration: item.duration / 1000,
    severity: item.duration > 60000 ? "high" : item.duration > 30000 ? "medium" : "low",
  }));
}

export async function clusterSimilarActivities(activities: Activity[]): Promise<any[]> {
  const clusters = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const key = `${activity.activityType}:${activity.application || "Unknown"}`;
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(activity);
  });

  return Array.from(clusters.entries())
    .map(([key, acts]) => {
      const [activityType, application] = key.split(":");
      return {
        activityType,
        application,
        count: acts.length,
        avgDuration: acts.reduce((sum, a) => sum + (a.duration || 0), 0) / acts.length / 1000,
        actions: [...new Set(acts.map((a) => a.action))],
      };
    })
    .sort((a, b) => b.count - a.count);
}
