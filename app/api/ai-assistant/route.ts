import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, eventLogs, aiInsights } from "@/shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { generateAIResponse } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, processId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    let context = "";
    
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

    const prompt = `You are an expert process mining AI assistant. Based on the following process data, answer the user's question:

Context:
${context}

User Question: ${query}

Provide a helpful, concise answer with actionable insights and recommendations.`;

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
