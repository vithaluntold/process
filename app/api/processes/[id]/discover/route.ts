import { NextRequest, NextResponse } from "next/server";
import { runAlphaMiner } from "@/server/alpha-miner";
import { generateProcessInsights } from "@/server/ai-insights";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_ANALYSIS_LIMIT } from "@/lib/rate-limiter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'process-discover', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const processId = parseInt(id);
    
    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const result = await runAlphaMiner(processId);
    
    const insights = await generateProcessInsights(processId, {
      activities: result.activities,
      transitions: result.transitions,
      startActivities: result.startActivities,
      endActivities: result.endActivities,
      metadata: result.metadata,
    });

    return NextResponse.json({
      success: true,
      model: result,
      insights,
      message: "Process discovery completed successfully using Alpha Miner algorithm",
    });
  } catch (error: any) {
    console.error("Error in process discovery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to discover process model" },
      { status: 500 }
    );
  }
}
