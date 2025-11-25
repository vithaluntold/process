import OpenAI from "openai";
import { db } from "@/lib/db";
import { aiInsights, discoveredModels, eventLogs } from "@/shared/schema";
import { eq } from "drizzle-orm";
import pRetry from "p-retry";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-build",
    });
  }
  return _openai;
}

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function generateProcessInsights(processId: number, modelData: any): Promise<any[]> {
  const insights: any[] = [];

  try {
    const prompt = `Analyze this business process model and provide actionable insights:

Process Model Data:
- Activities: ${JSON.stringify(modelData.activities)}
- Transitions: ${JSON.stringify(modelData.transitions)}
- Start Activities: ${JSON.stringify(modelData.startActivities)}
- End Activities: ${JSON.stringify(modelData.endActivities)}
- Trace Count: ${modelData.metadata?.traceCount || 0}
- Event Count: ${modelData.metadata?.eventCount || 0}

Please provide insights in the following categories:
1. **Bottlenecks**: Identify activities with high frequency or potential delays
2. **Optimization**: Suggest process improvements to reduce cycle time
3. **Automation**: Identify activities that could be automated
4. **Compliance**: Identify potential compliance or conformance issues
5. **Efficiency**: Suggest ways to streamline the process

Return your analysis as a JSON array with objects containing: type, category, title, description, recommendations (array), impact (high/medium/low), confidence (0-1).`;

    const response = await pRetry(
      async () => {
        try {
          return await getOpenAI().chat.completions.create({
            model: "gpt-4.1",
            messages: [
              {
                role: "system",
                content: "You are an expert business process analyst specializing in process mining and optimization. Provide detailed, actionable insights based on process data.",
              },
              { role: "user", content: prompt },
            ],
            max_completion_tokens: 2048,
            temperature: 0.7,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          const abortError: any = new Error('Non-retryable error');
          abortError.name = 'AbortError';
          abortError.originalError = error;
          throw abortError;
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    const content = response.choices[0]?.message?.content || "[]";
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          for (const insight of parsed) {
            insights.push({
              processId,
              type: insight.type || "insight",
              category: insight.category || "optimization",
              title: insight.title || "Process Insight",
              description: insight.description || "",
              recommendations: insight.recommendations || [],
              impact: insight.impact || "medium",
              confidence: insight.confidence || 0.7,
            });
          }
        }
      }
    } catch (parseError) {
      console.error("Error parsing AI insights:", parseError);
    }
  } catch (error) {
    console.error("Error generating process insights:", error);
  }

  return insights;
}

export async function saveInsights(insights: any[]): Promise<void> {
  for (const insight of insights) {
    await db.insert(aiInsights).values({
      processId: insight.processId,
      type: insight.type,
      category: insight.category,
      title: insight.title,
      description: insight.description,
      recommendations: insight.recommendations,
      impact: insight.impact,
      confidence: insight.confidence,
    });
  }
}

export async function getStoredInsights(processId: number): Promise<any[]> {
  return await db
    .select()
    .from(aiInsights)
    .where(eq(aiInsights.processId, processId));
}

export async function analyzeProcessForAutomation(processId: number): Promise<any[]> {
  const opportunities: any[] = [];

  try {
    const logs = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .limit(1000);

    if (logs.length === 0) {
      return opportunities;
    }

    const activityCounts: Record<string, { count: number }> = {};
    
    for (const log of logs) {
      const activityName = log.activity;
      if (!activityCounts[activityName]) {
        activityCounts[activityName] = { count: 0 };
      }
      activityCounts[activityName].count++;
    }

    const prompt = `Based on the following process activity data, identify automation opportunities:

Activity Statistics:
${Object.entries(activityCounts).map(([name, stats]) => 
  `- ${name}: ${stats.count} occurrences`
).join('\n')}

For each activity, assess:
1. Is it repetitive enough to warrant automation?
2. Is it rule-based and suitable for RPA?
3. What would be the potential time savings?
4. What automation technology would be most suitable?

Return a JSON array with objects containing: activity, automationPotential (0-1), technology (rpa/ai/workflow/none), timeSavingsPercent, complexity (low/medium/high), recommendation.`;

    const response = await pRetry(
      async () => {
        try {
          return await getOpenAI().chat.completions.create({
            model: "gpt-4.1",
            messages: [
              {
                role: "system",
                content: "You are an RPA and automation expert. Analyze process activities to identify automation opportunities.",
              },
              { role: "user", content: prompt },
            ],
            max_completion_tokens: 2048,
            temperature: 0.5,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          const abortError: any = new Error('Non-retryable error');
          abortError.name = 'AbortError';
          abortError.originalError = error;
          throw abortError;
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    const content = response.choices[0]?.message?.content || "[]";
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          opportunities.push(...parsed);
        }
      }
    } catch (parseError) {
      console.error("Error parsing automation opportunities:", parseError);
    }
  } catch (error) {
    console.error("Error analyzing process for automation:", error);
  }

  return opportunities;
}
