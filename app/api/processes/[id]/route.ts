import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
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
    const processId = parseInt(id);
    
    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const process = await storage.getProcessById(processId, user.id);

    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ process });
  } catch (error) {
    console.error("Error fetching process:", error);
    return NextResponse.json(
      { error: "Failed to fetch process" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'process-update', API_WRITE_LIMIT, user.id);
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
    const { name, description, status } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const process = await storage.updateProcess(processId, updates, user.id);
    
    if (!process) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ process });
  } catch (error) {
    console.error("Error updating process:", error);
    return NextResponse.json(
      { error: "Failed to update process" },
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

    const guardError = withApiGuards(request, 'process-delete', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const { id } = await params;
    const processId = parseInt(id);
    
    if (isNaN(processId)) {
      return NextResponse.json(
        { error: "Invalid process ID" },
        { status: 400 }
      );
    }

    const success = await storage.deleteProcess(processId, user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: "Process deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting process:", error);
    return NextResponse.json(
      { error: "Failed to delete process" },
      { status: 500 }
    );
  }
}
