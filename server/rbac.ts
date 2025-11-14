import { db } from "@/server/storage";
import { teams, teamMembers, processes, users } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

export interface User {
  id: number;
  organizationId: number | null;
  email: string;
  role: string;
}

export async function canAccessProcess(user: User, processId: number): Promise<boolean> {
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  const [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.id, processId))
    .limit(1);

  if (!process) {
    return false;
  }

  if (process.userId === user.id) {
    return true;
  }

  if (process.teamId) {
    const membership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, process.teamId),
          eq(teamMembers.userId, user.id)
        )
      )
      .limit(1);

    return membership.length > 0;
  }

  if (process.organizationId === user.organizationId) {
    return true;
  }

  return false;
}

export async function canModifyProcess(user: User, processId: number): Promise<boolean> {
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  const [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.id, processId))
    .limit(1);

  if (!process) {
    return false;
  }

  if (process.userId === user.id) {
    return true;
  }

  if (process.teamId) {
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, process.teamId),
          eq(teamMembers.userId, user.id)
        )
      )
      .limit(1);

    if (membership && membership.role === "manager") {
      return true;
    }
  }

  return false;
}

export async function canDeleteProcess(user: User, processId: number): Promise<boolean> {
  if (user.role === "super_admin" || user.role === "admin") {
    return true;
  }

  const [process] = await db
    .select()
    .from(processes)
    .where(eq(processes.id, processId))
    .limit(1);

  if (!process) {
    return false;
  }

  if (process.userId === user.id) {
    return true;
  }

  if (process.teamId) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, process.teamId))
      .limit(1);

    if (team && team.managerId === user.id) {
      return true;
    }
  }

  return false;
}

export async function getUserTeams(userId: number): Promise<number[]> {
  const memberships = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  return memberships.map((m) => m.teamId);
}

export async function isTeamManager(userId: number, teamId: number): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, "manager")
      )
    )
    .limit(1);

  return membership !== undefined;
}

export async function getAccessibleProcesses(user: User): Promise<number[]> {
  if (user.role === "super_admin" || user.role === "admin") {
    const allProcesses = await db
      .select({ id: processes.id })
      .from(processes)
      .where(eq(processes.organizationId, user.organizationId!));
    return allProcesses.map((p) => p.id);
  }

  const userTeams = await getUserTeams(user.id);

  const accessibleProcesses = await db
    .select({ id: processes.id })
    .from(processes)
    .where(
      and(
        eq(processes.organizationId, user.organizationId!)
      )
    );

  return accessibleProcesses
    .filter((p) => {
      return true;
    })
    .map((p) => p.id);
}
