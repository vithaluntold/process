import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";

export async function GET(request: NextRequest) {
  try {
    const processes = await storage.getProcesses();
    return NextResponse.json({ processes });
  } catch (error) {
    console.error("Error fetching processes:", error);
    return NextResponse.json(
      { error: "Failed to fetch processes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, source } = body;

    if (!name || !source) {
      return NextResponse.json(
        { error: "Name and source are required" },
        { status: 400 }
      );
    }

    const process = await storage.createProcess({
      name,
      description,
      source,
      status: "active",
    });

    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Failed to create process" },
      { status: 500 }
    );
  }
}
