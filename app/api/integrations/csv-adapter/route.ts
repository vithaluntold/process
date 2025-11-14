import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { insertEventLogs } from "@/server/storage";
import { z } from "zod";
import { withApiGuards } from "@/lib/api-guards";
import { UPLOAD_LIMIT } from "@/lib/rate-limiter";

const csvAdapterSchema = z.object({
  data: z.array(z.record(z.string(), z.any())),
  processId: z.number(),
  sourceSystem: z.enum(["salesforce", "excel", "mainframe", "email", "other"]),
  mapping: z.object({
    caseId: z.string(),
    activity: z.string(),
    timestamp: z.string(),
    resource: z.string().optional(),
    status: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guardError = withApiGuards(req, 'csv-import', UPLOAD_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await req.json();
    const { data, processId, sourceSystem, mapping } = csvAdapterSchema.parse(body);

    const eventLogs = [];

    for (const row of data) {
      const caseId = row[mapping.caseId]?.toString() || "";
      const activity = row[mapping.activity]?.toString() || "";
      const timestampStr = row[mapping.timestamp]?.toString() || "";
      const resource = mapping.resource ? row[mapping.resource]?.toString() : "";
      const status = mapping.status ? row[mapping.status]?.toString() : "";

      if (!caseId || !activity || !timestampStr) {
        continue;
      }

      let timestamp: Date;
      try {
        timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          continue;
        }
      } catch {
        continue;
      }

      const metadata: Record<string, any> = {
        sourceSystem,
        originalData: row,
      };

      if (status) {
        metadata.status = status;
      }

      eventLogs.push({
        processId,
        caseId,
        activity,
        timestamp,
        resource: resource || `${sourceSystem}-system`,
        metadata,
      });
    }

    if (eventLogs.length === 0) {
      return NextResponse.json(
        { error: "No valid event logs found in data" },
        { status: 400 }
      );
    }

    const insertedLogs = await insertEventLogs(eventLogs);

    return NextResponse.json({
      success: true,
      imported: insertedLogs.length,
      sourceSystem,
      processId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error importing CSV data:", error);
    return NextResponse.json(
      { error: "Failed to import CSV data" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      supportedSystems: ["salesforce", "excel", "mainframe", "email", "other"],
      requiredFields: ["caseId", "activity", "timestamp"],
      optionalFields: ["resource", "status"],
      examples: [
        {
          system: "salesforce",
          mapping: {
            caseId: "Lead_ID",
            activity: "Activity",
            timestamp: "Timestamp",
            resource: "User",
            status: "Status",
          },
        },
        {
          system: "excel",
          mapping: {
            caseId: "Loan_ID",
            activity: "Activity",
            timestamp: "Timestamp",
            resource: "User",
            status: "Status",
          },
        },
      ],
    });
  } catch (error) {
    console.error("Error getting adapter info:", error);
    return NextResponse.json(
      { error: "Failed to get adapter info" },
      { status: 500 }
    );
  }
}
