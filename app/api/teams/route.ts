import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { teams, users, teamMembers } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  managerId: z.number().optional(),
});

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

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createTeamSchema.parse(body);

    if (validatedData.managerId) {
      const [manager] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, validatedData.managerId),
            eq(users.organizationId, currentUser.organizationId!)
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

    const [team] = await db
      .insert(teams)
      .values({
        organizationId: currentUser.organizationId!,
        name: validatedData.name,
        description: validatedData.description,
        managerId: validatedData.managerId,
        status: "active",
      })
      .returning();

    if (validatedData.managerId) {
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: validatedData.managerId,
        role: "manager",
      });
    }

    return NextResponse.json({
      team,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Error creating team:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orgTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        managerId: teams.managerId,
        status: teams.status,
        metadata: teams.metadata,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        managerFirstName: users.firstName,
        managerLastName: users.lastName,
        managerEmail: users.email,
      })
      .from(teams)
      .leftJoin(users, eq(teams.managerId, users.id))
      .where(eq(teams.organizationId, currentUser.organizationId!))
      .orderBy(teams.name);

    return NextResponse.json({ teams: orgTeams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
