import { NextRequest, NextResponse } from "next/server";
import * as storage from "@/server/storage";
import { getCurrentUser } from "@/lib/server-auth";
import { withApiGuards } from "@/lib/api-guards";
import { API_WRITE_LIMIT } from "@/lib/rate-limiter";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documents = await storage.getDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guardError = withApiGuards(req, 'document-delete', API_WRITE_LIMIT, user.id);
  if (guardError) return guardError;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const document = await storage.getDocumentById(parseInt(id), user.id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    try {
      const filePath = path.join(process.cwd(), document.path);
      await unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
    }

    await storage.deleteDocument(parseInt(id), user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
