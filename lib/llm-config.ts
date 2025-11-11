import OpenAI from "openai";
import { db } from "@/lib/db";
import { userLlmSettings, llmProviderKeys } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { decryptApiKey } from "./llm-encryption";

export type LLMProvider = 
  | "replit"
  | "openai"
  | "mistral"
  | "deepseek";

export { LLM_PROVIDERS };

interface LLMProviderConfig {
  apiKey: string;
  baseURL: string;
  header: string;
  prefix: string;
  available: boolean;
  name: string;
  models: string[];
  openaiCompatible: boolean;
}

const LLM_PROVIDERS: Record<LLMProvider, Omit<LLMProviderConfig, 'apiKey' | 'available'>> = {
  replit: {
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://integrations.replit.com/v1/openai",
    header: "Authorization",
    prefix: "Bearer",
    name: "Replit AI (Free)",
    models: ["gpt-4o", "gpt-4o-mini"],
    openaiCompatible: true,
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    openaiCompatible: true,
  },
  mistral: {
    baseURL: "https://api.mistral.ai/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "Mistral AI (OpenAI-compatible)",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
    openaiCompatible: true,
  },
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "DeepSeek (OpenAI-compatible)",
    models: ["deepseek-chat", "deepseek-coder"],
    openaiCompatible: true,
  },
};

async function getUserApiKey(userId: number, provider: LLMProvider): Promise<string | null> {
  if (provider === "replit") {
    const replitKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!replitKey) {
      throw new Error("Replit AI integration is not configured. Please set up the OpenAI integration in Replit.");
    }
    return replitKey;
  }

  const key = await db
    .select()
    .from(llmProviderKeys)
    .where(and(
      eq(llmProviderKeys.userId, userId),
      eq(llmProviderKeys.provider, provider),
      eq(llmProviderKeys.status, "active")
    ))
    .limit(1);

  if (key.length === 0) {
    return null;
  }

  try {
    return decryptApiKey(key[0].encryptedApiKey);
  } catch (error) {
    console.error(`Error decrypting API key for ${provider}:`, error);
    return null;
  }
}

export async function getAvailableProviders(userId: number): Promise<Array<{ id: LLMProvider; name: string; available: boolean }>> {
  const userKeys = await db
    .select()
    .from(llmProviderKeys)
    .where(and(
      eq(llmProviderKeys.userId, userId),
      eq(llmProviderKeys.status, "active")
    ));

  return (Object.keys(LLM_PROVIDERS) as LLMProvider[]).map((provider) => ({
    id: provider,
    name: LLM_PROVIDERS[provider].name,
    available: provider === "replit" || userKeys.some(k => k.provider === provider),
  }));
}

export async function getProviderConfig(userId: number, provider: LLMProvider): Promise<LLMProviderConfig> {
  const config = LLM_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }

  const apiKey = await getUserApiKey(userId, provider);
  
  if (!apiKey) {
    throw new Error(
      `API key for ${provider} is not configured. Please add it in the API Integrations page.`
    );
  }

  return {
    ...config,
    apiKey,
    available: true,
  };
}

export async function createOpenAIClient(userId: number, provider: LLMProvider = "replit"): Promise<OpenAI> {
  const config = await getProviderConfig(userId, provider);

  return new OpenAI({
    apiKey: config.apiKey || "dummy-key",
    baseURL: config.baseURL,
  });
}

export async function getUserLLMProvider(userId: number): Promise<LLMProvider> {
  const settings = await db
    .select()
    .from(userLlmSettings)
    .where(eq(userLlmSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    return "replit";
  }

  return settings[0].defaultProvider as LLMProvider;
}

export async function setUserLLMProvider(userId: number, provider: LLMProvider): Promise<void> {
  const existing = await db
    .select()
    .from(userLlmSettings)
    .where(eq(userLlmSettings.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userLlmSettings).values({
      userId,
      defaultProvider: provider,
    });
  } else {
    await db
      .update(userLlmSettings)
      .set({
        defaultProvider: provider,
        updatedAt: new Date(),
      })
      .where(eq(userLlmSettings.userId, userId));
  }
}

export function getDefaultModelForProvider(provider: LLMProvider): string {
  return LLM_PROVIDERS[provider].models[0];
}
