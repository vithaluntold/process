import { NextResponse } from "next/server";
import * as storage from "@/server/storage";

export async function GET() {
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
