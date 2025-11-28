import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface TaskSessionInput {
  userId: number;
  sessionName?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  deviceType?: string;
  osType?: string;
  status?: string;
  privacyConsent: boolean;
}

export interface UserActivityInput {
  sessionId: number;
  activityType: string;
  application?: string;
  windowTitle?: string;
  action: string;
  targetElement?: string;
  inputData?: string;
  timestamp: Date;
  duration?: number;
  screenshot?: string;
  metadata?: any;
}

export interface ApplicationUsageInput {
  userId: number;
  sessionId?: number;
  applicationName: string;
  category?: string;
  timeSpent: number;
  interactions: number;
  productivityScore?: number;
  date: Date;
}

export interface TaskPatternInput {
  userId: number;
  patternName: string;
  description?: string;
  frequency: number;
  avgDuration?: number;
  steps?: any;
  automationPotential: number;
  timeSavingsEstimate?: number;
  lastOccurrence?: Date;
  status?: string;
}

export interface TaskAutomationInput {
  patternId?: number;
  userId: number;
  name: string;
  description?: string;
  automationType: string;
  script?: string;
  configuration?: any;
  estimatedSavings?: number;
  status?: string;
}

export async function createTaskSession(data: TaskSessionInput) {
  const [session] = await db.insert(schema.taskSessions).values(data).returning();
  return session;
}

export async function getTaskSessions(userId: number, limit = 50) {
  return await db.query.taskSessions.findMany({
    where: eq(schema.taskSessions.userId, userId),
    orderBy: [desc(schema.taskSessions.startTime)],
    limit,
    with: {
      activities: {
        limit: 10,
        orderBy: [desc(schema.userActivities.timestamp)],
      },
    },
  });
}

export async function getTaskSessionById(id: number, userId?: number) {
  const where = userId 
    ? and(eq(schema.taskSessions.id, id), eq(schema.taskSessions.userId, userId))
    : eq(schema.taskSessions.id, id);
    
  return await db.query.taskSessions.findFirst({
    where,
    with: {
      activities: {
        orderBy: [desc(schema.userActivities.timestamp)],
      },
      applicationUsage: true,
    },
  });
}

export async function updateTaskSession(id: number, data: Partial<TaskSessionInput>, userId?: number) {
  const where = userId
    ? and(eq(schema.taskSessions.id, id), eq(schema.taskSessions.userId, userId))
    : eq(schema.taskSessions.id, id);
    
  const [session] = await db.update(schema.taskSessions)
    .set(data)
    .where(where)
    .returning();
  return session;
}

export async function insertUserActivities(activities: UserActivityInput[]) {
  return await db.insert(schema.userActivities).values(activities).returning();
}

export async function getUserActivitiesBySession(sessionId: number, limit = 1000) {
  return await db.query.userActivities.findMany({
    where: eq(schema.userActivities.sessionId, sessionId),
    orderBy: [desc(schema.userActivities.timestamp)],
    limit,
  });
}

export async function insertApplicationUsage(usage: ApplicationUsageInput[]) {
  return await db.insert(schema.applicationUsage).values(usage).returning();
}

export async function getApplicationUsage(userId: number, startDate?: Date, endDate?: Date) {
  let where = eq(schema.applicationUsage.userId, userId);
  
  if (startDate && endDate) {
    where = and(
      eq(schema.applicationUsage.userId, userId),
      gte(schema.applicationUsage.date, startDate),
      lte(schema.applicationUsage.date, endDate)
    )!;
  }
  
  return await db.query.applicationUsage.findMany({
    where,
    orderBy: [desc(schema.applicationUsage.date)],
  });
}

export async function getTopApplications(userId: number, limit = 10) {
  return await db
    .select({
      applicationName: schema.applicationUsage.applicationName,
      category: schema.applicationUsage.category,
      totalTime: sql<number>`SUM(${schema.applicationUsage.timeSpent})`,
      totalInteractions: sql<number>`SUM(${schema.applicationUsage.interactions})`,
      avgProductivity: sql<number>`AVG(${schema.applicationUsage.productivityScore})`,
    })
    .from(schema.applicationUsage)
    .where(eq(schema.applicationUsage.userId, userId))
    .groupBy(schema.applicationUsage.applicationName, schema.applicationUsage.category)
    .orderBy(sql`SUM(${schema.applicationUsage.timeSpent}) DESC`)
    .limit(limit);
}

export async function createTaskPattern(data: TaskPatternInput) {
  const [pattern] = await db.insert(schema.taskPatterns).values({
    ...data,
    steps: data.steps || [],
  }).returning();
  return pattern;
}

export async function getTaskPatterns(userId: number) {
  return await db.query.taskPatterns.findMany({
    where: eq(schema.taskPatterns.userId, userId),
    orderBy: [desc(schema.taskPatterns.frequency)],
    with: {
      automations: true,
    },
  });
}

export async function getTaskPatternById(id: number, userId?: number) {
  const where = userId 
    ? and(eq(schema.taskPatterns.id, id), eq(schema.taskPatterns.userId, userId))
    : eq(schema.taskPatterns.id, id);
    
  return await db.query.taskPatterns.findFirst({
    where,
    with: {
      automations: true,
    },
  });
}

export async function updateTaskPattern(id: number, data: Partial<TaskPatternInput>, userId?: number) {
  const where = userId
    ? and(eq(schema.taskPatterns.id, id), eq(schema.taskPatterns.userId, userId))
    : eq(schema.taskPatterns.id, id);
    
  const [pattern] = await db.update(schema.taskPatterns)
    .set({ ...data, updatedAt: new Date() })
    .where(where)
    .returning();
  return pattern;
}

export async function createTaskAutomation(data: TaskAutomationInput) {
  const [automation] = await db.insert(schema.taskAutomations).values(data).returning();
  return automation;
}

export async function getTaskAutomations(userId: number) {
  return await db.query.taskAutomations.findMany({
    where: eq(schema.taskAutomations.userId, userId),
    orderBy: [desc(schema.taskAutomations.createdAt)],
    with: {
      pattern: true,
    },
  });
}

export async function getTaskAutomationById(id: number, userId?: number) {
  const where = userId 
    ? and(eq(schema.taskAutomations.id, id), eq(schema.taskAutomations.userId, userId))
    : eq(schema.taskAutomations.id, id);
    
  return await db.query.taskAutomations.findFirst({
    where,
    with: {
      pattern: true,
    },
  });
}

export async function updateTaskAutomation(id: number, data: Partial<TaskAutomationInput>, userId?: number) {
  const where = userId
    ? and(eq(schema.taskAutomations.id, id), eq(schema.taskAutomations.userId, userId))
    : eq(schema.taskAutomations.id, id);
    
  const [automation] = await db.update(schema.taskAutomations)
    .set({ ...data, updatedAt: new Date() })
    .where(where)
    .returning();
  return automation;
}

export async function getTaskMiningStats(userId: number) {
  const activeSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.taskSessions)
    .where(and(
      eq(schema.taskSessions.userId, userId),
      eq(schema.taskSessions.status, 'active')
    ));
    
  const totalActivities = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userActivities)
    .innerJoin(schema.taskSessions, eq(schema.userActivities.sessionId, schema.taskSessions.id))
    .where(eq(schema.taskSessions.userId, userId));
    
  const totalPatterns = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.taskPatterns)
    .where(eq(schema.taskPatterns.userId, userId));
    
  const automationSavings = await db
    .select({ total: sql<number>`SUM(${schema.taskAutomations.estimatedSavings})` })
    .from(schema.taskAutomations)
    .where(eq(schema.taskAutomations.userId, userId));
  
  return {
    activeSessions: activeSessions[0]?.count || 0,
    totalActivities: totalActivities[0]?.count || 0,
    totalPatterns: totalPatterns[0]?.count || 0,
    estimatedSavings: automationSavings[0]?.total || 0,
  };
}
