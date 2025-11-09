import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processAlerts, processes } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = req.nextUrl.searchParams.get("status") || "active";

    const alerts = await db
      .select()
      .from(processAlerts)
      .where(
        and(
          eq(processAlerts.userId, user.id),
          eq(processAlerts.status, status)
        )
      )
      .orderBy(desc(processAlerts.createdAt))
      .limit(50);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { processId, type, severity, message, metadata } = await req.json();

    const userProcess = await db.query.processes.findFirst({
      where: and(
        eq(processes.id, processId),
        eq(processes.userId, user.id)
      ),
    });

    if (!userProcess) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    const [alert] = await db
      .insert(processAlerts)
      .values({
        processId,
        userId: user.id,
        type,
        severity,
        message,
        status: "active",
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { alertId, status } = await req.json();

    const existingAlert = await db.query.processAlerts.findFirst({
      where: and(
        eq(processAlerts.id, alertId),
        eq(processAlerts.userId, user.id)
      ),
    });

    if (!existingAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(processAlerts)
      .set({
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
      })
      .where(eq(processAlerts.id, alertId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
