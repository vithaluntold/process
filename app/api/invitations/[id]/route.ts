import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { invitations, users } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

async function getUserFromRequest(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return null;

  const sessionToken = sessionCookie.value;
  
  try {
    const decoded = JSON.parse(Buffer.from(sessionToken.split('.')[1], 'base64').toString());
    const user = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    return user[0] || null;
  } catch {
    return null;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(req);
    
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const invitationId = parseInt(params.id);
    if (isNaN(invitationId)) {
      return NextResponse.json(
        { error: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.organizationId, currentUser.organizationId!)
        )
      )
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    await db
      .update(invitations)
      .set({ status: "revoked" })
      .where(eq(invitations.id, invitationId));

    return NextResponse.json({
      message: "Invitation revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
