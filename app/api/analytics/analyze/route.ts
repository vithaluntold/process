import { NextRequest, NextResponse } from "next/server";
import { analyzeProcessPerformance } from "@/server/performance-analytics";

export async function POST(request: NextRequest) {
  try {
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
