import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { appCache } from "@/lib/cache";
import { getJwtSecret } from "@/lib/jwt-config";

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session");

    console.log("Session cookie present:", !!token);
    console.log("All cookies:", cookieStore.getAll().map(c => c.name));

    if (!token) {
      console.log("No session cookie found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token.value, getJwtSecret());
    const userId = payload.userId as number;

    const cacheKey = `user:${userId}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ user: cached }, {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': 'HIT',
        },
      });
    }

    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      cookieStore.delete("session");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    appCache.set(cacheKey, user, 60);

    return NextResponse.json({ user }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
