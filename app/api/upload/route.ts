/**
 * File Upload API - Tenant-Safe Implementation
 * 
 * SECURITY: Uses tenant-safe API factory and storage
 * Migration: COMPLETED (v2 - Factory Pattern) - Fixes CSV upload process visibility
 */

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { createTenantSafeHandler } from "@/lib/tenant-api-factory";
import { createProcessForTenant } from "@/server/tenant-storage";
import * as storage from "@/server/storage";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import { sanitizeInput } from "@/lib/validation";
import { withApiGuards } from "@/lib/api-guards";
import { UPLOAD_LIMIT } from "@/lib/rate-limiter";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".csv"];

function sanitizeFilename(filename: string): string {
  const ext = extname(filename).toLowerCase();
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

export const POST = createTenantSafeHandler(async (request, context, params) => {
  const guardError = withApiGuards(request, 'file-upload', UPLOAD_LIMIT);
  if (guardError) return guardError;

  const { userId } = context;

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
    userId,
    name: sanitizeInput(file.name),
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    path: filePath,
    status: "processing",
  });

  if (originalExt === ".csv") {
    try {
      // SECURITY FIX: Use tenant-safe function that automatically sets organizationId
      const process = await createProcessForTenant({
        name: sanitizeInput(processName || file.name.replace(".csv", "")),
        description: `Imported from ${file.name}`,
        source: sanitizeInput(file.name),
        status: "active",
      });
      console.log(`Created process with organizationId:`, process);

      const events = await parseCSVFile(buffer.toString());
      console.log(`Parsed ${events.length} events from CSV`);
      
      if (events.length > 0) {
        const validEvents = events.filter((event: any) => {
          const caseId = event.caseId || event.case_id || event.CaseId;
          const activity = event.activity || event.Activity;
          const timestamp = event.timestamp || event.Timestamp;
          return caseId && activity && timestamp;
        });

        if (validEvents.length === 0) {
          const updatedDoc = await storage.updateDocument(document.id, {
            status: "error",
          });
          return NextResponse.json(
            { 
              error: "No valid events found in CSV. Required columns: caseId, activity, timestamp",
              document: updatedDoc || { ...document, status: "error" }
            },
            { status: 400 }
          );
        }

        const eventLogs = validEvents.map((event: any) => ({
          processId: process.id,
          caseId: event.caseId || event.case_id || event.CaseId,
          activity: event.activity || event.Activity,
          timestamp: new Date(event.timestamp || event.Timestamp),
          resource: event.resource || event.Resource || null,
          metadata: event,
        }));

        console.log(`Inserting ${eventLogs.length} event logs for process ${process.id} in batches`);
        
        const BATCH_SIZE = 500;
        let totalInserted = 0;
        
        for (let i = 0; i < eventLogs.length; i += BATCH_SIZE) {
          const batch = eventLogs.slice(i, i + BATCH_SIZE);
          const inserted = await storage.insertEventLogs(batch);
          totalInserted += inserted.length;
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${inserted.length} events`);
        }
        
        console.log(`Successfully inserted ${totalInserted} event logs in total`);

        const updatedDoc = await storage.updateDocument(document.id, {
          status: "processed",
          extractedProcesses: 1,
          activities: new Set(events.map((e: any) => e.activity || e.Activity)).size,
        });

        return NextResponse.json({
          document: updatedDoc || { ...document, status: "processed" },
          process,
          eventsImported: eventLogs.length,
        });
      } else {
        const updatedDoc = await storage.updateDocument(document.id, {
          status: "error",
        });
        return NextResponse.json(
          { 
            error: "CSV file is empty",
            document: updatedDoc || { ...document, status: "error" }
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error processing CSV:", error);
      const updatedDoc = await storage.updateDocument(document.id, {
        status: "error",
      });
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : "Failed to process CSV",
          document: updatedDoc || { ...document, status: "error" }
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
});

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
