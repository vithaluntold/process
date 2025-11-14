import { NextRequest, NextResponse } from "next/server";
import { getDeviations } from "@/server/storage";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const processIdParam = searchParams.get("processId");

    if (!processIdParam) {
      return NextResponse.json(
        { error: "processId is required" },
        { status: 400 }
      );
    }

    const processId = parseInt(processIdParam);
    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "processId must be a valid number" },
        { status: 400 }
      );
    }

    const deviations = await getDeviations(processId);
    
    return NextResponse.json({ deviations });
  } catch (error) {
    console.error("Error fetching deviations:", error);
    return NextResponse.json(
      { error: "Failed to fetch deviations" },
      { status: 500 }
    );
  }
}
