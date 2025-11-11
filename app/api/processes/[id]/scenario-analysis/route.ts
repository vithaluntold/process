import { NextRequest, NextResponse } from "next/server";
import { ScenarioAnalysisService } from "@/server/scenario-analysis";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
