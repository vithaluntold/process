import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
import { getCurrentUser } from "@/lib/server-auth";
import { processSchema, sanitizeInput } from "@/lib/validation";
import { appCache } from "@/lib/cache";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 
      ? Math.min(parsedLimit, 100) 
      : 50;
    const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 
      ? parsedOffset 
      : 0;

    const cacheKey = `processes:${user.id}:${limit}:${offset}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    const [processes, total] = await Promise.all([
      storage.getProcessesByUser(user.id, { limit, offset }),
      storage.getProcessCount(user.id),
    ]);
    
    const responseData = { 
      processes,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };

    appCache.set(cacheKey, responseData, 30);
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'process-create', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    
    const validation = processSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, source } = validation.data;

    const process = await storage.createProcess({
      userId: user.id,
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      source: sanitizeInput(source),
      status: "active",
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
}
