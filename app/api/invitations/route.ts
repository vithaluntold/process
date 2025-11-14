import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { invitations, users, teams } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { getUserFromRequest, requireAdmin } from "@/server/auth-utils";

const inviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "employee"]).default("employee"),
  teamId: z.number().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const validatedData = inviteSchema.parse(body);

    if (validatedData.teamId) {
      const [team] = await db
        .select()
        .from(teams)
        .where(
          and(
            eq(teams.id, validatedData.teamId),
            eq(teams.organizationId, currentUser.organizationId)
          )
        )
        .limit(1);

      if (!team) {
        return NextResponse.json(
          { error: "Team not found in your organization" },
          { status: 400 }
        );
      }
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, validatedData.email.toLowerCase()),
          eq(users.organizationId, currentUser.organizationId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists in your organization" },
        { status: 400 }
      );
    }

    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, validatedData.email.toLowerCase()),
          eq(invitations.organizationId, currentUser.organizationId),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: "Pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const metadata = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
    };

    const [invitation] = await db
      .insert(invitations)
      .values({
        organizationId: currentUser.organizationId,
        email: validatedData.email.toLowerCase(),
        token,
        role: validatedData.role,
        teamId: validatedData.teamId,
        invitedBy: currentUser.id,
        status: "pending",
        expiresAt,
        metadata,
      })
      .returning();

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/auth/accept-invite?token=${token}`;

    return NextResponse.json({
      invitation,
      inviteUrl,
      message: "Invitation created successfully",
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    const orgInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        teamId: invitations.teamId,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        metadata: invitations.metadata,
        createdAt: invitations.createdAt,
      })
      .from(invitations)
      .where(eq(invitations.organizationId, currentUser.organizationId))
      .orderBy(invitations.createdAt);

    return NextResponse.json({ invitations: orgInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
