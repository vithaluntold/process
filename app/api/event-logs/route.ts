import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processId, events } = body;

    if (!processId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "processId and events array are required" },
        { status: 400 }
      );
    }

    const eventLogs = events.map((event: any) => ({
      processId,
      caseId: event.caseId,
      activity: event.activity,
      timestamp: new Date(event.timestamp),
      resource: event.resource,
      metadata: event.metadata,
    }));

    const inserted = await storage.insertEventLogs(eventLogs);

    return NextResponse.json({ 
      message: "Event logs inserted successfully",
      count: inserted.length 
    }, { status: 201 });
  } catch (error) {
    console.error("Error inserting event logs:", error);
    return NextResponse.json(
      { error: "Failed to insert event logs" },
      { status: 500 }
    );
  }
}

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

    const events = await storage.getEventLogsByProcess(parseInt(processId));
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching event logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch event logs" },
      { status: 500 }
    );
  }
}
