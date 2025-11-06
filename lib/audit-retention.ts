import { db } from "./db";
import * as schema from "@/shared/schema";
import { sql } from "drizzle-orm";

export async function purgeOldAuditLogs(retentionDays: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.execute(
      sql`DELETE FROM ${schema.auditLogs} WHERE timestamp < ${cutoffDate}`
    );

    console.log(`Purged audit logs older than ${retentionDays} days`);
    return result;
  } catch (error) {
    console.error("Failed to purge old audit logs:", error);
    throw error;
  }
}

export async function purgeFailedLoginAttempts(retentionDays: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db.execute(
      sql`DELETE FROM ${schema.auditLogs} 
          WHERE action = 'auth.login.failed' 
          AND timestamp < ${cutoffDate}`
    );

    console.log(`Purged failed login attempts older than ${retentionDays} days`);
    return result;
  } catch (error) {
    console.error("Failed to purge failed login attempts:", error);
    throw error;
  }
}
