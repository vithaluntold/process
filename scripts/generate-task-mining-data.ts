import { db } from "@/lib/db";
import { 
  createTaskSession, 
  insertUserActivities, 
  insertApplicationUsage,
  createTaskPattern,
  createTaskAutomation
} from "@/server/task-mining-storage";

interface DemoUser {
  id: number;
  email: string;
  firstName: string;
}

const APPLICATIONS = [
  { name: "Microsoft Excel", category: "Productivity" },
  { name: "SAP", category: "ERP" },
  { name: "Salesforce", category: "CRM" },
  { name: "Outlook", category: "Email" },
  { name: "Chrome", category: "Browser" },
  { name: "Slack", category: "Communication" },
  { name: "Jira", category: "Project Management" },
  { name: "Visual Studio Code", category: "Development" },
  { name: "Adobe Acrobat", category: "Document" },
  { name: "PowerPoint", category: "Productivity" },
];

const ACTIVITY_TEMPLATES = {
  dataEntry: [
    { activityType: "click", action: "open_application", application: "Microsoft Excel" },
    { activityType: "click", action: "select_cell", application: "Microsoft Excel" },
    { activityType: "keyboard", action: "type_data", application: "Microsoft Excel" },
    { activityType: "keyboard", action: "press_tab", application: "Microsoft Excel" },
    { activityType: "keyboard", action: "type_data", application: "Microsoft Excel" },
    { activityType: "click", action: "save_file", application: "Microsoft Excel" },
  ],
  emailProcessing: [
    { activityType: "click", action: "open_application", application: "Outlook" },
    { activityType: "click", action: "select_email", application: "Outlook" },
    { activityType: "keyboard", action: "read_email", application: "Outlook" },
    { activityType: "click", action: "open_attachment", application: "Outlook" },
    { activityType: "keyboard", action: "copy_text", application: "Adobe Acrobat" },
    { activityType: "click", action: "switch_application", application: "SAP" },
    { activityType: "keyboard", action: "paste_data", application: "SAP" },
    { activityType: "click", action: "submit_form", application: "SAP" },
  ],
  reportGeneration: [
    { activityType: "click", action: "open_application", application: "SAP" },
    { activityType: "click", action: "navigate_to_reports", application: "SAP" },
    { activityType: "keyboard", action: "enter_date_range", application: "SAP" },
    { activityType: "click", action: "export_data", application: "SAP" },
    { activityType: "click", action: "open_file", application: "Microsoft Excel" },
    { activityType: "keyboard", action: "format_data", application: "Microsoft Excel" },
    { activityType: "click", action: "create_chart", application: "Microsoft Excel" },
    { activityType: "click", action: "save_report", application: "Microsoft Excel" },
  ],
  crmUpdate: [
    { activityType: "click", action: "open_application", application: "Salesforce" },
    { activityType: "keyboard", action: "search_contact", application: "Salesforce" },
    { activityType: "click", action: "open_contact", application: "Salesforce" },
    { activityType: "keyboard", action: "update_field", application: "Salesforce" },
    { activityType: "click", action: "add_note", application: "Salesforce" },
    { activityType: "keyboard", action: "type_note", application: "Salesforce" },
    { activityType: "click", action: "save_changes", application: "Salesforce" },
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTimestamp(baseTime: Date, offsetMs: number): Date {
  return new Date(baseTime.getTime() + offsetMs);
}

async function generateSessionActivities(
  sessionId: number,
  startTime: Date,
  patternType: keyof typeof ACTIVITY_TEMPLATES,
  repetitions: number
) {
  const template = ACTIVITY_TEMPLATES[patternType];
  const activities = [];
  let currentTime = new Date(startTime);

  for (let rep = 0; rep < repetitions; rep++) {
    for (const step of template) {
      const duration = randomInt(2000, 15000);
      
      activities.push({
        sessionId,
        activityType: step.activityType,
        application: step.application,
        windowTitle: `${step.application} - Main Window`,
        action: step.action,
        targetElement: `button_${step.action}`,
        timestamp: new Date(currentTime),
        duration,
        metadata: {
          repetition: rep + 1,
          patternType,
        },
      });

      currentTime = new Date(currentTime.getTime() + duration + randomInt(500, 2000));
    }

    const breakTime = randomInt(10000, 30000);
    currentTime = new Date(currentTime.getTime() + breakTime);
  }

  return activities;
}

async function generateDemoData(userId: number) {
  console.log(`Generating task mining demo data for user ${userId}...`);

  const sessions = [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  for (let day = 0; day < 7; day++) {
    const sessionDate = new Date(threeDaysAgo.getTime() + day * 24 * 60 * 60 * 1000);
    const sessionsPerDay = randomInt(2, 4);

    for (let sessionNum = 0; sessionNum < sessionsPerDay; sessionNum++) {
      const startHour = randomInt(9, 16);
      const startTime = new Date(sessionDate);
      startTime.setHours(startHour, randomInt(0, 59), 0, 0);

      const deviceType = randomChoice(["Desktop", "Laptop"]);
      const osType = randomChoice(["Windows 11", "macOS", "Windows 10"]);
      
      const session = await createTaskSession({
        userId,
        sessionName: `Work Session ${day + 1}-${sessionNum + 1}`,
        startTime,
        deviceType,
        osType,
        status: "active",
        privacyConsent: true,
      });

      console.log(`Created session ${session.id}`);
      sessions.push(session);

      const patternTypes = Object.keys(ACTIVITY_TEMPLATES) as (keyof typeof ACTIVITY_TEMPLATES)[];
      const selectedPattern = randomChoice(patternTypes);
      const repetitions = randomInt(3, 8);

      const activities = await generateSessionActivities(
        session.id,
        startTime,
        selectedPattern,
        repetitions
      );

      if (activities.length > 0) {
        await insertUserActivities(activities);
        console.log(`  Generated ${activities.length} activities`);
      }

      const appUsage = APPLICATIONS.map((app) => ({
        userId,
        sessionId: session.id,
        applicationName: app.name,
        category: app.category,
        timeSpent: randomInt(60, 1800),
        interactions: randomInt(10, 100),
        productivityScore: randomInt(60, 95) / 100,
        date: sessionDate,
      }));

      await insertApplicationUsage(appUsage);
    }
  }

  const patterns = [
    {
      patternName: "Daily Data Entry Routine",
      description: "Repetitive data entry from emails into SAP system",
      frequency: 45,
      avgDuration: 180,
      steps: ACTIVITY_TEMPLATES.dataEntry,
      automationPotential: 0.85,
      timeSavingsEstimate: 120,
      lastOccurrence: now,
      status: "identified",
    },
    {
      patternName: "Weekly Report Generation",
      description: "Extract SAP data and create formatted Excel reports",
      frequency: 12,
      avgDuration: 420,
      steps: ACTIVITY_TEMPLATES.reportGeneration,
      automationPotential: 0.92,
      timeSavingsEstimate: 80,
      lastOccurrence: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "validated",
    },
    {
      patternName: "CRM Contact Update Process",
      description: "Update Salesforce contacts after customer calls",
      frequency: 28,
      avgDuration: 120,
      steps: ACTIVITY_TEMPLATES.crmUpdate,
      automationPotential: 0.75,
      timeSavingsEstimate: 50,
      lastOccurrence: now,
      status: "identified",
    },
  ];

  for (const patternData of patterns) {
    const pattern = await createTaskPattern({
      userId,
      ...patternData,
    });

    console.log(`Created pattern: ${pattern.patternName}`);

    if (patternData.automationPotential > 0.7) {
      const automation = await createTaskAutomation({
        patternId: pattern.id,
        userId,
        name: `Automate ${patternData.patternName}`,
        description: `RPA bot to handle ${patternData.patternName.toLowerCase()}`,
        automationType: patternData.patternName.includes("Data Entry") ? "rpa" : "script",
        script: generateSampleScript(patternData.patternName),
        estimatedSavings: patternData.timeSavingsEstimate,
        status: "recommended",
      });

      console.log(`  Created automation recommendation: ${automation.name}`);
    }
  }

  console.log("\nDemo task mining data generation complete!");
  console.log(`- ${sessions.length} sessions created`);
  console.log(`- ${patterns.length} patterns identified`);
  console.log(`- Application usage tracked across ${APPLICATIONS.length} apps`);
}

function generateSampleScript(patternName: string): string {
  return `# RPA Script: ${patternName}
# Generated by EPI X-Ray Task Mining

1. Monitor for trigger event (email arrival / scheduled time)
2. Extract relevant data from source application
3. Navigate to target application
4. Input data using recorded keystrokes
5. Validate data entry
6. Save and confirm changes
7. Log completion and send notification

# Estimated time savings: 80% reduction in manual effort
# Implementation: UiPath, Power Automate, or Python automation`;
}

async function main() {
  const demoUserId = 1;
  
  console.log("Starting task mining demo data generation...");
  
  try {
    await generateDemoData(demoUserId);
    console.log("\n✅ Successfully generated task mining demo data!");
  } catch (error) {
    console.error("❌ Error generating demo data:", error);
    process.exit(1);
  }
}

main();
