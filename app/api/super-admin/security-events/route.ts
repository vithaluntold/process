import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { auditLogs } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { desc, or, like, gte, sql } from "drizzle-orm"

const SECURITY_ACTIONS = [
  "login_failed",
  "password_reset",
  "password_change",
  "role_change",
  "user_suspended",
  "user_deleted",
  "org_suspended",
  "org_deleted",
  "api_key_created",
  "api_key_revoked",
  "saml_config_changed",
  "encryption_key_rotated",
  "suspicious_activity",
  "rate_limit_exceeded",
  "unauthorized_access",
]

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const securityLogs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        timestamp: auditLogs.timestamp,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .where(
        or(
          ...SECURITY_ACTIONS.map(action => like(auditLogs.action, `%${action}%`))
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(100)

    const events = securityLogs.map(log => {
      let severity = "low"
      let type = log.action
      let message = `${log.action} on ${log.resource}`
      let resolved = true

      if (log.action.includes("failed") || log.action.includes("unauthorized")) {
        severity = "high"
        resolved = false
      } else if (log.action.includes("suspended") || log.action.includes("deleted")) {
        severity = "medium"
      } else if (log.action.includes("rate_limit") || log.action.includes("suspicious")) {
        severity = "high"
        resolved = false
      }

      if (log.action === "login_failed") {
        message = `Failed login attempt from IP: ${log.ipAddress || "unknown"}`
      } else if (log.action === "role_change") {
        message = `User role changed for ${log.resource} #${log.resourceId}`
      } else if (log.action === "password_reset") {
        message = `Password reset requested`
      }

      return {
        id: log.id,
        type,
        severity,
        message,
        timestamp: log.timestamp,
        resolved,
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Failed to fetch security events:", error)
    return NextResponse.json(
      { error: "Failed to fetch security events", events: [] },
      { status: 500 }
    )
  }
}
