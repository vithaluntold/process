import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server-auth";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("type") as string || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();

    const prompt = `You are a process mining expert specialized in extracting workflow information from documents.

Analyze the following document and extract:
1. Process steps mentioned (list them in order)
2. Timeline or dates mentioned
3. Responsible parties or roles
4. Decision points or approval stages
5. Any bottlenecks or delays mentioned

Document Type: ${documentType}
Document Content:
${text}

Provide the analysis in a structured format with clear sections.`;

    const analysis = await generateAIResponse(prompt);

    const processStepPrompt = `Based on this document analysis, extract just the process steps as a simple numbered list:

${analysis}

Return only the numbered list of process steps, nothing else.`;

    const processSteps = await generateAIResponse(processStepPrompt);

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      documentType,
      analysis,
      extractedSteps: processSteps,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Document parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}
