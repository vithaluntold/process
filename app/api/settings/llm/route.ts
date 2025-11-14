import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import {
  getUserLLMProvider,
  setUserLLMProvider,
  getAvailableProviders,
  type LLMProvider,
} from "@/lib/llm-config";
import { withApiGuards } from "@/lib/api-guards";
import { LLM_PROVIDER_LIMIT } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentProvider = await getUserLLMProvider(user.id);
    const availableProviders = await getAvailableProviders(user.id);

    return NextResponse.json({
      currentProvider,
      availableProviders,
    });
  } catch (error) {
    console.error("Error fetching LLM settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch LLM settings" },
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

    const guardError = withApiGuards(request, 'llm-settings', LLM_PROVIDER_LIMIT, user.id);
    if (guardError) return guardError;

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const validProviders: LLMProvider[] = [
      "replit",
      "openai",
      "mistral",
      "deepseek",
    ];

    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    await setUserLLMProvider(user.id, provider);

    return NextResponse.json({
      success: true,
      provider,
    });
  } catch (error) {
    console.error("Error updating LLM settings:", error);
    return NextResponse.json(
      { error: "Failed to update LLM settings" },
      { status: 500 }
    );
  }
}
