import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { auditLogs, users } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { desc, eq, sql, and, or, like, gte, lte, not, inArray } from "drizzle-orm"

const EXCLUDED_ACTIONS = [
  "data_view",
  "data_access", 
  "process_view",
  "event_log_view",
  "document_view",
  "report_view",
]

const EXCLUDED_RESOURCES = [
  "process_data",
  "event_log_data",
  "case_data",
  "document_content",
  "user_private_data",
]

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const action = searchParams.get("action")
    const resource = searchParams.get("resource")

    let query = db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        timestamp: auditLogs.timestamp,
      })
      .from(auditLogs)
      .where(
        and(
          not(inArray(auditLogs.action, EXCLUDED_ACTIONS)),
          not(inArray(auditLogs.resource, EXCLUDED_RESOURCES))
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset)

    const rawLogs = await query
    
    const PRIVACY_RESOURCES = ["organization", "tenant", "user", "team"]
    const logs = rawLogs.map(log => ({
      ...log,
      resourceId: PRIVACY_RESOURCES.includes(log.resource) ? null : log.resourceId,
      ipAddress: log.ipAddress ? log.ipAddress.split('.').slice(0, 2).join('.') + '.x.x' : null,
    }))

    return NextResponse.json({
      logs,
      pagination: {
        limit,
        offset,
        hasMore: logs.length === limit,
      },
    })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}
