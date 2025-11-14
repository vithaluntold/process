import { NextRequest, NextResponse } from "next/server";
import { AnomalyDetector } from "@/server/anomaly-detector";
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

    const guardError = withApiGuards(request, 'anomaly-detection', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const processId = parseInt(id, 10);

    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const detector = new AnomalyDetector(user.id);
    const report = await detector.detectAnomalies(processId);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error detecting anomalies:", error);
    return NextResponse.json(
      { error: "Failed to detect anomalies" },
      { status: 500 }
    );
  }
}
