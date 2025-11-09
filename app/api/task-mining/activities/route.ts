import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { insertUserActivities, getUserActivitiesBySession, getTaskSessionById, createTaskSession, updateTaskSession } from "@/server/task-mining-storage";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, taskSessions } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

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
  const apiKey = request.headers.get("x-api-key");
  const user = apiKey ? await getUserFromApiKey(apiKey) : await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (body.activities && body.sessionId && typeof body.sessionId === "string") {
      return await handleDesktopAgentActivities(body, user.id);
    }
    
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

async function getUserFromApiKey(apiKey: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, apiKey)).limit(1);
    return user || null;
  } catch (error) {
    return null;
  }
}

async function handleDesktopAgentActivities(body: any, userId: number) {
  const { activities, sessionId: clientSessionId } = body;

  if (!Array.isArray(activities) || activities.length === 0) {
    return NextResponse.json({ error: "Activities array required" }, { status: 400 });
  }

  const [existingSession] = await db.select().from(taskSessions).where(
    and(
      eq(taskSessions.userId, userId),
      eq(taskSessions.sessionName, clientSessionId)
    )
  ).limit(1);

  let session = existingSession;

  if (!session) {
    session = await createTaskSession({
      userId,
      sessionName: clientSessionId,
      startTime: new Date(),
      endTime: new Date(),
      privacyConsent: true,
      status: "active",
    });
  }

  const activityRecords = [];

  for (const activity of activities) {
    const data = activity.data?.encrypted ? activity.data : activity.data;

    if (activity.type === "keyboard" || activity.type === "mouse") {
      activityRecords.push({
        sessionId: session.id,
        activityType: activity.type,
        application: data?.application || "Unknown",
        windowTitle: data?.windowTitle || "",
        action: activity.type === "keyboard" ? "type" : "click",
        targetElement: "",
        duration: data?.duration || 0,
        timestamp: new Date(activity.timestamp),
        metadata: data,
      });
    } else if (activity.type === "application") {
      activityRecords.push({
        sessionId: session.id,
        activityType: "app_switch",
        application: data?.owner || data?.title || "Unknown",
        windowTitle: data?.title || "",
        action: "focus",
        targetElement: data?.path || "",
        duration: 0,
        timestamp: new Date(activity.timestamp),
        metadata: data,
      });
    } else if (activity.type === "screenshot") {
      activityRecords.push({
        sessionId: session.id,
        activityType: "screenshot",
        application: "System",
        windowTitle: "",
        action: "capture",
        targetElement: "",
        duration: 0,
        timestamp: new Date(activity.timestamp),
        metadata: { size: data?.size, format: data?.format },
      });
    }
  }

  if (activityRecords.length > 0) {
    await insertUserActivities(activityRecords);
    
    await updateTaskSession(session.id, {
      endTime: new Date(),
    });
  }

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    activitiesProcessed: activities.length,
  });
}
