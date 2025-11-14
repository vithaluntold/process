import { NextRequest, NextResponse } from "next/server";
import { analyzeProcessPerformance } from "@/server/performance-analytics";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_ANALYSIS_LIMIT } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'analytics-analyze', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { processId } = body;

    if (!processId) {
      return NextResponse.json(
        { error: "Process ID is required" },
        { status: 400 }
      );
    }

    const metrics = await analyzeProcessPerformance(parseInt(processId));

    return NextResponse.json({
      success: true,
      metrics,
      message: "Performance analysis completed successfully",
    });
  } catch (error: any) {
    console.error("Error analyzing process performance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze process performance" },
      { status: 500 }
    );
  }
}
