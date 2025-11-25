import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getJwtSecret } from "@/lib/jwt-config";

export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  organizationId: number | null;
  createdAt: Date;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session");

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, getJwtSecret());
    const userId = payload.userId as number;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      cookieStore.delete("session");
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
