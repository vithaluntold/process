import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { teams, users, teamMembers } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getUserFromRequest, requireAdmin } from "@/server/auth-utils";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  managerId: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const guardError = withApiGuards(req, 'team-update', API_WRITE_LIMIT, currentUser.id);
    if (guardError) return guardError;

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateTeamSchema.parse(body);

    const [existingTeam] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.organizationId, currentUser.organizationId)
        )
      )
      .limit(1);

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (validatedData.managerId !== undefined) {
      if (validatedData.managerId !== null) {
        const [manager] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.id, validatedData.managerId),
              eq(users.organizationId, currentUser.organizationId)
            )
          )
          .limit(1);

        if (!manager) {
          return NextResponse.json(
            { error: "Manager not found in your organization" },
            { status: 400 }
          );
        }
      }

      if (existingTeam.managerId) {
        await db
          .delete(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.userId, existingTeam.managerId),
              eq(teamMembers.role, "manager")
            )
          );
      }

      if (validatedData.managerId) {
        const existingMembership = await db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, teamId),
              eq(teamMembers.userId, validatedData.managerId)
            )
          )
          .limit(1);

        if (existingMembership.length === 0) {
          await db.insert(teamMembers).values({
            teamId,
            userId: validatedData.managerId,
            role: "manager",
          });
        } else {
          await db
            .update(teamMembers)
            .set({ role: "manager" })
            .where(
              and(
                eq(teamMembers.teamId, teamId),
                eq(teamMembers.userId, validatedData.managerId)
              )
            );
        }
      }
    }

    const [updatedTeam] = await db
      .update(teams)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    return NextResponse.json({
      team: updatedTeam,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const guardError = withApiGuards(req, 'team-delete', API_WRITE_LIMIT, currentUser.id);
    if (guardError) return guardError;

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID" },
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

    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    
    await db.delete(teams).where(eq(teams.id, teamId));

    return NextResponse.json({
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
