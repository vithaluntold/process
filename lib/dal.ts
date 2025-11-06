import "server-only";
import { auth } from "./auth";
import { db } from "./db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function getUser() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = parseInt((session.user as any).id);
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export async function logAudit(
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: any
) {
  const session = await auth();
  const userId = session?.user ? parseInt((session.user as any).id) : null;

  try {
    await db.insert(schema.auditLogs).values({
      userId,
      action,
      resource,
      resourceId: resourceId || null,
      ipAddress: "server",
      userAgent: "server",
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("CRITICAL: Audit logging failed:", error);
    throw new Error("Audit logging failure");
  }
}
