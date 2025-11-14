import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { invitations, users, teamMembers } from "@/shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = acceptInviteSchema.parse(body);

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, validatedData.token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation has been ${invitation.status}` },
        { status: 400 }
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await db
        .update(invitations)
        .set({ status: "expired" })
        .where(eq(invitations.id, invitation.id));

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        organizationId: invitation.organizationId,
        email: invitation.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: invitation.role,
        status: "active",
      })
      .returning();

    if (invitation.teamId) {
      await db.insert(teamMembers).values({
        teamId: invitation.teamId,
        userId: newUser.id,
        role: "member",
      });
    }

    await db
      .update(invitations)
      .set({ 
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(invitations.id, invitation.id));

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
