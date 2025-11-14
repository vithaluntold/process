import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { insertUserActivities, getUserActivitiesBySession, getTaskSessionById, createTaskSession, updateTaskSession } from "@/server/task-mining-storage";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, taskSessions } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { requireCSRF } from "@/lib/csrf";
import { checkRateLimit, API_WRITE_LIMIT } from "@/lib/rate-limiter";

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

  if (!apiKey) {
    const csrfError = requireCSRF(request);
    if (csrfError) return csrfError;
  }

  const rateLimitResult = checkRateLimit(`task-mining-activities:${user.id}`, API_WRITE_LIMIT);
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": API_WRITE_LIMIT.maxAttempts.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        }
      }
    );
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
    const { AgentApiKeysStorage } = await import("@/server/agent-api-keys-storage");
    const storage = new AgentApiKeysStorage();
    const result = await storage.validateApiKey(apiKey);
    
    if (!result.valid || !result.userId) {
      return null;
    }

    const [user] = await db.select().from(users).where(eq(users.id, result.userId)).limit(1);
    return user || null;
  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

async function handleDesktopAgentActivities(body: any, userId: number) {
  const { activities, sessionId: clientSessionId } = body;

  if (!Array.isArray(activities) || activities.length === 0) {
    return NextResponse.json({ error: "Activities array required" }, { status: 400 });
  }

  let encryptionKey: string | null = null;
  let CryptoUtils: any = null;

  try {
    const { AgentApiKeysStorage } = await import("@/server/agent-api-keys-storage");
    const { CryptoUtils: CU } = await import("@/server/crypto-utils");
    CryptoUtils = CU;
    const storage = new AgentApiKeysStorage();
    encryptionKey = await storage.getEncryptionKey(userId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('MASTER_ENCRYPTION_KEY')) {
      console.warn('MASTER_ENCRYPTION_KEY not set - encryption/decryption disabled');
      encryptionKey = null;
    } else {
      console.error('Error getting encryption key:', error);
      encryptionKey = null;
    }
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
    let data = activity.data;
    
    if (encryptionKey && data && typeof data === 'object') {
      if ('encrypted' in data && 'iv' in data && 'authTag' in data) {
        try {
          data = CryptoUtils.decryptPayload(data, encryptionKey);
        } catch (error) {
          console.error("Failed to decrypt activity data:", error);
        }
      }
    }

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
