import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedReports } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT, REPORT_GENERATION_LIMIT } from "@/lib/rate-limiter";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reports = await db
      .select()
      .from(generatedReports)
      .where(eq(generatedReports.userId, user.id))
      .orderBy(desc(generatedReports.createdAt))
      .limit(50);

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(req, 'report-delete', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try{
    const { reportId } = await req.json();

    const report = await db.query.generatedReports.findFirst({
      where: eq(generatedReports.id, reportId),
    });

    if (!report || report.userId !== user.id) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await db.delete(generatedReports).where(eq(generatedReports.id, reportId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
