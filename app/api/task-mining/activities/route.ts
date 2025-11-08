import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { insertUserActivities, getUserActivitiesBySession, getTaskSessionById } from "@/server/task-mining-storage";
import { z } from "zod";

const activitySchema = z.object({
  activityType: z.string(),
  application: z.string().optional(),
  windowTitle: z.string().optional(),
  action: z.string(),
  targetElement: z.string().optional(),
  inputData: z.string().optional(),
  timestamp: z.string().transform(str => new Date(str)),
  duration: z.number().optional(),
  screenshot: z.string().optional(),
  metadata: z.any().optional(),
});

const batchActivitySchema = z.object({
  sessionId: z.number(),
  activities: z.array(activitySchema),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = parseInt(searchParams.get("sessionId") || "0");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    const session = await getTaskSessionById(sessionId, user.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const activities = await getUserActivitiesBySession(sessionId);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sessionId, activities } = batchActivitySchema.parse(body);

    const session = await getTaskSessionById(sessionId, user.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const activitiesWithSession = activities.map(activity => ({
      sessionId,
      ...activity,
    }));

    const created = await insertUserActivities(activitiesWithSession);

    return NextResponse.json({ 
      activities: created,
      count: created.length 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error creating activities:", error);
    return NextResponse.json({ error: "Failed to create activities" }, { status: 500 });
  }
}
