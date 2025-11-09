import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customKpis, kpiAlerts, processes } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processId = req.nextUrl.searchParams.get("processId");

    if (processId) {
      const userProcess = await db.query.processes.findFirst({
        where: and(
          eq(processes.id, parseInt(processId)),
          eq(processes.userId, user.id)
        ),
      });

      if (!userProcess) {
        return NextResponse.json({ error: "Process not found" }, { status: 404 });
      }

      const kpis = await db
        .select()
        .from(customKpis)
        .where(eq(customKpis.processId, parseInt(processId)))
        .orderBy(desc(customKpis.createdAt));

      return NextResponse.json(kpis);
    } else {
      const kpis = await db
        .select()
        .from(customKpis)
        .where(eq(customKpis.userId, user.id))
        .orderBy(desc(customKpis.createdAt));

      return NextResponse.json(kpis);
    }
  } catch (error) {
    console.error("Failed to fetch KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
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
    const { processId, name, description, formula, threshold } = await req.json();

    if (processId) {
      const userProcess = await db.query.processes.findFirst({
        where: and(
          eq(processes.id, processId),
          eq(processes.userId, user.id)
        ),
      });

      if (!userProcess) {
        return NextResponse.json({ error: "Process not found" }, { status: 404 });
      }
    }

    const [kpi] = await db
      .insert(customKpis)
      .values({
        userId: user.id,
        processId: processId || null,
        name,
        description: description || null,
        metric: formula,
        calculation: formula,
        threshold: threshold || null,
        currentValue: null,
        unit: null,
        status: "active",
        metadata: {},
      })
      .returning();

    return NextResponse.json(kpi);
  } catch (error) {
    console.error("Failed to create KPI:", error);
    return NextResponse.json(
      { error: "Failed to create KPI" },
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
    const { kpiId, currentValue } = await req.json();

    const kpi = await db.query.customKpis.findFirst({
      where: eq(customKpis.id, kpiId),
    });

    if (!kpi || kpi.userId !== user.id) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    const [updatedKpi] = await db
      .update(customKpis)
      .set({ currentValue })
      .where(eq(customKpis.id, kpiId))
      .returning();

    if (kpi.threshold && currentValue > kpi.threshold) {
      await db.insert(kpiAlerts).values({
        kpiId,
        userId: user.id,
        severity: "high",
        message: `KPI "${kpi.name}" exceeded threshold: ${currentValue} > ${kpi.threshold}`,
        metadata: { value: currentValue, threshold: kpi.threshold },
      });
    }

    return NextResponse.json(updatedKpi);
  } catch (error) {
    console.error("Failed to update KPI:", error);
    return NextResponse.json(
      { error: "Failed to update KPI" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { kpiId } = await req.json();

    const kpi = await db.query.customKpis.findFirst({
      where: eq(customKpis.id, kpiId),
    });

    if (!kpi || kpi.userId !== user.id) {
      return NextResponse.json({ error: "KPI not found" }, { status: 404 });
    }

    await db.delete(customKpis).where(eq(customKpis.id, kpiId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete KPI:", error);
    return NextResponse.json(
      { error: "Failed to delete KPI" },
      { status: 500 }
    );
  }
}
