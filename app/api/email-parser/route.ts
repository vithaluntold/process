import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
  baseURL: process.env.OPENAI_API_KEY 
    ? "https://api.openai.com/v1"
    : "https://integrations.replit.com/v1/openai",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { emailThread } = await request.json();

    if (!emailThread || typeof emailThread !== "string") {
      return NextResponse.json(
        { error: "Email thread text is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert process mining analyst specializing in extracting structured workflow data from unstructured communications.

Your task is to analyze email threads and extract:
1. Process steps mentioned or implied
2. Timeline and dates
3. Responsible parties (who does what)
4. Decision points and approvals
5. Bottlenecks or delays mentioned
6. Action items and next steps

Return a JSON object with this structure:
{
  "processSteps": [
    {
      "stepName": "string",
      "description": "string",
      "responsible": "string or null",
      "timestamp": "ISO date string or null",
      "duration": "estimated duration string or null",
      "status": "completed|pending|blocked"
    }
  ],
  "timeline": [
    {
      "date": "ISO date string",
      "event": "string",
      "actor": "string or null"
    }
  ],
  "bottlenecks": [
    {
      "issue": "string",
      "impact": "string",
      "mentionedBy": "string or null"
    }
  ],
  "decisionPoints": [
    {
      "decision": "string",
      "decisionMaker": "string or null",
      "status": "approved|pending|rejected|unclear"
    }
  ],
  "actionItems": [
    {
      "task": "string",
      "assignedTo": "string or null",
      "dueDate": "ISO date string or null",
      "priority": "high|medium|low"
    }
  ],
  "insights": "string - brief summary of what this email thread reveals about the process"
}`,
        },
        {
          role: "user",
          content: `Analyze this email thread and extract process workflow information:\n\n${emailThread}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error parsing email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse email thread" },
      { status: 500 }
    );
  }
}
