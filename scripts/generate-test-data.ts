import * as fs from 'fs';
import * as path from 'path';

interface EventLog {
  caseId: string;
  activity: string;
  timestamp: string;
  resource?: string;
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function writeCsv(filename: string, events: EventLog[]): void {
  const csvHeader = 'caseId,activity,timestamp,resource\n';
  const csvRows = events.map(e => 
    `${e.caseId},${e.activity},${e.timestamp},${e.resource || ''}`
  ).join('\n');
  
  const outputDir = path.join(process.cwd(), 'test-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(outputDir, filename), csvHeader + csvRows);
  console.log(`✓ Generated ${filename} with ${events.length} events`);
}

function generateOrderFulfillment(): EventLog[] {
  const events: EventLog[] = [];
  const resources = {
    sales: ['Sarah_Johnson', 'Mike_Chen', 'Lisa_Brown'],
    inventory: ['John_Smith', 'Emma_Wilson'],
    payment: ['System_Payment'],
    credit: ['David_Lee', 'Amy_Taylor'],
    warehouse: ['Carlos_Garcia', 'Nina_Patel', 'Tom_Anderson'],
    shipping: ['System_Shipping'],
    delivery: ['FedEx', 'UPS', 'USPS']
  };
  
  const baseDate = new Date('2025-01-01T08:00:00');
  
  for (let i = 1; i <= 500; i++) {
    const caseId = `ORD-${String(i).padStart(5, '0')}`;
    const orderType = Math.random();
    let currentTime = addDays(baseDate, Math.floor(i / 20));
    currentTime = addMinutes(currentTime, randomBetween(0, 480));
    
    events.push({
      caseId,
      activity: 'Receive Order',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.sales)
    });
    
    currentTime = addMinutes(currentTime, randomBetween(2, 10));
    events.push({
      caseId,
      activity: 'Validate Order',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_Payment'
    });
    
    if (orderType > 0.2) {
      currentTime = addMinutes(currentTime, randomBetween(1, 5));
      events.push({
        caseId,
        activity: 'Check Inventory',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.inventory)
      });
    }
    
    if (orderType > 0.85) {
      currentTime = addHours(currentTime, randomBetween(1, 8));
      events.push({
        caseId,
        activity: 'Credit Check',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.credit)
      });
      
      if (i % 20 === 0) {
        currentTime = addHours(currentTime, randomBetween(24, 96));
      } else {
        currentTime = addMinutes(currentTime, randomBetween(15, 45));
      }
      events.push({
        caseId,
        activity: 'Credit Approval',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.credit)
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(5, 15));
    events.push({
      caseId,
      activity: 'Process Payment',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_Payment'
    });
    
    if (Math.random() > 0.92) {
      currentTime = addMinutes(currentTime, randomBetween(30, 120));
      events.push({
        caseId,
        activity: 'Payment Failed',
        timestamp: formatTimestamp(currentTime),
        resource: 'System_Payment'
      });
      
      currentTime = addHours(currentTime, randomBetween(2, 24));
      events.push({
        caseId,
        activity: 'Payment Retry',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.sales)
      });
      
      currentTime = addMinutes(currentTime, randomBetween(5, 15));
      events.push({
        caseId,
        activity: 'Process Payment',
        timestamp: formatTimestamp(currentTime),
        resource: 'System_Payment'
      });
    }
    
    if (i % 15 === 0) {
      currentTime = addMinutes(currentTime, randomBetween(30, 60));
      events.push({
        caseId,
        activity: 'Manager Approval',
        timestamp: formatTimestamp(currentTime),
        resource: 'Sarah_Johnson'
      });
    }
    
    currentTime = addHours(currentTime, randomBetween(2, 8));
    events.push({
      caseId,
      activity: 'Pick Items',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.warehouse)
    });
    
    if (i % 30 === 0) {
      currentTime = addMinutes(currentTime, randomBetween(15, 30));
      events.push({
        caseId,
        activity: 'Quality Check',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.warehouse)
      });
      
      currentTime = addMinutes(currentTime, randomBetween(20, 40));
      events.push({
        caseId,
        activity: 'Re-Pick Items',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.warehouse)
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Pack Order',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.warehouse)
    });
    
    currentTime = addMinutes(currentTime, randomBetween(5, 15));
    events.push({
      caseId,
      activity: 'Generate Shipping Label',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_Shipping'
    });
    
    currentTime = addHours(currentTime, randomBetween(1, 4));
    events.push({
      caseId,
      activity: 'Ship Order',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.delivery)
    });
    
    currentTime = addDays(currentTime, randomBetween(1, 5));
    events.push({
      caseId,
      activity: 'Delivery Complete',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.delivery)
    });
    
    if (Math.random() > 0.95) {
      currentTime = addDays(currentTime, randomBetween(1, 3));
      events.push({
        caseId,
        activity: 'Customer Return',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.sales)
      });
    }
  }
  
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function generateInvoiceProcessing(): EventLog[] {
  const events: EventLog[] = [];
  const resources = {
    ap: ['Jennifer_Moore', 'Robert_Kim', 'Susan_White'],
    manager: ['Michael_Brown', 'Patricia_Davis'],
    cfo: ['James_Wilson'],
    system: ['System_OCR', 'System_ERP']
  };
  
  const baseDate = new Date('2025-01-01T09:00:00');
  
  for (let i = 1; i <= 300; i++) {
    const caseId = `INV-${String(i).padStart(5, '0')}`;
    const invoiceAmount = Math.random();
    let currentTime = addDays(baseDate, Math.floor(i / 15));
    currentTime = addMinutes(currentTime, randomBetween(0, 420));
    
    events.push({
      caseId,
      activity: 'Receive Invoice',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.system)
    });
    
    currentTime = addMinutes(currentTime, randomBetween(5, 15));
    events.push({
      caseId,
      activity: 'OCR Scan',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_OCR'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Manual Data Entry',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.ap)
    });
    
    if (i % 10 === 0) {
      currentTime = addMinutes(currentTime, randomBetween(5, 15));
      events.push({
        caseId,
        activity: 'Data Validation Failed',
        timestamp: formatTimestamp(currentTime),
        resource: 'System_ERP'
      });
      
      currentTime = addMinutes(currentTime, randomBetween(15, 45));
      events.push({
        caseId,
        activity: 'Manual Data Entry',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.ap)
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(5, 10));
    events.push({
      caseId,
      activity: 'Match to PO',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_ERP'
    });
    
    if (invoiceAmount > 0.7) {
      if (i % 8 === 0) {
        currentTime = addHours(currentTime, randomBetween(2, 6));
      } else {
        currentTime = addMinutes(currentTime, randomBetween(30, 90));
      }
      events.push({
        caseId,
        activity: 'Manager Approval',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.manager)
      });
      
      if (i % 5 === 0) {
        currentTime = addMinutes(currentTime, randomBetween(10, 30));
        events.push({
          caseId,
          activity: 'Approval Rejected',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(resources.manager)
        });
        
        currentTime = addHours(currentTime, randomBetween(1, 4));
        events.push({
          caseId,
          activity: 'Clarification Request',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(resources.ap)
        });
        
        currentTime = addHours(currentTime, randomBetween(4, 24));
        events.push({
          caseId,
          activity: 'Manager Approval',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(resources.manager)
        });
      }
    }
    
    if (invoiceAmount > 0.9) {
      currentTime = addHours(currentTime, randomBetween(1, 8));
      events.push({
        caseId,
        activity: 'CFO Approval',
        timestamp: formatTimestamp(currentTime),
        resource: 'James_Wilson'
      });
    } else if (i % 25 === 0) {
      currentTime = addMinutes(currentTime, randomBetween(10, 30));
      events.push({
        caseId,
        activity: 'CFO Approval',
        timestamp: formatTimestamp(currentTime),
        resource: 'James_Wilson'
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(5, 15));
    events.push({
      caseId,
      activity: 'Schedule Payment',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_ERP'
    });
    
    currentTime = addDays(currentTime, randomBetween(7, 30));
    events.push({
      caseId,
      activity: 'Process Payment',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_ERP'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(1, 5));
    events.push({
      caseId,
      activity: 'Payment Complete',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_ERP'
    });
  }
  
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function generateCustomerSupport(): EventLog[] {
  const events: EventLog[] = [];
  const agents = ['Alice_Green', 'Bob_Martinez', 'Carol_Jackson', 'Dave_Thompson'];
  const specialists = ['Expert_Lisa', 'Expert_Tom'];
  
  const baseDate = new Date('2025-01-01T08:00:00');
  
  for (let i = 1; i <= 400; i++) {
    const caseId = `TKT-${String(i).padStart(5, '0')}`;
    const complexity = Math.random();
    let currentTime = addDays(baseDate, Math.floor(i / 25));
    
    const hour = randomBetween(8, 20);
    currentTime.setHours(hour);
    currentTime.setMinutes(randomBetween(0, 59));
    
    if (i % 50 === 0) {
      currentTime.setHours(2);
    }
    
    const assignedAgent = i % 8 === 0 ? 'Alice_Green' : randomChoice(agents);
    
    events.push({
      caseId,
      activity: 'Ticket Created',
      timestamp: formatTimestamp(currentTime),
      resource: 'System'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(5, 30));
    events.push({
      caseId,
      activity: 'Assign to Agent',
      timestamp: formatTimestamp(currentTime),
      resource: 'System'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(10, 60));
    events.push({
      caseId,
      activity: 'Initial Response',
      timestamp: formatTimestamp(currentTime),
      resource: assignedAgent
    });
    
    if (complexity > 0.6) {
      currentTime = addMinutes(currentTime, randomBetween(30, 120));
      events.push({
        caseId,
        activity: 'Escalate to Specialist',
        timestamp: formatTimestamp(currentTime),
        resource: assignedAgent
      });
      
      currentTime = addHours(currentTime, randomBetween(1, 6));
      events.push({
        caseId,
        activity: 'Specialist Review',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(specialists)
      });
      
      if (i % 12 === 0) {
        currentTime = addMinutes(currentTime, randomBetween(15, 45));
        events.push({
          caseId,
          activity: 'Request Additional Info',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(specialists)
        });
        
        currentTime = addHours(currentTime, randomBetween(2, 24));
        events.push({
          caseId,
          activity: 'Customer Response',
          timestamp: formatTimestamp(currentTime),
          resource: 'Customer'
        });
        
        currentTime = addMinutes(currentTime, randomBetween(15, 60));
        events.push({
          caseId,
          activity: 'Specialist Review',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(specialists)
        });
      }
    }
    
    if (i % 7 === 0) {
      currentTime = addMinutes(currentTime, randomBetween(20, 60));
      events.push({
        caseId,
        activity: 'Follow-up Required',
        timestamp: formatTimestamp(currentTime),
        resource: assignedAgent
      });
      
      currentTime = addHours(currentTime, randomBetween(4, 48));
      events.push({
        caseId,
        activity: 'Follow-up Response',
        timestamp: formatTimestamp(currentTime),
        resource: assignedAgent
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Provide Solution',
      timestamp: formatTimestamp(currentTime),
      resource: complexity > 0.6 ? randomChoice(specialists) : assignedAgent
    });
    
    currentTime = addMinutes(currentTime, randomBetween(5, 20));
    events.push({
      caseId,
      activity: 'Close Ticket',
      timestamp: formatTimestamp(currentTime),
      resource: assignedAgent
    });
    
    if (Math.random() > 0.9) {
      currentTime = addDays(currentTime, randomBetween(1, 3));
      events.push({
        caseId,
        activity: 'Reopen Ticket',
        timestamp: formatTimestamp(currentTime),
        resource: 'Customer'
      });
      
      currentTime = addMinutes(currentTime, randomBetween(30, 120));
      events.push({
        caseId,
        activity: 'Provide Solution',
        timestamp: formatTimestamp(currentTime),
        resource: assignedAgent
      });
      
      currentTime = addMinutes(currentTime, randomBetween(5, 15));
      events.push({
        caseId,
        activity: 'Close Ticket',
        timestamp: formatTimestamp(currentTime),
        resource: assignedAgent
      });
    }
  }
  
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function generateLoanApproval(): EventLog[] {
  const events: EventLog[] = [];
  const resources = {
    officers: ['Officer_Sarah', 'Officer_Mike', 'Officer_Jessica'],
    underwriters: ['UW_David', 'UW_Rachel'],
    managers: ['Manager_John'],
    system: ['System_Credit', 'System_Compliance']
  };
  
  const baseDate = new Date('2025-01-01T09:00:00');
  
  for (let i = 1; i <= 200; i++) {
    const caseId = `LOAN-${String(i).padStart(5, '0')}`;
    const loanAmount = Math.random();
    let currentTime = addDays(baseDate, Math.floor(i / 10));
    currentTime = addMinutes(currentTime, randomBetween(0, 420));
    
    events.push({
      caseId,
      activity: 'Application Received',
      timestamp: formatTimestamp(currentTime),
      resource: 'System'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Document Collection',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.officers)
    });
    
    if (i % 8 === 0) {
      for (let j = 0; j < randomBetween(2, 4); j++) {
        currentTime = addHours(currentTime, randomBetween(12, 48));
        events.push({
          caseId,
          activity: 'Request Missing Documents',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(resources.officers)
        });
        
        currentTime = addHours(currentTime, randomBetween(24, 96));
        events.push({
          caseId,
          activity: 'Document Collection',
          timestamp: formatTimestamp(currentTime),
          resource: randomChoice(resources.officers)
        });
      }
    }
    
    currentTime = addMinutes(currentTime, randomBetween(15, 45));
    events.push({
      caseId,
      activity: 'Initial Review',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.officers)
    });
    
    currentTime = addMinutes(currentTime, randomBetween(5, 15));
    events.push({
      caseId,
      activity: 'Credit Check',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_Credit'
    });
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Income Verification',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.officers)
    });
    
    currentTime = addHours(currentTime, randomBetween(1, 4));
    events.push({
      caseId,
      activity: 'Risk Assessment',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.underwriters)
    });
    
    if (i % 15 === 0) {
      currentTime = addHours(currentTime, randomBetween(48, 120));
    } else {
      currentTime = addHours(currentTime, randomBetween(4, 24));
    }
    
    events.push({
      caseId,
      activity: 'Underwriting',
      timestamp: formatTimestamp(currentTime),
      resource: randomChoice(resources.underwriters)
    });
    
    if (i % 6 === 0) {
      currentTime = addHours(currentTime, randomBetween(2, 8));
      events.push({
        caseId,
        activity: 'Additional Review Required',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.underwriters)
      });
      
      currentTime = addHours(currentTime, randomBetween(12, 48));
      events.push({
        caseId,
        activity: 'Underwriting',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.underwriters)
      });
    }
    
    if (loanAmount > 0.7) {
      currentTime = addHours(currentTime, randomBetween(1, 6));
      events.push({
        caseId,
        activity: 'Manager Approval',
        timestamp: formatTimestamp(currentTime),
        resource: 'Manager_John'
      });
    }
    
    currentTime = addMinutes(currentTime, randomBetween(10, 30));
    events.push({
      caseId,
      activity: 'Compliance Check',
      timestamp: formatTimestamp(currentTime),
      resource: 'System_Compliance'
    });
    
    if (Math.random() > 0.85) {
      currentTime = addMinutes(currentTime, randomBetween(30, 120));
      events.push({
        caseId,
        activity: 'Loan Denied',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.underwriters)
      });
    } else {
      currentTime = addMinutes(currentTime, randomBetween(15, 45));
      events.push({
        caseId,
        activity: 'Loan Approved',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.underwriters)
      });
      
      currentTime = addDays(currentTime, randomBetween(1, 3));
      events.push({
        caseId,
        activity: 'Document Signing',
        timestamp: formatTimestamp(currentTime),
        resource: randomChoice(resources.officers)
      });
      
      currentTime = addDays(currentTime, randomBetween(1, 2));
      events.push({
        caseId,
        activity: 'Funds Disbursed',
        timestamp: formatTimestamp(currentTime),
        resource: 'System'
      });
    }
  }
  
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

console.log('🚀 Generating comprehensive test data...\n');

writeCsv('order-fulfillment.csv', generateOrderFulfillment());
writeCsv('invoice-processing.csv', generateInvoiceProcessing());
writeCsv('customer-support.csv', generateCustomerSupport());
writeCsv('loan-approval.csv', generateLoanApproval());

console.log('\n✅ Test data generation complete!');
console.log('\nGenerated files in test-data/ directory:');
console.log('  - order-fulfillment.csv (500 cases with bottlenecks, rework, automation opportunities)');
console.log('  - invoice-processing.csv (300 cases with conformance violations, approval loops)');
console.log('  - customer-support.csv (400 cases with resource imbalances, temporal anomalies)');
console.log('  - loan-approval.csv (200 cases with duration outliers, document rework)\n');
