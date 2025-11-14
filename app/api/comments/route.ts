import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processComments, processes } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processId = req.nextUrl.searchParams.get("processId");

    if (!processId) {
      return NextResponse.json({ error: "Process ID required" }, { status: 400 });
    }

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, parseInt(processId)),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const comments = await db
      .select()
      .from(processComments)
      .where(eq(processComments.processId, parseInt(processId)))
      .orderBy(desc(processComments.createdAt));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(req, 'comment-create', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const { processId, content, type } = await req.json();

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, processId),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const [comment] = await db
      .insert(processComments)
      .values({
        processId,
        userId: user.id,
        content,
        status: "active",
      })
      .returning();

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(req, 'comment-delete', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const { commentId } = await req.json();

    const comment = await db.query.processComments.findFirst({
      where: eq(processComments.id, commentId),
    });

    if (!comment || comment.userId !== user.id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await db.delete(processComments).where(eq(processComments.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
