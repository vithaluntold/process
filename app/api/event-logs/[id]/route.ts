import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/shared/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'event-log-delete', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const eventId = parseInt(id);
    
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
