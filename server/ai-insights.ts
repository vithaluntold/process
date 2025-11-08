import OpenAI from "openai";
import { db } from "@/lib/db";
import { aiInsights, discoveredModels, eventLogs } from "@/shared/schema";
import { eq } from "drizzle-orm";
import pRetry from "p-retry";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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
          return await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
              {
                role: "system",
                content: "You are an expert business process analyst specializing in process mining and optimization. Provide detailed, actionable insights based on process data.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    const content = response.choices[0]?.message?.content || "{}";
    const parsedInsights = JSON.parse(content);

    const insightsArray = parsedInsights.insights || [];
    
    for (const insight of insightsArray) {
      const [insertedInsight] = await db
        .insert(aiInsights)
        .values({
          processId,
          type: insight.type || "optimization",
          category: insight.category || "general",
          title: insight.title,
          description: insight.description,
          recommendations: insight.recommendations || [],
          impact: insight.impact || "medium",
          confidence: insight.confidence || 0.7,
          metadata: { source: "gpt-4.1", timestamp: new Date().toISOString() },
        })
        .returning();
      
      insights.push(insertedInsight);
    }
  } catch (error) {
    console.error("Error generating AI insights:", error);
  }

  return insights;
}

export async function generateOptimizationSuggestions(processId: number, performanceMetrics: any): Promise<string[]> {
  try {
    const prompt = `Based on these process performance metrics, provide specific optimization suggestions:

Metrics:
- Cycle Time: ${performanceMetrics.cycleTime || 0} hours
- Throughput: ${performanceMetrics.throughput || 0} cases/day
- Rework Rate: ${(performanceMetrics.reworkRate || 0) * 100}%
- Conformance Rate: ${(performanceMetrics.conformanceRate || 0) * 100}%

Provide 3-5 specific, actionable suggestions to improve these metrics. Return as a JSON object with a "suggestions" array of strings.`;

    const response = await pRetry(
      async () => {
        try {
          return await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: "You are a business process optimization expert. Provide specific, measurable, achievable recommendations.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    const content = response.choices[0]?.message?.content || '{"suggestions":[]}';
    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error generating optimization suggestions:", error);
    return [];
  }
}

export async function detectAnomalies(processId: number, eventData: any[]): Promise<any[]> {
  try {
    const activitySequences = eventData.map(e => e.activity).join(" → ");
    
    const prompt = `Analyze this process execution sequence for anomalies and unusual patterns:

Activity Sequence:
${activitySequences.substring(0, 2000)}... (truncated)

Total Events: ${eventData.length}

Identify:
1. Unusual activity sequences or loops
2. Unexpected transitions
3. Missing activities
4. Duration anomalies

Return as JSON with an "anomalies" array containing objects with: type, description, severity (high/medium/low), affectedActivities.`;

    const response = await pRetry(
      async () => {
        try {
          return await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: "You are an expert in process anomaly detection. Identify deviations from normal process behavior.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 8192,
          });
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 7,
        minTimeout: 2000,
        maxTimeout: 128000,
        factor: 2,
      }
    );

    const content = response.choices[0]?.message?.content || '{"anomalies":[]}';
    const parsed = JSON.parse(content);
    return parsed.anomalies || [];
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return [];
  }
}
