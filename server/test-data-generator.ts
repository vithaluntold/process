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
