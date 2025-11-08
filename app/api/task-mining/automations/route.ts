import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { getTaskAutomations, createTaskAutomation, updateTaskAutomation } from "@/server/task-mining-storage";
import { z } from "zod";

const createAutomationSchema = z.object({
  patternId: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  automationType: z.enum(["rpa", "macro", "script", "workflow"]),
  script: z.string().optional(),
  configuration: z.any().optional(),
  estimatedSavings: z.number().optional(),
  status: z.enum(["recommended", "approved", "implemented", "rejected"]).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const automations = await getTaskAutomations(user.id);
    return NextResponse.json({ automations });
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createAutomationSchema.parse(body);

    const automation = await createTaskAutomation({
      userId: user.id,
      ...data,
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Error creating automation:", error);
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "Automation ID required" }, { status: 400 });
    }

    const automation = await updateTaskAutomation(id, updates, user.id);
    
    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({ automation });
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
  }
}
