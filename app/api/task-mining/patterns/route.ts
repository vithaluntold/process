import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { getTaskPatterns, createTaskPattern, updateTaskPattern } from "@/server/task-mining-storage";
import { z } from "zod";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

const createPatternSchema = z.object({
  patternName: z.string(),
  description: z.string().optional(),
  frequency: z.number().int().positive(),
  avgDuration: z.number().optional(),
  steps: z.any().optional(),
  automationPotential: z.number().min(0).max(1),
  timeSavingsEstimate: z.number().optional(),
  lastOccurrence: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(["identified", "validated", "automated"]).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patterns = await getTaskPatterns(user.id);
    return NextResponse.json({ patterns });
  } catch (error) {
    console.error("Error fetching task patterns:", error);
    return NextResponse.json({ error: "Failed to fetch patterns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(request, 'pattern-create', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const body = await request.json();
    const data = createPatternSchema.parse(body);

    const pattern = await createTaskPattern({
      userId: user.id,
      ...data,
    });

    return NextResponse.json({ pattern }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error creating task pattern:", error);
    return NextResponse.json({ error: "Failed to create pattern" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(request, 'pattern-update', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Pattern ID required" }, { status: 400 });
    }

    const pattern = await updateTaskPattern(id, updates, user.id);
    
    if (!pattern) {
      return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
    }

    return NextResponse.json({ pattern });
  } catch (error) {
    console.error("Error updating task pattern:", error);
    return NextResponse.json({ error: "Failed to update pattern" }, { status: 500 });
  }
}
