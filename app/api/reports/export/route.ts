import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedReports, processes, eventLogs } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const processId = req.nextUrl.searchParams.get("processId");
    const format = req.nextUrl.searchParams.get("format") || "csv";

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

    const logs = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, parseInt(processId)));

    if (format === "csv") {
      const csvContent = convertToCSV(logs);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${userProcess.name}_export.csv"`,
        },
      });
    } else if (format === "json") {
      return NextResponse.json(logs, {
        headers: {
          "Content-Disposition": `attachment; filename="${userProcess.name}_export.json"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Failed to export data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = ["caseId", "activity", "timestamp", "resource"];
  const rows = data.map(row => [
    row.caseId,
    row.activity,
    row.timestamp,
    row.resource || ""
  ]);

  const csvRows = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ];

  return csvRows.join("\n");
}
