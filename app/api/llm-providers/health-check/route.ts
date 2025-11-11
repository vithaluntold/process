import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { createOpenAIClient, getAvailableProviders, LLMProvider, getDefaultModelForProvider } from "@/lib/llm-config";

interface HealthCheckResult {
  provider: string;
  status: "success" | "error";
  message: string;
  responseTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const result = await testProviderConnection(user.id, provider as LLMProvider);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in health check:", error);
    return NextResponse.json(
      { error: "Failed to perform health check" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availableProviders = await getAvailableProviders(user.id);
    const configuredProviders = availableProviders.filter(p => p.available);

    const results: HealthCheckResult[] = [];

    for (const provider of configuredProviders) {
      const result = await testProviderConnection(user.id, provider.id);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in health check:", error);
    return NextResponse.json(
      { error: "Failed to perform health check" },
      { status: 500 }
    );
  }
}

async function testProviderConnection(
  userId: number,
  provider: LLMProvider
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const client = await createOpenAIClient(userId, provider);
    const model = getDefaultModelForProvider(provider);

    const completion = await Promise.race([
      client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: "Test",
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      ),
    ]);

    const responseTime = Date.now() - startTime;

    return {
      provider,
      status: "success",
      message: `Connection successful. Model: ${model}`,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    let errorMessage = "Unknown error occurred";
    
    if (error.message?.includes("timeout")) {
      errorMessage = "Request timeout - provider may be slow or unreachable";
    } else if (error.message?.includes("API key")) {
      errorMessage = "Invalid or missing API key";
    } else if (error.status === 401 || error.message?.includes("401")) {
      errorMessage = "Authentication failed - invalid API key";
    } else if (error.status === 403 || error.message?.includes("403")) {
      errorMessage = "Access forbidden - check API key permissions";
    } else if (error.status === 404 || error.message?.includes("404")) {
      errorMessage = "Model not found - provider may not support this model";
    } else if (error.status === 429 || error.message?.includes("429")) {
      errorMessage = "Rate limit exceeded - too many requests";
    } else if (error.status === 500 || error.status === 502 || error.status === 503) {
      errorMessage = "Provider service error - try again later";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      provider,
      status: "error",
      message: errorMessage,
      responseTime,
    };
  }
}
