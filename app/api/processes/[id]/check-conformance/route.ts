import { NextRequest, NextResponse } from "next/server";
import { performConformanceCheck } from "@/server/conformance-checker";
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

    const guardError = withApiGuards(request, 'conformance-check', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const processId = parseInt(id);

    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const modelId = body.modelId ? parseInt(body.modelId) : undefined;

    const { results, summary } = await performConformanceCheck(processId, modelId);

    return NextResponse.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    console.error("Conformance checking error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform conformance checking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
