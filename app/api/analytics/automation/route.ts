import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get("processId");

    if (!processId) {
      return NextResponse.json(
        { error: "processId is required" },
        { status: 400 }
      );
    }

    const opportunities = await storage.getAutomationOpportunities(parseInt(processId));
    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("Error fetching automation opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, opportunities } = body;

    if (!processId || !opportunities || !Array.isArray(opportunities)) {
      return NextResponse.json(
        { error: "processId and opportunities array are required" },
        { status: 400 }
      );
    }

    const inserted = await storage.createAutomationOpportunities(
      parseInt(processId),
      opportunities
    );

    return NextResponse.json({ 
      message: "Automation opportunities created successfully",
      count: inserted.length 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating automation opportunities:", error);
    return NextResponse.json(
      { error: "Failed to create automation opportunities" },
      { status: 500 }
    );
  }
}
