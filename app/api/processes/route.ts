import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
import { getCurrentUser } from "@/lib/server-auth";
import { processSchema, sanitizeInput } from "@/lib/validation";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processes = await storage.getProcessesByUser(user.id);
    
    return NextResponse.json({ processes }, {
      headers: {
        'Cache-Control': 'private, max-age=30',
      },
    });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
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

    const body = await request.json();
    
    const validation = processSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, source } = validation.data;

    const process = await storage.createProcess({
      userId: user.id,
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      source: sanitizeInput(source),
      status: "active",
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
}
