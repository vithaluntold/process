import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { llmProviders, llmProviderModels, llmProviderKeys } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptApiKey, maskApiKey } from "@/lib/llm-encryption";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active providers from database
    const dbProviders = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.isActive, true));

    // Fetch models for each provider
    const providerIds = dbProviders.map(p => p.id);
    const models = await db
      .select()
      .from(llmProviderModels)
      .where(and(
        eq(llmProviderModels.isActive, true),
        // Only get models for active providers
      ));

    // Fetch user's configured keys
    const userKeys = await db
      .select()
      .from(llmProviderKeys)
      .where(and(
        eq(llmProviderKeys.userId, user.id),
        eq(llmProviderKeys.status, "active")
      ));

    // Combine providers with their models and configuration status
    const providersWithStatus = dbProviders.map((provider) => {
      const providerModels = models
        .filter(m => m.providerId === provider.id)
        .map(m => m.modelId);
      
      const userKey = userKeys.find((k) => k.provider === provider.providerId);
      
      return {
        id: provider.providerId,
        name: provider.name,
        description: provider.description,
        models: providerModels,
        builtin: provider.isBuiltin,
        configured: provider.isBuiltin || !!userKey,
        configuredAt: userKey?.createdAt,
        label: userKey?.label,
        lastUsedAt: userKey?.lastUsedAt,
        authType: provider.authType,
        baseUrl: provider.baseUrl,
        compatibilityType: provider.compatibilityType,
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

    const { provider, apiKey, label, name, baseUrl, authType, models, compatibilityType } = await request.json();

    // If apiKey is provided, this is a key configuration request
    if (apiKey) {
      if (!provider) {
        return NextResponse.json(
          { error: "Provider is required" },
          { status: 400 }
        );
      }

      // Verify provider exists and is not builtin
      const providerRecord = await db
        .select()
        .from(llmProviders)
        .where(eq(llmProviders.providerId, provider))
        .limit(1);

      if (providerRecord.length === 0) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 }
        );
      }

      if (providerRecord[0].isBuiltin) {
        return NextResponse.json(
          { error: "Cannot configure API key for built-in providers" },
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
    }

    // If no apiKey but name and baseUrl, this is a new provider creation request
    if (name && baseUrl) {
      // Generate provider ID from name
      const providerId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Check if provider already exists
      const existing = await db
        .select()
        .from(llmProviders)
        .where(eq(llmProviders.providerId, providerId))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Provider with this name already exists" },
          { status: 400 }
        );
      }

      // Create new provider
      const [newProvider] = await db
        .insert(llmProviders)
        .values({
          name,
          providerId,
          baseUrl,
          authType: authType || 'bearer',
          compatibilityType: compatibilityType || 'openai_compatible',
          isBuiltin: false,
          isActive: true,
          createdBy: user.id,
        })
        .returning();

      // Add models if provided
      if (models && Array.isArray(models) && models.length > 0) {
        await db.insert(llmProviderModels).values(
          models.map((model: any) => ({
            providerId: newProvider.id,
            modelId: model.id || model.modelId || model,
            displayName: model.name || model.displayName || model.id || model.modelId || model,
            contextWindow: model.contextWindow || null,
          }))
        );
      }

      return NextResponse.json({
        success: true,
        provider: newProvider,
        message: "Provider created successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error saving LLM provider:", error);
    return NextResponse.json(
      { error: "Failed to save provider" },
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
