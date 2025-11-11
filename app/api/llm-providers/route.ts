import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { llmProviderKeys } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptApiKey, maskApiKey } from "@/lib/llm-encryption";

const SUPPORTED_PROVIDERS = [
  { id: "replit", name: "Replit AI (Free)", models: ["gpt-4o", "gpt-4o-mini"], builtin: true, compatible: true },
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"], compatible: true },
  { id: "mistral", name: "Mistral AI", models: ["mistral-large-latest", "mistral-medium-latest"], compatible: true },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"], compatible: true },
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userKeys = await db
      .select()
      .from(llmProviderKeys)
      .where(and(
        eq(llmProviderKeys.userId, user.id),
        eq(llmProviderKeys.status, "active")
      ));

    const providersWithStatus = SUPPORTED_PROVIDERS.map((provider) => {
      const userKey = userKeys.find((k) => k.provider === provider.id);
      return {
        ...provider,
        configured: provider.builtin || !!userKey,
        configuredAt: userKey?.createdAt,
        label: userKey?.label,
        lastUsedAt: userKey?.lastUsedAt,
      };
    });

    return NextResponse.json({
      providers: providersWithStatus,
    });
  } catch (error) {
    console.error("Error fetching LLM providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey, label } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    const validProviderIds = SUPPORTED_PROVIDERS.filter(p => !p.builtin).map(p => p.id);
    if (!validProviderIds.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const existingKey = await db
      .select()
      .from(llmProviderKeys)
      .where(and(
        eq(llmProviderKeys.userId, user.id),
        eq(llmProviderKeys.provider, provider)
      ))
      .limit(1);

    const encryptedKey = encryptApiKey(apiKey);

    if (existingKey.length > 0) {
      await db
        .update(llmProviderKeys)
        .set({
          encryptedApiKey: encryptedKey,
          label: label || null,
          updatedAt: new Date(),
        })
        .where(eq(llmProviderKeys.id, existingKey[0].id));

      return NextResponse.json({
        success: true,
        provider,
        message: "API key updated successfully",
      });
    } else {
      await db.insert(llmProviderKeys).values({
        userId: user.id,
        provider,
        encryptedApiKey: encryptedKey,
        label: label || null,
        status: "active",
      });

      return NextResponse.json({
        success: true,
        provider,
        message: "API key added successfully",
      });
    }
  } catch (error) {
    console.error("Error saving LLM provider key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    await db
      .delete(llmProviderKeys)
      .where(and(
        eq(llmProviderKeys.userId, user.id),
        eq(llmProviderKeys.provider, provider)
      ));

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting LLM provider key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
