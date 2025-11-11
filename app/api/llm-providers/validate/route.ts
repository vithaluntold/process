import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { llmProviders } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required", valid: false },
        { status: 400 }
      );
    }

    // Fetch provider from database
    const [providerRecord] = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.providerId, provider))
      .limit(1);

    if (!providerRecord) {
      return NextResponse.json(
        { error: "Provider not found", valid: false },
        { status: 404 }
      );
    }

    // Validate API key format and attempt a test request
    let isValid = false;
    let errorMessage = "";

    try {
      // Use compatibility type to determine validation method
      if (providerRecord.compatibilityType === "openai_compatible") {
        isValid = await validateOpenAICompatible(apiKey, providerRecord.baseUrl, providerRecord.validationEndpoint);
      } else {
        // For custom types, try generic validation
        isValid = await validateGeneric(apiKey, providerRecord.baseUrl, providerRecord.authType);
      }
    } catch (error: any) {
      errorMessage = error.message || "Validation failed";
      isValid = false;
    }

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: "API key verified successfully",
      });
    } else {
      return NextResponse.json(
        {
          valid: false,
          message: errorMessage || "Invalid API key. Please check and try again.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate API key", valid: false },
      { status: 500 }
    );
  }
}

async function validateOpenAICompatible(apiKey: string, baseUrl: string, validationEndpoint?: string | null): Promise<boolean> {
  try {
    // Try the custom validation endpoint first, or fall back to /models
    const endpoint = validationEndpoint || `${baseUrl}/models`;
    
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate API key with provider");
  }
}

async function validateGeneric(apiKey: string, baseUrl: string, authType: string): Promise<boolean> {
  try {
    // Try a generic health check
    const headers: Record<string, string> = {};
    
    if (authType === "bearer") {
      headers.Authorization = `Bearer ${apiKey}`;
    } else if (authType === "api_key_header") {
      headers["X-API-Key"] = apiKey;
    }
    
    const response = await fetch(`${baseUrl}/models`, { headers });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate API key");
  }
}

