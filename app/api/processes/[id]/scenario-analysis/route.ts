import { NextRequest, NextResponse } from "next/server";
import { ScenarioAnalysisService } from "@/server/scenario-analysis";
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

    const guardError = withApiGuards(request, 'scenario-analysis', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const processId = parseInt(id, 10);

    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const service = new ScenarioAnalysisService();
    const analysis = await service.analyzeScenarios(processId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing scenarios:", error);
    return NextResponse.json(
      { error: "Failed to analyze scenarios" },
      { status: 500 }
    );
  }
}
