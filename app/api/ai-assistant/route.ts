import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, eventLogs, aiInsights } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { generateAIResponse } from "@/lib/ai";
import { getEnhancedSystemPrompt, getBerkadiaContext } from "@/server/ai-knowledge-base";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, processId, domain } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    let context = "";
    let domainContext = "";
    
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

      const logs = await db
        .select()
        .from(eventLogs)
        .where(eq(eventLogs.processId, processId))
        .limit(100);

      context = `Process: ${userProcess.name}
Description: ${userProcess.description || "N/A"}
Total Events: ${logs.length}
Unique Cases: ${new Set(logs.map(l => l.caseId)).size}
Activities: ${new Set(logs.map(l => l.activity)).size}`;
    } else {
      const userProcesses = await db
        .select()
        .from(processes)
        .where(eq(processes.userId, user.id))
        .limit(10);

      context = `Total Processes: ${userProcesses.length}
Process Names: ${userProcesses.map(p => p.name).join(", ")}`;
    }

    if (domain === "berkadia") {
      domainContext = getBerkadiaContext();
    }

    let basePrompt = `You are an expert process mining AI assistant specializing in business process optimization and automation.`;

    if (domainContext) {
      basePrompt = `${basePrompt}

${domainContext}

Use this domain knowledge to provide context-aware insights and recommendations.`;
    }

    const prompt = `${basePrompt}

Process Data Context:
${context}

User Question: ${query}

Provide a helpful, concise answer with actionable insights and specific recommendations. If relevant, reference industry benchmarks, common pain points, and ROI estimates from the domain knowledge above.`;

    const response = await generateAIResponse(prompt);

    return NextResponse.json({
      query,
      response,
      processId: processId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
