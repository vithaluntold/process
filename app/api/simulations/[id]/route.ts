import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulationScenarios } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [scenario] = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.id, parseInt(id)));

    if (!scenario) {
      return NextResponse.json(
        { error: "Simulation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error fetching simulation:", error);
    return NextResponse.json(
      { error: "Failed to fetch simulation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'simulation-delete', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    await db
      .delete(simulationScenarios)
      .where(eq(simulationScenarios.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting simulation:", error);
    return NextResponse.json(
      { error: "Failed to delete simulation" },
      { status: 500 }
    );
  }
}
