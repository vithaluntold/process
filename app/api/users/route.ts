import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/storage";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequest, requireAdmin } from "@/server/auth-utils";

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

    const orgUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.organizationId, currentUser.organizationId))
      .orderBy(users.firstName);

    return NextResponse.json({ users: orgUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
