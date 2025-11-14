import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { teams, users, teamMembers } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest, requireAdmin } from "@/server/auth-utils";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const currentUser = await getUserFromRequest(req);
    
    const authError = requireAdmin(currentUser);
    if (authError) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    const guardError = withApiGuards(req, 'team-member-remove', API_WRITE_LIMIT, currentUser.id);
    if (guardError) return guardError;

    const teamId = parseInt(params.id);
    const userId = parseInt(params.userId);
    
    if (isNaN(teamId) || isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid team ID or user ID" },
        { status: 400 }
      );
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.organizationId, currentUser.organizationId)
        )
      )
      .limit(1);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const result = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );

    if (team.managerId === userId) {
      await db
        .update(teams)
        .set({ managerId: null, updatedAt: new Date() })
        .where(eq(teams.id, teamId));
    }

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
