import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { invitations, organizations } from "@/shared/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const [invitation] = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        teamId: invitations.teamId,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        metadata: invitations.metadata,
        organizationId: invitations.organizationId,
        organizationName: organizations.name,
      })
      .from(invitations)
      .leftJoin(organizations, eq(invitations.organizationId, organizations.id))
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token", valid: false },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { 
          error: `Invitation has been ${invitation.status}`,
          valid: false 
        },
        { status: 400 }
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await db
        .update(invitations)
        .set({ status: "expired" })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json(
        { error: "Invitation has expired", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organizationName,
        metadata: invitation.metadata,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation", valid: false },
      { status: 500 }
    );
  }
}
