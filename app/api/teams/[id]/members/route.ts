import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { teams, users, teamMembers } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.number(),
  role: z.enum(["manager", "member"]).default("member"),
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

export async function POST(
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

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: "Invalid team ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = addMemberSchema.parse(body);

    const [team] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.organizationId, currentUser.organizationId!)
        )
      )
      .limit(1);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, validatedData.userId),
          eq(users.organizationId, currentUser.organizationId!)
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in your organization" },
        { status: 400 }
      );
    }

    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, validatedData.userId)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }

    const [member] = await db
      .insert(teamMembers)
      .values({
        teamId,
        userId: validatedData.userId,
        role: validatedData.role,
      })
      .returning();

    return NextResponse.json({
      member,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("Error adding member:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
          eq(teams.organizationId, currentUser.organizationId!)
        )
      )
      .limit(1);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        userRole: users.role,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(users.firstName);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
