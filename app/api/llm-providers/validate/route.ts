import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";

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

    // Validate API key format and attempt a test request
    let isValid = false;
    let errorMessage = "";

    try {
      switch (provider) {
        case "openai":
          isValid = await validateOpenAI(apiKey);
          break;
        case "mistral":
          isValid = await validateMistral(apiKey);
          break;
        case "deepseek":
          isValid = await validateDeepSeek(apiKey);
          break;
        case "groq":
          isValid = await validateGroq(apiKey);
          break;
        case "together":
          isValid = await validateTogether(apiKey);
          break;
        default:
          errorMessage = "Unsupported provider";
          break;
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

async function validateOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate OpenAI API key");
  }
}

async function validateMistral(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate Mistral API key");
  }
}

async function validateDeepSeek(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate DeepSeek API key");
  }
}

async function validateGroq(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate Groq API key");
  }
}

async function validateTogether(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    throw new Error("Failed to validate Together AI API key");
  }
}
