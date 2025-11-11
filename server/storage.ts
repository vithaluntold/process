import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface ProcessInput {
  userId?: number;
  name: string;
  description?: string;
  source: string;
  status?: string;
}

export interface EventLogInput {
  processId: number;
  caseId: string;
  activity: string;
  timestamp: Date;
  resource?: string;
  metadata?: any;
}

export interface PerformanceMetricInput {
  processId: number;
  period: string;
  cycleTime?: number;
  throughput?: number;
  reworkRate?: number;
  conformanceRate?: number;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return user;
}

export async function createUser(data: schema.InsertUser) {
  const [user] = await db.insert(schema.users).values(data).returning();
  return user;
}

export async function createProcess(data: ProcessInput) {
  const [process] = await db.insert(schema.processes).values(data).returning();
  return process;
}

export async function getProcesses(userId?: number, options?: { limit?: number; offset?: number }) {
  const { limit = 50, offset = 0 } = options || {};
  
  if (userId) {
    return await db.query.processes.findMany({
      where: eq(schema.processes.userId, userId),
      orderBy: [desc(schema.processes.createdAt)],
      limit,
      offset,
    });
  }
  return await db.query.processes.findMany({
    orderBy: [desc(schema.processes.createdAt)],
    limit,
    offset,
  });
}

export async function getProcessCount(userId?: number): Promise<number> {
  const where = userId ? eq(schema.processes.userId, userId) : undefined;
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.processes)
    .where(where);
  return result[0]?.count || 0;
}

export async function getProcessById(id: number, userId?: number) {
  const where = userId 
    ? and(eq(schema.processes.id, id), eq(schema.processes.userId, userId))
    : eq(schema.processes.id, id);
    
  return await db.query.processes.findFirst({
    where,
    with: {
      eventLogs: true,
      processModels: true,
      activities: true,
      performanceMetrics: true,
      deviations: true,
      automationOpportunities: true,
    },
  });
}

export async function getProcessesByUser(userId: number, options?: { limit?: number; offset?: number }) {
  return await getProcesses(userId, options);
}

export async function updateProcess(id: number, data: Partial<ProcessInput>, userId?: number) {
  const where = userId
    ? and(eq(schema.processes.id, id), eq(schema.processes.userId, userId))
    : eq(schema.processes.id, id);
    
  const [process] = await db.update(schema.processes)
    .set({ ...data, updatedAt: new Date() })
    .where(where)
    .returning();
  return process;
}

export async function deleteProcess(id: number, userId?: number) {
  const where = userId
    ? and(eq(schema.processes.id, id), eq(schema.processes.userId, userId))
    : eq(schema.processes.id, id);
    
  const result = await db.delete(schema.processes)
    .where(where)
    .returning();
  return result.length > 0;
}

export async function insertEventLogs(events: EventLogInput[]) {
  return await db.insert(schema.eventLogs).values(events).returning();
}

export async function getEventLogsByProcess(processId: number) {
  return await db.query.eventLogs.findMany({
    where: eq(schema.eventLogs.processId, processId),
    orderBy: [desc(schema.eventLogs.timestamp)],
  });
}

export async function createPerformanceMetrics(data: PerformanceMetricInput[]) {
  if (data.length === 0) return [];
  
  const processId = data[0].processId;
  await db.delete(schema.performanceMetrics)
    .where(eq(schema.performanceMetrics.processId, processId));
  
  return await db.insert(schema.performanceMetrics).values(data).returning();
}

export async function getPerformanceMetrics(processId: number, limit = 12) {
  return await db.query.performanceMetrics.findMany({
    where: eq(schema.performanceMetrics.processId, processId),
    orderBy: [desc(schema.performanceMetrics.timestamp)],
    limit,
  });
}

export async function createActivities(processId: number, activities: Array<{
  name: string;
  frequency: number;
  avgDuration?: number;
  automationPotential?: number;
}>) {
  await db.delete(schema.activities).where(eq(schema.activities.processId, processId));
  
  if (activities.length === 0) return [];
  
  return await db.insert(schema.activities).values(
    activities.map(a => ({ ...a, processId }))
  ).returning();
}

export async function getActivities(processId: number) {
  return await db.query.activities.findMany({
    where: eq(schema.activities.processId, processId),
  });
}

export async function createDeviations(processId: number, deviations: Array<{
  name: string;
  description?: string;
  frequency: number;
  impact: string;
}>) {
  await db.delete(schema.deviations).where(eq(schema.deviations.processId, processId));
  
  if (deviations.length === 0) return [];
  
  return await db.insert(schema.deviations).values(
    deviations.map(d => ({ ...d, processId }))
  ).returning();
}

export async function getDeviations(processId: number) {
  return await db.query.deviations.findMany({
    where: eq(schema.deviations.processId, processId),
  });
}

export async function createAutomationOpportunities(processId: number, opportunities: Array<{
  taskName: string;
  frequency: number;
  duration: number;
  automationPotential: number;
  savingsEstimate?: number;
  recommendedSolution?: string;
}>) {
  await db.delete(schema.automationOpportunities).where(eq(schema.automationOpportunities.processId, processId));
  
  if (opportunities.length === 0) return [];
  
  return await db.insert(schema.automationOpportunities).values(
    opportunities.map(o => ({ ...o, processId }))
  ).returning();
}

export async function getAutomationOpportunities(processId: number) {
  return await db.query.automationOpportunities.findMany({
    where: eq(schema.automationOpportunities.processId, processId),
  });
}

export async function createDocument(data: {
  userId?: number;
  name: string;
  size: string;
  path: string;
  status?: string;
}) {
  const [document] = await db.insert(schema.documents).values(data).returning();
  return document;
}

export async function getDocuments(userId?: number) {
  if (userId) {
    return await db.query.documents.findMany({
      where: eq(schema.documents.userId, userId),
      orderBy: [desc(schema.documents.uploadDate)],
    });
  }
  return await db.query.documents.findMany({
    orderBy: [desc(schema.documents.uploadDate)],
  });
}

export async function updateDocument(id: number, data: Partial<{
  status: string;
  extractedProcesses: number;
  activities: number;
}>) {
  const [document] = await db.update(schema.documents)
    .set(data)
    .where(eq(schema.documents.id, id))
    .returning();
  return document;
}
