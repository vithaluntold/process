import OpenAI from "openai";
import { db } from "@/lib/db";
import { userLlmSettings } from "@/shared/schema";
import { eq } from "drizzle-orm";

export type LLMProvider = 
  | "replit"
  | "openai"
  | "anthropic"
  | "google"
  | "gemini"
  | "mistral"
  | "deepseek";

interface LLMProviderConfig {
  apiKey: string;
  baseURL: string;
  header: string;
  prefix: string;
  available: boolean;
  name: string;
  models: string[];
}

const LLM_PROVIDERS: Record<LLMProvider, Omit<LLMProviderConfig, 'apiKey' | 'available'>> = {
  replit: {
    baseURL: "https://integrations.replit.com/v1/openai",
    header: "Authorization",
    prefix: "Bearer",
    name: "Replit AI (Free)",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    header: "x-api-key",
    prefix: "",
    name: "Anthropic Claude",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  },
  google: {
    baseURL: "https://generativelanguage.googleapis.com/v1",
    header: "x-goog-api-key",
    prefix: "",
    name: "Google Gemini",
    models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1",
    header: "x-goog-api-key",
    prefix: "",
    name: "Google Gemini Pro",
    models: ["gemini-pro", "gemini-1.5-pro"],
  },
  mistral: {
    baseURL: "https://api.mistral.ai/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "Mistral AI",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
  },
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    header: "Authorization",
    prefix: "Bearer",
    name: "DeepSeek",
    models: ["deepseek-chat", "deepseek-coder"],
  },
};

function getEnvironmentKey(provider: LLMProvider): string | undefined {
  const envKeyMap: Record<LLMProvider, string> = {
    replit: "REPLIT_AI_KEY",
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GOOGLE_AI_API_KEY",
    gemini: "GEMINI_API_KEY",
    mistral: "MISTRAL_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
  };

  return process.env[envKeyMap[provider]];
}

export function getAvailableProviders(): Array<{ id: LLMProvider; name: string; available: boolean }> {
  return (Object.keys(LLM_PROVIDERS) as LLMProvider[]).map((provider) => ({
    id: provider,
    name: LLM_PROVIDERS[provider].name,
    available: provider === "replit" || !!getEnvironmentKey(provider),
  }));
}

export function getProviderConfig(provider: LLMProvider): LLMProviderConfig {
  const config = LLM_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }

  const apiKey = provider === "replit" 
    ? "dummy-key"
    : getEnvironmentKey(provider) || "";

  const available = provider === "replit" || !!apiKey;

  if (!available) {
    throw new Error(
      `API key for ${provider} is not configured. Please add the ${getEnvironmentKey(provider)} environment variable.`
    );
  }

  return {
    ...config,
    apiKey,
    available,
  };
}

export function createOpenAIClient(provider: LLMProvider = "replit"): OpenAI {
  const config = getProviderConfig(provider);

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
