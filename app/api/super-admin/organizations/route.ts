import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { organizations, users, processes } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { eq, sql, count, isNull } from "drizzle-orm"
import crypto from "crypto"

function generateSecureToken(): string {
  return crypto.randomUUID().replace(/-/g, '').toUpperCase()
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("mode") || "aggregate"

    if (mode === "aggregate") {
      const statusCounts = await db
        .select({
          status: organizations.status,
          count: sql<number>`count(*)`,
        })
        .from(organizations)
        .groupBy(organizations.status)

      const sizeCounts = await db
        .select({
          size: organizations.size,
          count: sql<number>`count(*)`,
        })
        .from(organizations)
        .groupBy(organizations.size)

      const [totalUsers] = await db.select({ count: count() }).from(users)
      const [totalProcesses] = await db.select({ count: count() }).from(processes)

      return NextResponse.json({
        mode: "aggregate",
        byStatus: statusCounts,
        bySize: sizeCounts.filter(s => s.size),
        totals: {
          organizations: statusCounts.reduce((sum, s) => sum + Number(s.count), 0),
          users: totalUsers?.count || 0,
          processes: totalProcesses?.count || 0,
        }
      })
    }

    if (mode === "management") {
      const orgsWithTokens = await db
        .select({
          id: organizations.id,
          adminToken: organizations.adminToken,
          status: organizations.status,
        })
        .from(organizations)
        .orderBy(organizations.id)

      const updatedOrgs = []
      for (const org of orgsWithTokens) {
        let token = org.adminToken
        if (!token) {
          token = generateSecureToken()
          await db
            .update(organizations)
            .set({ adminToken: token })
            .where(eq(organizations.id, org.id))
        }
        updatedOrgs.push({
          token,
          status: org.status,
        })
      }

      return NextResponse.json(updatedOrgs)
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  } catch (error) {
    console.error("Failed to fetch organizations:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const body = await req.json()
    const { action, token } = body

    if (action === "rotate_token" && token) {
      const [org] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.adminToken, token.toUpperCase()))
        .limit(1)

      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }

      const newToken = generateSecureToken()
      await db
        .update(organizations)
        .set({ adminToken: newToken })
        .where(eq(organizations.id, org.id))

      return NextResponse.json({
        success: true,
        message: "Token rotated successfully",
        newToken,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Failed to perform action:", error)
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    )
  }
}
