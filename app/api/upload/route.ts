import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, basename, extname } from "path";
import * as storage from "@/server/storage";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".csv", ".txt"];

function sanitizeFilename(filename: string): string {
  const ext = extname(filename).toLowerCase();
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const processName = formData.get("processName") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    const originalExt = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
      return NextResponse.json(
        { error: `File type ${originalExt} not allowed. Only CSV files are supported.` },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFilename = sanitizeFilename(file.name);
    const filePath = join(UPLOAD_DIR, sanitizedFilename);

    await writeFile(filePath, buffer);

    const document = await storage.createDocument({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      path: filePath,
      status: "uploaded",
    });

    if (originalExt === ".csv") {
      try {
        const process = await storage.createProcess({
          name: processName || file.name.replace(".csv", ""),
          description: `Imported from ${file.name}`,
          source: file.name,
          status: "active",
        });

        const events = await parseCSVFile(buffer.toString());
        
        if (events.length > 0) {
          const validEvents = events.filter((event: any) => {
            const caseId = event.caseId || event.case_id || event.CaseId;
            const activity = event.activity || event.Activity;
            const timestamp = event.timestamp || event.Timestamp;
            return caseId && activity && timestamp;
          });

          if (validEvents.length === 0) {
            throw new Error("No valid events found in CSV. Required columns: caseId, activity, timestamp");
          }

          const eventLogs = validEvents.map((event: any) => ({
            processId: process.id,
            caseId: event.caseId || event.case_id || event.CaseId,
            activity: event.activity || event.Activity,
            timestamp: new Date(event.timestamp || event.Timestamp),
            resource: event.resource || event.Resource || null,
            metadata: event,
          }));

          await storage.insertEventLogs(eventLogs);

          await storage.updateDocument(document.id, {
            status: "processed",
            extractedProcesses: 1,
            activities: new Set(events.map((e: any) => e.activity || e.Activity)).size,
          });

          return NextResponse.json({
            document,
            process,
            eventsImported: eventLogs.length,
          });
        }
      } catch (error) {
        console.error("Error processing CSV:", error);
        await storage.updateDocument(document.id, {
          status: "error",
        });
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

async function parseCSVFile(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(content);

    stream
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}
