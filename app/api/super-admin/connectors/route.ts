import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { connectorConfigurations, connectorHealth } from "@/shared/schema"
import { eq, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const configs = await db.select().from(connectorConfigurations)
    
    const connectorIds = configs.map(c => c.id)
    let healthRecords: typeof connectorHealth.$inferSelect[] = []
    
    if (connectorIds.length > 0) {
      healthRecords = await db
        .select()
        .from(connectorHealth)
        .where(sql`${connectorHealth.connectorConfigId} = ANY(ARRAY[${sql.raw(connectorIds.join(','))}]::int[])`)
    }

    const healthMap = new Map(healthRecords.map(h => [h.connectorConfigId, h]))

    const connectors = configs.map(config => {
      const health = healthMap.get(config.id)
      return {
        id: config.id,
        displayName: config.name,
        connectorType: config.connectorType,
        status: config.status,
        healthStatus: health?.status || 'unknown',
        lastCheckedAt: health?.lastCheckedAt || null,
        responseTimeMs: health?.averageLatencyMs || null,
      }
    })

    const healthy = connectors.filter(c => c.healthStatus === 'healthy').length
    const unhealthy = connectors.filter(c => c.healthStatus === 'unhealthy' || c.healthStatus === 'error').length
    const unknown = connectors.filter(c => c.healthStatus === 'unknown' || c.healthStatus === 'degraded').length

    return NextResponse.json({
      total: connectors.length,
      healthy,
      unhealthy,
      unknown,
      connectors,
    })
  } catch (error) {
    console.error("Failed to fetch connector health:", error)
    return NextResponse.json(
      { 
        total: 0,
        healthy: 0,
        unhealthy: 0,
        unknown: 0,
        connectors: [],
        error: "Failed to fetch connector health"
      },
      { status: 500 }
    )
  }
}
