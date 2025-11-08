import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { simulationScenarios } from "@/shared/schema";
import { eq } from "drizzle-orm";
import { createAndRunScenario } from "@/server/simulation-engine";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { processId, name, description, parameters } = body;

    if (!processId || !name || !parameters) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const scenarioId = await createAndRunScenario(
      processId,
      name,
      description,
      parameters
    );

    const [scenario] = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.id, scenarioId));

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error creating simulation:", error);
    return NextResponse.json(
      { error: "Failed to create simulation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (!processId) {
      return NextResponse.json(
        { error: "Missing processId parameter" },
        { status: 400 }
      );
    }

    const scenarios = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.processId, parseInt(processId)));

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error fetching simulations:", error);
    return NextResponse.json(
      { error: "Failed to fetch simulations" },
      { status: 500 }
    );
  }
}
