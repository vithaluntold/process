import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");
    const limit = searchParams.get("limit");

    if (!processId) {
      return NextResponse.json(
        { error: "processId is required" },
        { status: 400 }
      );
    }

    const metrics = await storage.getPerformanceMetrics(
      parseInt(processId),
      limit ? parseInt(limit) : 12
    );

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
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

    const guardError = withApiGuards(request, 'performance-metrics', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: "metrics array is required" },
        { status: 400 }
      );
    }

    const inserted = await storage.createPerformanceMetrics(metrics);

    return NextResponse.json({ 
      message: "Performance metrics created successfully",
      count: inserted.length 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to create performance metrics" },
      { status: 500 }
    );
  }
}
