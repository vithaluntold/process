import { NextResponse } from "next/server"
import { createTenantSafeHandler } from "@/lib/tenant-api-factory"
import { db } from "@/lib/db"
import { auditLogs, users } from "@/shared/schema"
import { eq, desc, and } from "drizzle-orm"
import { requireTenantContext } from "@/lib/tenant-context"

export const dynamic = "force-dynamic"

export const GET = createTenantSafeHandler(async (request, context) => {
  try {
    const { organizationId } = requireTenantContext()

    const activities = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        timestamp: auditLogs.timestamp,
        userId: auditLogs.userId,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(users.organizationId, organizationId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(10)

    return NextResponse.json({ data: activities })
  } catch (error) {
    console.error("Dashboard activity error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    )
  }
})
