import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { organizations, users, processes, eventLogs, auditLogs } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { sql, eq, count, gte } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const [orgCount] = await db
      .select({ count: count() })
      .from(organizations)

    const [activeOrgCount] = await db
      .select({ count: count() })
      .from(organizations)
      .where(eq(organizations.status, "active"))

    const [userCount] = await db
      .select({ count: count() })
      .from(users)

    const [activeUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "active"))

    const [processCount] = await db
      .select({ count: count() })
      .from(processes)

    const [eventLogCount] = await db
      .select({ count: count() })
      .from(eventLogs)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [apiCallsToday] = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, today))

    const estimatedStorageGB = (
      (eventLogCount?.count || 0) * 0.001 + 
      (processCount?.count || 0) * 0.01
    ).toFixed(2)

    return NextResponse.json({
      totalOrganizations: orgCount?.count || 0,
      activeOrganizations: activeOrgCount?.count || 0,
      totalUsers: userCount?.count || 0,
      activeUsers: activeUserCount?.count || 0,
      totalProcesses: processCount?.count || 0,
      totalEventLogs: eventLogCount?.count || 0,
      storageUsed: `${estimatedStorageGB} GB`,
      apiCallsToday: apiCallsToday?.count || 0,
    })
  } catch (error) {
    console.error("Failed to fetch metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    )
  }
}
