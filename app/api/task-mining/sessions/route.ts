import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { createTaskSession, getTaskSessions, updateTaskSession } from "@/server/task-mining-storage";
import { z } from "zod";

const createSessionSchema = z.object({
  sessionName: z.string().optional(),
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().transform(str => new Date(str)).optional(),
  duration: z.number().optional(),
  deviceType: z.string().optional(),
  osType: z.string().optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
  privacyConsent: z.boolean(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const sessions = await getTaskSessions(user.id, limit);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching task sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSessionSchema.parse(body);

    const session = await createTaskSession({
      userId: user.id,
      ...data,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error creating task session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const session = await updateTaskSession(id, updates, user.id);
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error updating task session:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
