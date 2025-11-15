/**
 * Tenant-Safe Storage Layer
 * 
 * CRITICAL SECURITY: All database queries in this file automatically filter by
 * organizationId to prevent cross-tenant data leakage.
 * 
 * DO NOT use server/storage.ts functions in API routes - use these instead!
 */

import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq, desc, and, sql, gt, lt } from "drizzle-orm";
import { requireTenantContext, validateTenantAccess } from "@/lib/tenant-context";

/**
 * Get all processes for the current tenant
 * Automatically filters by organizationId from context
 */
export async function getProcessesByTenant(options?: { 
  limit?: number; 
  offset?: number;
  teamId?: number;
}) {
  const { organizationId } = requireTenantContext();
  const { limit = 50, offset = 0, teamId } = options || {};
  
  const conditions = [eq(schema.processes.organizationId, organizationId)];
  
  if (teamId) {
    conditions.push(eq(schema.processes.teamId, teamId));
  }
  
  return await db.query.processes.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.processes.createdAt)],
    limit,
    offset,
  });
}

/**
 * Get process count for the current tenant
 */
export async function getProcessCountByTenant(teamId?: number): Promise<number> {
  const { organizationId } = requireTenantContext();
  
  const conditions = [eq(schema.processes.organizationId, organizationId)];
  
  if (teamId) {
    conditions.push(eq(schema.processes.teamId, teamId));
  }
  
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.processes)
    .where(and(...conditions));
    
  return result[0]?.count || 0;
}

/**
 * Get a single process by ID with tenant validation
 * CRITICAL: Automatically validates the process belongs to the current organization
 */
export async function getProcessByIdWithTenantCheck(processId: number) {
  const { organizationId } = requireTenantContext();
  
  const process = await db.query.processes.findFirst({
    where: and(
      eq(schema.processes.id, processId),
      eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
    ),
    with: {
      eventLogs: true,
      processModels: true,
      activities: true,
      performanceMetrics: true,
      deviations: true,
      automationOpportunities: true,
    },
  });
  
  if (!process) {
    throw new Error('Process not found or access denied');
  }
  
  return process;
}

/**
 * Create a process for the current tenant
 * Automatically sets organizationId and userId from context
 */
export async function createProcessForTenant(data: {
  name: string;
  description?: string;
  source: string;
  status?: string;
  teamId?: number;
}) {
  const { organizationId, userId } = requireTenantContext();
  
  // If teamId is provided, validate it belongs to the organization
  if (data.teamId) {
    const team = await db.query.teams.findFirst({
      where: and(
        eq(schema.teams.id, data.teamId),
        eq(schema.teams.organizationId, organizationId)
      ),
    });
    
    if (!team) {
      throw new Error('Team not found or access denied');
    }
  }
  
  const [process] = await db.insert(schema.processes).values({
    ...data,
    userId,
    organizationId, // CRITICAL: Always set from context
  }).returning();
  
  return process;
}

/**
 * Update a process with tenant validation
 */
export async function updateProcessWithTenantCheck(
  processId: number,
  data: Partial<{
    name: string;
    description: string;
    source: string;
    status: string;
    teamId: number;
  }>
) {
  const { organizationId } = requireTenantContext();
  
  // If updating teamId, validate it belongs to the organization
  if (data.teamId) {
    const team = await db.query.teams.findFirst({
      where: and(
        eq(schema.teams.id, data.teamId),
        eq(schema.teams.organizationId, organizationId)
      ),
    });
    
    if (!team) {
      throw new Error('Team not found or access denied');
    }
  }
  
  const [process] = await db.update(schema.processes)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(schema.processes.id, processId),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .returning();
    
  if (!process) {
    throw new Error('Process not found or access denied');
  }
  
  return process;
}

/**
 * Delete a process with tenant validation
 */
export async function deleteProcessWithTenantCheck(processId: number): Promise<boolean> {
  const { organizationId } = requireTenantContext();
  
  const result = await db.delete(schema.processes)
    .where(
      and(
        eq(schema.processes.id, processId),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .returning();
    
  return result.length > 0;
}

/**
 * Get documents for the current tenant
 * Note: Documents are linked to users, so we query via user's organizationId
 */
export async function getDocumentsByTenant(options?: { limit?: number; offset?: number }) {
  const { organizationId } = requireTenantContext();
  const { limit = 50, offset = 0 } = options || {};
  
  // Get documents by joining with users table to filter by organizationId
  const documents = await db
    .select({
      id: schema.documents.id,
      userId: schema.documents.userId,
      name: schema.documents.name,
      size: schema.documents.size,
      path: schema.documents.path,
      status: schema.documents.status,
      extractedProcesses: schema.documents.extractedProcesses,
      activities: schema.documents.activities,
      uploadDate: schema.documents.uploadDate,
    })
    .from(schema.documents)
    .innerJoin(schema.users, eq(schema.documents.userId, schema.users.id))
    .where(eq(schema.users.organizationId, organizationId))
    .orderBy(desc(schema.documents.uploadDate))
    .limit(limit)
    .offset(offset);
    
  return documents;
}

/**
 * Get a document by ID with tenant validation
 */
export async function getDocumentByIdWithTenantCheck(documentId: number) {
  const { organizationId } = requireTenantContext();
  
  // Get document by joining with users table to validate organizationId
  const [document] = await db
    .select({
      id: schema.documents.id,
      userId: schema.documents.userId,
      name: schema.documents.name,
      size: schema.documents.size,
      path: schema.documents.path,
      status: schema.documents.status,
      extractedProcesses: schema.documents.extractedProcesses,
      activities: schema.documents.activities,
      uploadDate: schema.documents.uploadDate,
    })
    .from(schema.documents)
    .innerJoin(schema.users, eq(schema.documents.userId, schema.users.id))
    .where(
      and(
        eq(schema.documents.id, documentId),
        eq(schema.users.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .limit(1);
  
  if (!document) {
    throw new Error('Document not found or access denied');
  }
  
  return document;
}

/**
 * Get teams for the current tenant
 */
export async function getTeamsByTenant() {
  const { organizationId } = requireTenantContext();
  
  return await db.query.teams.findMany({
    where: eq(schema.teams.organizationId, organizationId),
    orderBy: [desc(schema.teams.createdAt)],
    with: {
      manager: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get team by ID with tenant validation
 */
export async function getTeamByIdWithTenantCheck(teamId: number) {
  const { organizationId } = requireTenantContext();
  
  const team = await db.query.teams.findFirst({
    where: and(
      eq(schema.teams.id, teamId),
      eq(schema.teams.organizationId, organizationId) // CRITICAL CHECK
    ),
    with: {
      manager: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      members: {
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });
  
  if (!team) {
    throw new Error('Team not found or access denied');
  }
  
  return team;
}

/**
 * Get users for the current tenant
 * Only admins can call this
 */
export async function getUsersByTenant() {
  const { organizationId } = requireTenantContext();
  
  return await db.query.users.findMany({
    where: eq(schema.users.organizationId, organizationId),
    orderBy: [desc(schema.users.createdAt)],
    columns: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      password: false, // Never return password
    },
  });
}

/**
 * Get dashboard statistics for the current tenant
 */
export async function getDashboardStatsByTenant() {
  const { organizationId } = requireTenantContext();
  
  const [processCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.processes)
    .where(eq(schema.processes.organizationId, organizationId));
    
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.users)
    .where(eq(schema.users.organizationId, organizationId));
    
  const [teamCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.teams)
    .where(eq(schema.teams.organizationId, organizationId));
    
  const [documentCount] = await db.select({ count: sql<number>`count(*)::int` })
    .from(schema.documents)
    .innerJoin(schema.users, eq(schema.documents.userId, schema.users.id))
    .where(eq(schema.users.organizationId, organizationId));
  
  return {
    totalProcesses: processCount?.count || 0,
    totalUsers: userCount?.count || 0,
    totalTeams: teamCount?.count || 0,
    totalDocuments: documentCount?.count || 0,
  };
}

/**
 * Get event logs for a process with tenant validation
 */
export async function getEventLogsByProcessWithTenantCheck(processId: number) {
  // First validate the process belongs to the tenant
  await getProcessByIdWithTenantCheck(processId);
  
  return await db.query.eventLogs.findMany({
    where: eq(schema.eventLogs.processId, processId),
    orderBy: [desc(schema.eventLogs.timestamp)],
  });
}

/**
 * Get activities for a process with tenant validation
 */
export async function getActivitiesByProcessWithTenantCheck(processId: number) {
  // First validate the process belongs to the tenant
  await getProcessByIdWithTenantCheck(processId);
  
  return await db.query.activities.findMany({
    where: eq(schema.activities.processId, processId),
  });
}

/**
 * Get performance metrics for a process with tenant validation
 */
export async function getPerformanceMetricsByProcessWithTenantCheck(
  processId: number,
  limit = 12
) {
  // First validate the process belongs to the tenant
  await getProcessByIdWithTenantCheck(processId);
  
  return await db.query.performanceMetrics.findMany({
    where: eq(schema.performanceMetrics.processId, processId),
    orderBy: [desc(schema.performanceMetrics.timestamp)],
    limit,
  });
}

/**
 * Super Admin Only: Get all organizations
 * This is the ONLY function that can query across tenants
 */
export async function getAllOrganizations() {
  const { role } = requireTenantContext();
  
  if (role !== 'super_admin') {
    throw new Error('Access denied: Super Admin role required');
  }
  
  return await db.query.organizations.findMany({
    orderBy: [desc(schema.organizations.createdAt)],
  });
}

/**
 * Get current user's organization details
 */
export async function getCurrentOrganization() {
  const { organizationId } = requireTenantContext();
  
  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, organizationId),
  });
  
  if (!org) {
    throw new Error('Organization not found');
  }
  
  return org;
}

// ==================== EVENT LOGS ====================

/**
 * Get all event logs for the current tenant
 * Joins with processes table to filter by organizationId
 */
export async function getEventLogsByTenant(options?: { 
  limit?: number; 
  offset?: number;
  processId?: number;
}) {
  const { organizationId } = requireTenantContext();
  const { limit = 100, offset = 0, processId } = options || {};
  
  const conditions = [eq(schema.processes.organizationId, organizationId)];
  
  if (processId) {
    conditions.push(eq(schema.eventLogs.processId, processId));
  }
  
  const eventLogs = await db
    .select({
      id: schema.eventLogs.id,
      processId: schema.eventLogs.processId,
      caseId: schema.eventLogs.caseId,
      activity: schema.eventLogs.activity,
      timestamp: schema.eventLogs.timestamp,
      resource: schema.eventLogs.resource,
      metadata: schema.eventLogs.metadata,
      createdAt: schema.eventLogs.createdAt,
    })
    .from(schema.eventLogs)
    .innerJoin(schema.processes, eq(schema.eventLogs.processId, schema.processes.id))
    .where(and(...conditions))
    .orderBy(desc(schema.eventLogs.timestamp))
    .limit(limit)
    .offset(offset);
    
  return eventLogs;
}

/**
 * Get event log by ID with tenant validation
 */
export async function getEventLogByIdWithTenantCheck(eventLogId: number) {
  const { organizationId } = requireTenantContext();
  
  const [eventLog] = await db
    .select({
      id: schema.eventLogs.id,
      processId: schema.eventLogs.processId,
      caseId: schema.eventLogs.caseId,
      activity: schema.eventLogs.activity,
      timestamp: schema.eventLogs.timestamp,
      resource: schema.eventLogs.resource,
      metadata: schema.eventLogs.metadata,
      createdAt: schema.eventLogs.createdAt,
    })
    .from(schema.eventLogs)
    .innerJoin(schema.processes, eq(schema.eventLogs.processId, schema.processes.id))
    .where(
      and(
        eq(schema.eventLogs.id, eventLogId),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .limit(1);
  
  if (!eventLog) {
    throw new Error('Event log not found or access denied');
  }
  
  return eventLog;
}

/**
 * Create event log for a process with tenant validation
 */
export async function createEventLogForTenant(data: {
  processId: number;
  caseId: string;
  activity: string;
  timestamp: Date;
  resource?: string;
  metadata?: any;
}) {
  // Validate the process belongs to the tenant
  await getProcessByIdWithTenantCheck(data.processId);
  
  const [eventLog] = await db.insert(schema.eventLogs).values(data).returning();
  
  return eventLog;
}

/**
 * Update event log with tenant validation
 */
export async function updateEventLogWithTenantCheck(
  eventLogId: number,
  data: Partial<{
    caseId: string;
    activity: string;
    timestamp: Date;
    resource: string;
    metadata: any;
  }>
) {
  const { organizationId } = requireTenantContext();
  
  const [eventLog] = await db.update(schema.eventLogs)
    .set(data)
    .from(schema.processes)
    .where(
      and(
        eq(schema.eventLogs.id, eventLogId),
        eq(schema.eventLogs.processId, schema.processes.id),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .returning();
    
  if (!eventLog) {
    throw new Error('Event log not found or access denied');
  }
  
  return eventLog;
}

/**
 * Delete event log with tenant validation
 */
export async function deleteEventLogWithTenantCheck(eventLogId: number): Promise<boolean> {
  const { organizationId } = requireTenantContext();
  
  const result = await db.delete(schema.eventLogs)
    .where(
      and(
        eq(schema.eventLogs.id, eventLogId),
        sql`${schema.eventLogs.processId} IN (
          SELECT id FROM ${schema.processes} 
          WHERE ${schema.processes.organizationId} = ${organizationId}
        )`
      )
    )
    .returning();
    
  return result.length > 0;
}

// ==================== DOCUMENTS ====================

/**
 * Create document for the current tenant
 */
export async function createDocumentForTenant(data: {
  name: string;
  size: string;
  path: string;
  status?: string;
  extractedProcesses?: number;
  activities?: number;
}) {
  const { userId } = requireTenantContext();
  
  const [document] = await db.insert(schema.documents).values({
    ...data,
    userId, // CRITICAL: Set from context
  }).returning();
  
  return document;
}

/**
 * Delete document with tenant validation
 */
export async function deleteDocumentWithTenantCheck(documentId: number): Promise<boolean> {
  const { organizationId } = requireTenantContext();
  
  const result = await db.delete(schema.documents)
    .where(
      and(
        eq(schema.documents.id, documentId),
        sql`${schema.documents.userId} IN (
          SELECT id FROM ${schema.users} 
          WHERE ${schema.users.organizationId} = ${organizationId}
        )`
      )
    )
    .returning();
    
  return result.length > 0;
}

// ==================== SIMULATIONS ====================

/**
 * Get all simulation scenarios for the current tenant
 */
export async function getSimulationsByTenant(options?: { 
  limit?: number; 
  offset?: number;
  processId?: number;
}) {
  const { organizationId } = requireTenantContext();
  const { limit = 50, offset = 0, processId } = options || {};
  
  const conditions = [eq(schema.processes.organizationId, organizationId)];
  
  if (processId) {
    conditions.push(eq(schema.simulationScenarios.processId, processId));
  }
  
  const simulations = await db
    .select({
      id: schema.simulationScenarios.id,
      processId: schema.simulationScenarios.processId,
      name: schema.simulationScenarios.name,
      description: schema.simulationScenarios.description,
      parameters: schema.simulationScenarios.parameters,
      results: schema.simulationScenarios.results,
      status: schema.simulationScenarios.status,
      createdAt: schema.simulationScenarios.createdAt,
      completedAt: schema.simulationScenarios.completedAt,
    })
    .from(schema.simulationScenarios)
    .innerJoin(schema.processes, eq(schema.simulationScenarios.processId, schema.processes.id))
    .where(and(...conditions))
    .orderBy(desc(schema.simulationScenarios.createdAt))
    .limit(limit)
    .offset(offset);
    
  return simulations;
}

/**
 * Get simulation by ID with tenant validation
 */
export async function getSimulationByIdWithTenantCheck(simulationId: number) {
  const { organizationId } = requireTenantContext();
  
  const [simulation] = await db
    .select({
      id: schema.simulationScenarios.id,
      processId: schema.simulationScenarios.processId,
      name: schema.simulationScenarios.name,
      description: schema.simulationScenarios.description,
      parameters: schema.simulationScenarios.parameters,
      results: schema.simulationScenarios.results,
      status: schema.simulationScenarios.status,
      createdAt: schema.simulationScenarios.createdAt,
      completedAt: schema.simulationScenarios.completedAt,
    })
    .from(schema.simulationScenarios)
    .innerJoin(schema.processes, eq(schema.simulationScenarios.processId, schema.processes.id))
    .where(
      and(
        eq(schema.simulationScenarios.id, simulationId),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .limit(1);
  
  if (!simulation) {
    throw new Error('Simulation not found or access denied');
  }
  
  return simulation;
}

/**
 * Create simulation for a process with tenant validation
 */
export async function createSimulationForTenant(data: {
  processId: number;
  name: string;
  description?: string;
  parameters: any;
  status?: string;
}) {
  // Validate the process belongs to the tenant
  await getProcessByIdWithTenantCheck(data.processId);
  
  const [simulation] = await db.insert(schema.simulationScenarios).values(data).returning();
  
  return simulation;
}

/**
 * Update simulation with tenant validation
 */
export async function updateSimulationWithTenantCheck(
  simulationId: number,
  data: Partial<{
    name: string;
    description: string;
    parameters: any;
    results: any;
    status: string;
    completedAt: Date;
  }>
) {
  const { organizationId } = requireTenantContext();
  
  const [simulation] = await db.update(schema.simulationScenarios)
    .set(data)
    .from(schema.processes)
    .where(
      and(
        eq(schema.simulationScenarios.id, simulationId),
        eq(schema.simulationScenarios.processId, schema.processes.id),
        eq(schema.processes.organizationId, organizationId) // CRITICAL CHECK
      )
    )
    .returning();
    
  if (!simulation) {
    throw new Error('Simulation not found or access denied');
  }
  
  return simulation;
}

/**
 * Delete simulation with tenant validation
 */
export async function deleteSimulationWithTenantCheck(simulationId: number): Promise<boolean> {
  const { organizationId } = requireTenantContext();
  
  const result = await db.delete(schema.simulationScenarios)
    .where(
      and(
        eq(schema.simulationScenarios.id, simulationId),
        sql`${schema.simulationScenarios.processId} IN (
          SELECT id FROM ${schema.processes} 
          WHERE ${schema.processes.organizationId} = ${organizationId}
        )`
      )
    )
    .returning();
    
  return result.length > 0;
}
