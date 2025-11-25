import { NextRequest } from "next/server";
import { db } from "@/server/storage";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwt-config";

export async function getUserFromRequest(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return null;

  const sessionToken = sessionCookie.value;
  
  try {
    const { payload } = await jwtVerify(sessionToken, getJwtSecret());
    const userId = payload.userId as number;
    
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user[0] || null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export function requireAuth(user: any) {
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export function requireAdmin(user: any) {
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: "Forbidden. Admin access required.", status: 403 };
  }
  return null;
}

export function requireSuperAdmin(user: any) {
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  if (user.role !== "super_admin") {
    return { error: "Forbidden. Super Admin access required.", status: 403 };
  }
  return null;
}
