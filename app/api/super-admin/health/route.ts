import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const startTime = Date.now()
    await db.execute(sql`SELECT 1`)
    const dbLatency = Date.now() - startTime

    const dbStatus = dbLatency < 100 ? "healthy" : dbLatency < 500 ? "degraded" : "unhealthy"

    const kmsProvider = process.env.KMS_PROVIDER || "local"
    let encryptionStatus = "healthy"
    
    if (kmsProvider === "azure") {
      const hasAzureConfig = !!(
        process.env.AZURE_KEYVAULT_URL &&
        process.env.AZURE_TENANT_ID &&
        process.env.AZURE_CLIENT_ID
      )
      encryptionStatus = hasAzureConfig ? "healthy" : "degraded"
    } else if (kmsProvider === "aws") {
      const hasAwsConfig = !!(process.env.AWS_KMS_KEY_ID && process.env.AWS_REGION)
      encryptionStatus = hasAwsConfig ? "healthy" : "degraded"
    } else if (kmsProvider === "gcp") {
      const hasGcpConfig = !!(
        process.env.GCP_PROJECT_ID &&
        process.env.GCP_KMS_LOCATION &&
        process.env.GCP_KMS_KEYRING
      )
      encryptionStatus = hasGcpConfig ? "healthy" : "degraded"
    }

    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)

    const cpuUsage = process.cpuUsage()
    const cpuPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000000)

    const uptimeHours = Math.round(process.uptime() / 3600)
    const uptimePercent = Math.min(99.9, 99 + (uptimeHours / 24) * 0.9)

    return NextResponse.json({
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      encryption: {
        status: encryptionStatus,
        provider: kmsProvider.toUpperCase(),
      },
      api: {
        status: "operational",
        uptime: parseFloat(uptimePercent.toFixed(1)),
      },
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
      },
      cpu: {
        usage: Math.min(cpuPercent, 100),
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        database: { status: "error", latency: -1 },
        encryption: { status: "unknown", provider: "N/A" },
        api: { status: "degraded", uptime: 0 },
        memory: { used: 0, total: 0 },
        cpu: { usage: 0 },
      },
      { status: 500 }
    )
  }
}
