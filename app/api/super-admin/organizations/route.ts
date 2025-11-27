import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { organizations, users, processes } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { eq, sql, count } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const orgsWithCounts = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        status: organizations.status,
        industry: organizations.industry,
        size: organizations.size,
        createdAt: organizations.createdAt,
        userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE organization_id = ${organizations.id})`,
        processCount: sql<number>`(SELECT COUNT(*) FROM processes WHERE organization_id = ${organizations.id})`,
      })
      .from(organizations)
      .orderBy(organizations.createdAt)

    return NextResponse.json(orgsWithCounts)
  } catch (error) {
    console.error("Failed to fetch organizations:", error)
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    )
  }
}
