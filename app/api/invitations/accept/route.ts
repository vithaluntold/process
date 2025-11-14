import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { invitations, users, teamMembers } from "@/shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

class InvitationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "InvitationError";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = acceptInviteSchema.parse(body);

    const newUser = await db.transaction(async (tx) => {
      const invitationRows = await tx.execute(
        sql`SELECT * FROM ${invitations} WHERE ${invitations.token} = ${validatedData.token} FOR UPDATE`
      );

      if (invitationRows.rows.length === 0) {
        throw new InvitationError("Invalid invitation token", 404);
      }

      const invitation = invitationRows.rows[0] as any;

      if (invitation.status !== "pending") {
        throw new InvitationError(`Invitation has been ${invitation.status}`, 400);
      }

      if (new Date() > new Date(invitation.expires_at)) {
        throw new InvitationError("Invitation has expired", 400);
      }

      const existingUser = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, invitation.email.toLowerCase()),
            eq(users.organizationId, invitation.organization_id)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new InvitationError("User with this email already exists in this organization", 400);
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const [createdUser] = await tx
        .insert(users)
        .values({
          organizationId: invitation.organization_id,
          email: invitation.email.toLowerCase(),
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          role: invitation.role,
          status: "active",
        })
        .returning();

      if (invitation.team_id) {
        await tx.insert(teamMembers).values({
          teamId: invitation.team_id,
          userId: createdUser.id,
          role: "member",
        });
      }

      await tx
        .update(invitations)
        .set({ 
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));

      return createdUser;
    });

    return NextResponse.json({
      message: "Registration completed successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    
    if (error instanceof InvitationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
