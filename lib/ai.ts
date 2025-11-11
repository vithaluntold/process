import OpenAI from "openai";
import pRetry from "p-retry";
import { getUserLLMProvider, createOpenAIClient, getDefaultModelForProvider } from "./llm-config";

const defaultOpenai = new OpenAI({
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

export async function generateAIResponse(
  prompt: string,
  userId?: number
): Promise<string> {
  try {
    let openai = defaultOpenai;
    let model = "gpt-4o";

    if (userId) {
      const provider = await getUserLLMProvider(userId);
      openai = await createOpenAIClient(userId, provider);
      model = getDefaultModelForProvider(provider);
    }

    const response = await pRetry(
      async () => {
        try {
          return await openai.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content: "You are an expert process mining AI assistant specializing in business process analysis, optimization, and automation. Provide clear, actionable insights based on process data.",
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

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}
