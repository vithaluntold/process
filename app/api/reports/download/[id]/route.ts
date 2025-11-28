import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedReports, processes, eventLogs, performanceMetrics } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { generatePDFReport, generateExcelReport, generatePowerPointReport } from "@/lib/report-generators";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    const report = await db.query.generatedReports.findFirst({
      where: and(
        eq(generatedReports.id, reportId),
        eq(generatedReports.userId, user.id)
      ),
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const reportData = report.metadata as any;
    reportData.title = report.title;

    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (report.format) {
      case "pdf":
        buffer = await generatePDFReport(reportData);
        contentType = "application/pdf";
        extension = "pdf";
        break;
      case "excel":
        buffer = await generateExcelReport(reportData);
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        extension = "xlsx";
        break;
      case "powerpoint":
        buffer = await generatePowerPointReport(reportData);
        contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        extension = "pptx";
        break;
      default:
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }

    const filename = `${report.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate report file:", error);
    return NextResponse.json(
      { error: "Failed to generate report file" },
      { status: 500 }
    );
  }
}
