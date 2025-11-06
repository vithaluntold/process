import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event log ID" },
        { status: 400 }
      );
    }

    const result = await db.delete(schema.eventLogs)
      .where(eq(schema.eventLogs.id, eventId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Event log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Event log deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting event log:", error);
    return NextResponse.json(
      { error: "Failed to delete event log" },
      { status: 500 }
    );
  }
}
