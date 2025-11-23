/**
 * Seed Test Data Script
 * Automatically loads test data from test-data/ folder into the database
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as storage from '../server/storage';
import { createProcessForTenant } from '../server/tenant-storage';
import { db } from '../server/db';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

async function parseCSV(filePath: string): Promise<any[]> {
  const content = readFileSync(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(content);
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  const testDataFiles = [
    {
      file: 'order-fulfillment.csv',
      name: 'Order Fulfillment Process',
      description: 'E-commerce order processing with 500 cases demonstrating bottlenecks and rework patterns'
    },
    {
      file: 'invoice-processing.csv',
      name: 'Invoice Processing',
      description: 'Accounts payable workflow with 300 cases showing conformance violations'
    },
    {
      file: 'customer-support.csv',
      name: 'Customer Support Tickets',
      description: 'Help desk process with 400 cases highlighting resource imbalances'
    },
    {
      file: 'loan-approval.csv',
      name: 'Loan Approval Process',
      description: 'Financial services workflow with 200 cases featuring duration outliers'
    }
  ];

  let totalProcesses = 0;
  let totalEvents = 0;

  for (const testData of testDataFiles) {
    const filePath = join(process.cwd(), 'test-data', testData.file);
    
    if (!existsSync(filePath)) {
      console.log(`⚠️  Skipping ${testData.file} (file not found)`);
      continue;
    }

    try {
      console.log(`📂 Processing ${testData.file}...`);

      // Parse CSV
      const events = await parseCSV(filePath);
      console.log(`   Parsed ${events.length} events`);

      if (events.length === 0) {
        console.log(`   ⚠️  No events found, skipping\n`);
        continue;
      }

      // Create process (uses tenant context from current user)
      const process = await createProcessForTenant({
        name: testData.name,
        description: testData.description,
        source: testData.file,
        status: 'active'
      });
      console.log(`   ✓ Created process: ${process.name} (ID: ${process.id})`);

      // Validate and prepare event logs
      const validEvents = events.filter((event: any) => {
        const caseId = event.caseId || event.case_id || event.CaseId;
        const activity = event.activity || event.Activity;
        const timestamp = event.timestamp || event.Timestamp;
        return caseId && activity && timestamp;
      });

      if (validEvents.length === 0) {
        console.log(`   ⚠️  No valid events (missing required columns), skipping\n`);
        continue;
      }

      const eventLogs = validEvents.map((event: any) => ({
        processId: process.id,
        caseId: event.caseId || event.case_id || event.CaseId,
        activity: event.activity || event.Activity,
        timestamp: new Date(event.timestamp || event.Timestamp),
        resource: event.resource || event.Resource || null,
        metadata: event
      }));

      // Insert in batches
      const BATCH_SIZE = 500;
      let processEvents = 0;

      for (let i = 0; i < eventLogs.length; i += BATCH_SIZE) {
        const batch = eventLogs.slice(i, i + BATCH_SIZE);
        const inserted = await storage.insertEventLogs(batch);
        processEvents += inserted.length;
      }

      console.log(`   ✓ Inserted ${processEvents} event logs\n`);
      totalProcesses++;
      totalEvents += processEvents;

    } catch (error) {
      console.error(`   ❌ Error processing ${testData.file}:`, error);
      console.log('');
    }
  }

  console.log('━'.repeat(60));
  console.log(`\n✅ Seeding complete!`);
  console.log(`   Processes created: ${totalProcesses}`);
  console.log(`   Total events imported: ${totalEvents}\n`);
  console.log('💡 Next steps:');
  console.log('   1. Open Process Discovery page');
  console.log('   2. Select a process from the dropdown');
  console.log('   3. Click "Discover Process Model"');
  console.log('   4. Try other analytics features!\n');
}

seedTestData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
