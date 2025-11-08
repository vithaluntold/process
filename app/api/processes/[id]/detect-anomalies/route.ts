import { NextRequest, NextResponse } from "next/server";
import { AnomalyDetector } from "@/server/anomaly-detector";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const processId = parseInt(id, 10);

    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const detector = new AnomalyDetector();
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
