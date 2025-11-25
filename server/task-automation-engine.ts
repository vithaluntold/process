import OpenAI from "openai";
import pRetry from "p-retry";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key-for-build",
    });
  }
  return _openai;
}

interface TaskPattern {
  id: number;
  patternName: string;
  description?: string | null;
  frequency: number;
  avgDuration?: number | null;
  steps: any;
  automationPotential: number;
}

interface AutomationRecommendation {
  name: string;
  description: string;
  automationType: "rpa" | "macro" | "script" | "workflow";
  script?: string;
  configuration: any;
  estimatedSavings: number;
  implementationComplexity: "low" | "medium" | "high";
  aiRationale: string;
}

export async function generateAutomationRecommendations(
  pattern: TaskPattern
): Promise<AutomationRecommendation[]> {
  if (pattern.automationPotential < 0.3) {
    return [];
  }

  try {
    const recommendations = await analyzeWithAI(pattern);
    return recommendations;
  } catch (error) {
    console.error("Automation generation failed:", error);
    return [];
  }
}

async function analyzeWithAI(pattern: TaskPattern): Promise<AutomationRecommendation[]> {
  const steps = Array.isArray(pattern.steps) ? pattern.steps : [];
  
  const prompt = `
Analyze this repetitive task pattern and generate automation recommendations:

Pattern: ${pattern.patternName}
Description: ${pattern.description || "N/A"}
Frequency: ${pattern.frequency} occurrences
Average Duration: ${pattern.avgDuration || 0} seconds
Automation Potential: ${(pattern.automationPotential * 100).toFixed(0)}%

Steps:
${steps.map((step: any, i: number) => 
  `${i + 1}. ${step.activityType || step.action} in ${step.application || 'Unknown'}`
).join('\n')}

Generate 1-3 automation recommendations. For each recommendation provide:
{
  "recommendations": [
    {
      "name": "Short automation name",
      "description": "What this automation does",
      "automationType": "rpa" | "macro" | "script" | "workflow",
      "pseudocode": "Step-by-step automation logic in plain language",
      "estimatedSavings": minutes saved per week,
      "implementationComplexity": "low" | "medium" | "high",
      "aiRationale": "Why this automation approach is recommended"
    }
  ]
}`;

  try {
    const analysis = await pRetry(
      async () => {
        const completion = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an RPA and automation expert. Generate practical automation recommendations for repetitive tasks. Focus on feasibility and ROI.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0]?.message?.content || "{}");
      },
      {
        retries: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
          console.warn(`AI automation attempt ${error.attemptNumber} failed`);
        },
      }
    );

    const recs = analysis.recommendations || [];
    
    return recs.map((rec: any) => ({
      name: rec.name || `Automate ${pattern.patternName}`,
      description: rec.description || "Automation recommendation",
      automationType: rec.automationType || "script",
      script: rec.pseudocode || rec.script,
      configuration: {
        targetApplications: steps.map((s: any) => s.application).filter(Boolean),
        estimatedDuration: pattern.avgDuration,
        requiredTools: determineRequiredTools(rec.automationType),
      },
      estimatedSavings: rec.estimatedSavings || calculateSavings(pattern),
      implementationComplexity: rec.implementationComplexity || "medium",
      aiRationale: rec.aiRationale || "Automation recommended based on repetition frequency",
    }));
  } catch (error) {
    console.error("AI automation analysis failed:", error);
    return [];
  }
}

function calculateSavings(pattern: TaskPattern): number {
  const timePerOccurrence = (pattern.avgDuration || 60) / 60;
  const savingsPerWeek = timePerOccurrence * pattern.frequency * 7;
  return Math.round(savingsPerWeek);
}

function determineRequiredTools(automationType: string): string[] {
  switch (automationType) {
    case "rpa":
      return ["UiPath", "Automation Anywhere", "Blue Prism"];
    case "macro":
      return ["AutoHotkey", "Keyboard Maestro", "Power Automate"];
    case "script":
      return ["Python", "JavaScript", "PowerShell"];
    case "workflow":
      return ["Zapier", "Make", "n8n"];
    default:
      return [];
  }
}

export async function generateRPAScript(
  pattern: TaskPattern,
  scriptType: "python" | "javascript" | "pseudocode" = "pseudocode"
): Promise<string> {
  const steps = Array.isArray(pattern.steps) ? pattern.steps : [];
  
  const prompt = `
Generate a ${scriptType} automation script for this task:

Pattern: ${pattern.patternName}
Steps:
${steps.map((step: any, i: number) => 
  `${i + 1}. ${step.action} in ${step.application || 'Unknown'}`
).join('\n')}

Provide a ${scriptType} script with comments explaining each step.
Include error handling and make it production-ready.`;

  try {
    const script = await pRetry(
      async () => {
        const completion = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert automation engineer. Generate clean, well-commented ${scriptType} code for RPA tasks.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        });

        return completion.choices[0]?.message?.content || "";
      },
      {
        retries: 2,
        minTimeout: 1000,
      }
    );

    return script;
  } catch (error) {
    console.error("Script generation failed:", error);
    return `# Error generating script: ${error}`;
  }
}
