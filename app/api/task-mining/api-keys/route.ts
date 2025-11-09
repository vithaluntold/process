import { NextRequest, NextResponse } from "next/server";
import { AgentApiKeysStorage } from "@/server/agent-api-keys-storage";
import { getCurrentUser } from "@/lib/server-auth";

const storage = new AgentApiKeysStorage();

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { label, expiresInDays } = body;

    const result = await storage.createApiKey({
      userId: user.id,
      label,
      expiresInDays,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const encryptionKey = await storage.getOrCreateEncryptionKey(user.id);

    return NextResponse.json({
      apiKey: result.key,
      encryptionKey,
      record: result.record,
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const keys = await storage.listApiKeys(user.id);

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "Missing key ID" },
        { status: 400 }
      );
    }

    const success = await storage.revokeApiKey(
      user.id,
      parseInt(keyId),
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      req.headers.get('user-agent') || undefined
    );

    if (!success) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
