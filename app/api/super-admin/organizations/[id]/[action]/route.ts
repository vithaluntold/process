import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/storage"
import { organizations, auditLogs } from "@/shared/schema"
import { getUserFromRequest, requireSuperAdmin } from "@/server/auth-utils"
import { eq } from "drizzle-orm"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    const authError = requireSuperAdmin(user)
    if (authError) {
      return NextResponse.json({ error: authError.error }, { status: authError.status })
    }

    const { id: token, action } = await params
    
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    const [org] = await db
      .select({ id: organizations.id, status: organizations.status, adminToken: organizations.adminToken })
      .from(organizations)
      .where(eq(organizations.adminToken, token.toUpperCase()))
      .limit(1)

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }
    
    const orgId = org.id

    const validActions = ["suspend", "activate", "cancel"]
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    let newStatus: string
    switch (action) {
      case "suspend":
        newStatus = "suspended"
        break
      case "activate":
        newStatus = "active"
        break
      case "cancel":
        newStatus = "canceled"
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await db
      .update(organizations)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(organizations.id, orgId))

    await db.insert(auditLogs).values({
      userId: user.id,
      action: `organization_${action}`,
      resource: "tenant",
      resourceId: null,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
      metadata: {
        previousStatus: org.status,
        newStatus,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Organization ${action}d successfully`,
      organization: { token: org.adminToken, status: newStatus },
    })
  } catch (error) {
    console.error("Failed to perform organization action:", error)
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    )
  }
}
