export interface GeneratedEvent {
  caseId: string;
  activity: string;
  timestamp: Date;
  resource?: string;
}

export function generateOrderProcessEvents(numCases: number = 100): GeneratedEvent[] {
  const events: GeneratedEvent[] = [];
  const activities = [
    "Order Received",
    "Verify Order",
    "Check Inventory",
    "Payment Processing",
    "Order Confirmation",
    "Pick Items",
    "Pack Items",
    "Quality Check",
    "Ship Order",
    "Delivery Confirmation"
  ];
  
  const resources = ["System", "John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Mike Brown"];
  
  for (let i = 1; i <= numCases; i++) {
    const caseId = `ORDER-${String(i).padStart(6, '0')}`;
    let currentTime = new Date(2024, 0, 1 + Math.random() * 60);
    
    const skipInventory = Math.random() > 0.85;
    const multiplePaymentAttempts = Math.random() > 0.90;
    const hasQualityIssue = Math.random() > 0.92;
    
    events.push({ caseId, activity: "Order Received", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (5 + Math.random() * 15) * 60 * 1000);
    
    events.push({ caseId, activity: "Verify Order", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
    currentTime = new Date(currentTime.getTime() + (10 + Math.random() * 20) * 60 * 1000);
    
    if (!skipInventory) {
      events.push({ caseId, activity: "Check Inventory", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
      currentTime = new Date(currentTime.getTime() + (5 + Math.random() * 10) * 60 * 1000);
    }
    
    events.push({ caseId, activity: "Payment Processing", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (2 + Math.random() * 5) * 60 * 1000);
    
    if (multiplePaymentAttempts) {
      events.push({ caseId, activity: "Payment Processing", timestamp: new Date(currentTime), resource: "System" });
      currentTime = new Date(currentTime.getTime() + (2 + Math.random() * 5) * 60 * 1000);
      
      events.push({ caseId, activity: "Payment Processing", timestamp: new Date(currentTime), resource: "System" });
      currentTime = new Date(currentTime.getTime() + (2 + Math.random() * 5) * 60 * 1000);
    }
    
    events.push({ caseId, activity: "Order Confirmation", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (30 + Math.random() * 90) * 60 * 1000);
    
    events.push({ caseId, activity: "Pick Items", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
    currentTime = new Date(currentTime.getTime() + (15 + Math.random() * 30) * 60 * 1000);
    
    events.push({ caseId, activity: "Pack Items", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
    currentTime = new Date(currentTime.getTime() + (10 + Math.random() * 20) * 60 * 1000);
    
    events.push({ caseId, activity: "Quality Check", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
    currentTime = new Date(currentTime.getTime() + (5 + Math.random() * 10) * 60 * 1000);
    
    if (hasQualityIssue) {
      events.push({ caseId, activity: "Pack Items", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
      currentTime = new Date(currentTime.getTime() + (10 + Math.random() * 20) * 60 * 1000);
      
      events.push({ caseId, activity: "Quality Check", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 4)] });
      currentTime = new Date(currentTime.getTime() + (5 + Math.random() * 10) * 60 * 1000);
    }
    
    events.push({ caseId, activity: "Ship Order", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 3) * 24 * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Delivery Confirmation", timestamp: new Date(currentTime), resource: "System" });
  }
  
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function generateInvoiceProcessEvents(numCases: number = 50): GeneratedEvent[] {
  const events: GeneratedEvent[] = [];
  const activities = [
    "Invoice Received",
    "Data Entry",
    "Validation",
    "Approval Request",
    "Manager Approval",
    "Payment Scheduling",
    "Payment Execution",
    "Confirmation"
  ];
  
  const resources = ["System", "Accountant A", "Accountant B", "Manager 1", "Manager 2", "Finance System"];
  
  for (let i = 1; i <= numCases; i++) {
    const caseId = `INV-${String(i).padStart(5, '0')}`;
    let currentTime = new Date(2024, 0, 1 + Math.random() * 60);
    
    const needsCorrection = Math.random() > 0.88;
    const escalation = Math.random() > 0.95;
    
    events.push({ caseId, activity: "Invoice Received", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (2 + Math.random() * 8) * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Data Entry", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 2)] });
    currentTime = new Date(currentTime.getTime() + (15 + Math.random() * 45) * 60 * 1000);
    
    events.push({ caseId, activity: "Validation", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 3) * 60 * 1000);
    
    if (needsCorrection) {
      events.push({ caseId, activity: "Data Entry", timestamp: new Date(currentTime), resource: resources[1 + Math.floor(Math.random() * 2)] });
      currentTime = new Date(currentTime.getTime() + (10 + Math.random() * 30) * 60 * 1000);
      
      events.push({ caseId, activity: "Validation", timestamp: new Date(currentTime), resource: "System" });
      currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 3) * 60 * 1000);
    }
    
    events.push({ caseId, activity: "Approval Request", timestamp: new Date(currentTime), resource: "System" });
    currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 24) * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Manager Approval", timestamp: new Date(currentTime), resource: resources[3 + Math.floor(Math.random() * 2)] });
    currentTime = new Date(currentTime.getTime() + (2 + Math.random() * 12) * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Payment Scheduling", timestamp: new Date(currentTime), resource: "Finance System" });
    currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 7) * 24 * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Payment Execution", timestamp: new Date(currentTime), resource: "Finance System" });
    currentTime = new Date(currentTime.getTime() + (1 + Math.random() * 2) * 60 * 60 * 1000);
    
    events.push({ caseId, activity: "Confirmation", timestamp: new Date(currentTime), resource: "System" });
  }
  
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// NEW FEATURE TEST DATA GENERATORS

export interface GeneratedComment {
  content: string;
  author: string;
  timestamp: Date;
  isReply?: boolean;
}

export function generateProcessComments(numComments: number = 10): GeneratedComment[] {
  const comments: GeneratedComment[] = [];
  const commentTemplates = [
    "Found a major bottleneck in {activity} - taking {x}x longer than expected. Can we investigate?",
    "Great progress! After implementing the changes, we've reduced cycle time by {x}%.",
    "Noticed {x} cases are deviating from the standard process. Should we update training?",
    "The automation opportunity in {activity} looks promising. ROI analysis shows ${x}K savings.",
    "Meeting compliance requirements will need adjustments to {activity} workflow.",
    "Resource utilization in {activity} is at {x}%. May need to rebalance workload.",
    "Excellent work team! {activity} conformance improved from {x}% to {y}%.",
    "Seeing unusual pattern in {activity} during peak hours. Investigating root cause.",
    "Cost analysis shows {activity} consuming {x}% of total process cost. Opportunity for optimization.",
    "After Q{x} review, identified ${y}K in potential savings through process improvements."
  ];
  
  const authors = ["Sarah Johnson", "Mike Chen", "Emily Rodriguez", "James Kim", "Lisa Anderson"];
  const activities = ["Credit Check", "Data Entry", "Approval", "Quality Check", "Document Review"];
  
  for (let i = 0; i < numComments; i++) {
    const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
    const content = template
      .replace(/{activity}/g, activities[Math.floor(Math.random() * activities.length)])
      .replace(/{x}/g, String(Math.floor(Math.random() * 50) + 10))
      .replace(/{y}/g, String(Math.floor(Math.random() * 90) + 10));
    
    comments.push({
      content,
      author: authors[Math.floor(Math.random() * authors.length)],
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      isReply: Math.random() > 0.7
    });
  }
  
  return comments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export interface GeneratedCustomKPI {
  name: string;
  description: string;
  metricType: string;
  targetValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  currentValue: number;
  status: 'good' | 'warning' | 'critical';
}

export function generateCustomKPIs(numKPIs: number = 5): GeneratedCustomKPI[] {
  const kpiTemplates = [
    {
      name: "Order Processing Speed",
      description: "Average cycle time for order fulfillment from receipt to delivery",
      metricType: "cycle_time",
      targetValue: 24,
      warningThreshold: 30,
      criticalThreshold: 48
    },
    {
      name: "Invoice Accuracy Rate",
      description: "Percentage of invoices processed without errors or rework",
      metricType: "quality",
      targetValue: 95,
      warningThreshold: 90,
      criticalThreshold: 85
    },
    {
      name: "SLA Compliance Rate",
      description: "Percentage of cases completing within SLA threshold",
      metricType: "compliance",
      targetValue: 95,
      warningThreshold: 90,
      criticalThreshold: 85
    },
    {
      name: "Automation Coverage",
      description: "Percentage of process activities that are fully automated",
      metricType: "automation",
      targetValue: 60,
      warningThreshold: 50,
      criticalThreshold: 40
    },
    {
      name: "Cost per Transaction",
      description: "Average cost to process one complete transaction end-to-end",
      metricType: "cost",
      targetValue: 25,
      warningThreshold: 30,
      criticalThreshold: 40
    },
    {
      name: "Resource Utilization",
      description: "Average utilization rate across all resources",
      metricType: "resource",
      targetValue: 75,
      warningThreshold: 65,
      criticalThreshold: 55
    },
    {
      name: "Conformance Score",
      description: "Process conformance to designed model (fitness score)",
      metricType: "conformance",
      targetValue: 90,
      warningThreshold: 80,
      criticalThreshold: 70
    }
  ];
  
  const kpis: GeneratedCustomKPI[] = [];
  
  for (let i = 0; i < Math.min(numKPIs, kpiTemplates.length); i++) {
    const template = kpiTemplates[i];
    const variance = (Math.random() - 0.5) * 20; // -10 to +10
    const currentValue = Math.max(0, template.targetValue + variance);
    
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (template.metricType === 'cost' || template.metricType === 'cycle_time') {
      // Lower is better
      if (currentValue > template.criticalThreshold) status = 'critical';
      else if (currentValue > template.warningThreshold) status = 'warning';
    } else {
      // Higher is better
      if (currentValue < template.criticalThreshold) status = 'critical';
      else if (currentValue < template.warningThreshold) status = 'warning';
    }
    
    kpis.push({
      ...template,
      currentValue: Math.round(currentValue * 10) / 10,
      status
    });
  }
  
  return kpis;
}

export interface GeneratedAlert {
  kpiName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
}

export function generateKPIAlerts(numAlerts: number = 8): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  const alertTemplates = [
    {
      kpiName: "Order Processing Speed",
      severity: 'critical' as const,
      message: "Average cycle time exceeded critical threshold",
      value: 52.3,
      threshold: 48
    },
    {
      kpiName: "SLA Compliance Rate",
      severity: 'warning' as const,
      message: "SLA compliance dropped below warning threshold",
      value: 88.5,
      threshold: 90
    },
    {
      kpiName: "Automation Coverage",
      severity: 'critical' as const,
      message: "Automation rate critically low",
      value: 38.2,
      threshold: 40
    },
    {
      kpiName: "Cost per Transaction",
      severity: 'high' as const,
      message: "Transaction costs exceeding targets",
      value: 34.7,
      threshold: 30
    },
    {
      kpiName: "Resource Utilization",
      severity: 'warning' as const,
      message: "Resource utilization below optimal level",
      value: 63.8,
      threshold: 65
    }
  ];
  
  for (let i = 0; i < Math.min(numAlerts, alertTemplates.length); i++) {
    const template = alertTemplates[i];
    const hoursAgo = Math.random() * 72; // Last 3 days
    
    alerts.push({
      ...template,
      triggeredAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    });
  }
  
  return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
}

export interface GeneratedReport {
  name: string;
  type: 'pdf' | 'excel' | 'powerpoint';
  processName: string;
  generatedAt: Date;
  status: 'completed' | 'processing' | 'failed';
}

export function generateReports(numReports: number = 10): GeneratedReport[] {
  const reports: GeneratedReport[] = [];
  const reportNames = [
    "Q1 Process Performance Analysis",
    "Monthly Order Fulfillment Review",
    "Invoice Processing Efficiency Report",
    "Annual Process Mining Summary",
    "Bottleneck Analysis Deep Dive",
    "Automation Opportunities Assessment",
    "Conformance Audit Report",
    "Cost Reduction Initiative Report",
    "Executive Dashboard Summary",
    "Year-End Process Review"
  ];
  
  const processNames = ["Order Fulfillment", "Invoice Processing", "Customer Onboarding", "HR Recruitment"];
  const types: ('pdf' | 'excel' | 'powerpoint')[] = ['pdf', 'excel', 'powerpoint'];
  
  for (let i = 0; i < numReports; i++) {
    const daysAgo = Math.random() * 90; // Last 3 months
    
    reports.push({
      name: reportNames[i % reportNames.length],
      type: types[Math.floor(Math.random() * types.length)],
      processName: processNames[Math.floor(Math.random() * processNames.length)],
      generatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      status: Math.random() > 0.95 ? 'failed' : 'completed'
    });
  }
  
  return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
}

export interface GeneratedCostAnalysis {
  activityName: string;
  avgDuration: number; // in hours
  executionCount: number;
  costPerExecution: number;
  totalCost: number;
  percentOfTotal: number;
  automationPotential: number; // 0-100%
  estimatedSavings?: number;
}

export function generateCostAnalysis(numActivities: number = 10): GeneratedCostAnalysis[] {
  const activities = [
    { name: "Invoice Data Entry", duration: 0.133, count: 5400, automation: 95 },
    { name: "Credit Check", duration: 2.4, count: 450, automation: 75 },
    { name: "Document Review", duration: 0.75, count: 2100, automation: 60 },
    { name: "Manager Approval", duration: 0.5, count: 1800, automation: 40 },
    { name: "Quality Inspection", duration: 1.2, count: 800, automation: 55 },
    { name: "Data Validation", duration: 0.25, count: 3600, automation: 85 },
    { name: "Customer Communication", duration: 0.5, count: 2400, automation: 30 },
    { name: "Payment Processing", duration: 0.1, count: 5400, automation: 90 },
    { name: "Shipping Coordination", duration: 0.67, count: 1200, automation: 50 },
    { name: "Inventory Check", duration: 0.42, count: 1500, automation: 70 }
  ];
  
  const hourlyRate = 50;
  const costData: GeneratedCostAnalysis[] = [];
  let totalCost = 0;
  
  // First pass: calculate individual costs
  for (let i = 0; i < Math.min(numActivities, activities.length); i++) {
    const activity = activities[i];
    const costPerExec = activity.duration * hourlyRate;
    const totalActivityCost = costPerExec * activity.count;
    totalCost += totalActivityCost;
    
    costData.push({
      activityName: activity.name,
      avgDuration: activity.duration,
      executionCount: activity.count,
      costPerExecution: Math.round(costPerExec * 100) / 100,
      totalCost: Math.round(totalActivityCost),
      percentOfTotal: 0, // Will calculate in second pass
      automationPotential: activity.automation
    });
  }
  
  // Second pass: calculate percentages and savings
  costData.forEach(item => {
    item.percentOfTotal = Math.round((item.totalCost / totalCost) * 1000) / 10;
    
    // Calculate estimated savings if automated
    if (item.automationPotential > 60) {
      const reductionFactor = item.automationPotential / 100;
      const newDuration = item.avgDuration * (1 - reductionFactor);
      const newCost = newDuration * hourlyRate * item.executionCount;
      item.estimatedSavings = Math.round(item.totalCost - newCost);
    }
  });
  
  return costData.sort((a, b) => b.totalCost - a.totalCost);
}

export interface GeneratedROICalculation {
  opportunityName: string;
  currentAnnualCost: number;
  postAutomationCost: number;
  annualSavings: number;
  implementationCost: number;
  roiPercentage: number;
  paybackMonths: number;
  threeYearNPV: number;
  priority: 'high' | 'medium' | 'low';
}

export function generateROICalculations(numCalculations: number = 8): GeneratedROICalculation[] {
  const opportunities = [
    {
      name: "Automate Invoice Data Entry",
      currentCost: 35910,
      newCost: 3510,
      implCost: 15000
    },
    {
      name: "Implement Credit Scoring API",
      currentCost: 87360,
      newCost: 20160,
      implCost: 20000
    },
    {
      name: "OCR Document Processing",
      currentCost: 78750,
      newCost: 15750,
      implCost: 25000
    },
    {
      name: "Automated Approval Workflow",
      currentCost: 45000,
      newCost: 13500,
      implCost: 12000
    },
    {
      name: "RPA for Data Validation",
      currentCost: 45000,
      newCost: 6750,
      implCost: 18000
    },
    {
      name: "Inventory API Integration",
      currentCost: 31500,
      newCost: 9450,
      implCost: 10000
    },
    {
      name: "Automated Email Responses",
      currentCost: 60000,
      newCost: 18000,
      implCost: 15000
    },
    {
      name: "Quality Check Automation",
      currentCost: 48000,
      newCost: 19200,
      implCost: 16000
    }
  ];
  
  const calculations: GeneratedROICalculation[] = [];
  
  for (let i = 0; i < Math.min(numCalculations, opportunities.length); i++) {
    const opp = opportunities[i];
    const savings = opp.currentCost - opp.newCost;
    const roi = Math.round(((savings - opp.implCost) / opp.implCost) * 100);
    const payback = opp.implCost / (savings / 12);
    const npv = (savings * 3) - opp.implCost;
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (roi > 150 && payback < 6) priority = 'high';
    else if (roi > 75 && payback < 12) priority = 'medium';
    
    calculations.push({
      opportunityName: opp.name,
      currentAnnualCost: opp.currentCost,
      postAutomationCost: opp.newCost,
      annualSavings: savings,
      implementationCost: opp.implCost,
      roiPercentage: roi,
      paybackMonths: Math.round(payback * 10) / 10,
      threeYearNPV: npv,
      priority
    });
  }
  
  return calculations.sort((a, b) => b.roiPercentage - a.roiPercentage);
}
