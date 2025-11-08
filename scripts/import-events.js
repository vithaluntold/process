const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const csvParser = require('csv-parser');

const sql = neon(process.env.DATABASE_URL);

async function importEvents() {
  const events = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('test-data/order-fulfillment.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        events.push({
          processId: 9, // Your current process
          caseId: row.caseId,
          activity: row.activity,
          timestamp: new Date(row.timestamp),
          resource: row.resource || null,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Parsed ${events.length} events from CSV`);

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    
    const values = batch.map(e => 
      `(${e.processId}, '${e.caseId.replace(/'/g, "''")}', '${e.activity.replace(/'/g, "''")}', '${e.timestamp.toISOString()}', ${e.resource ? `'${e.resource.replace(/'/g, "''")}'` : 'NULL'})`
    ).join(', ');
    
    await sql`
      INSERT INTO event_logs (process_id, case_id, activity, timestamp, resource)
      VALUES ${sql.unsafe(values)}
    `;
    
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`);
  }

  console.log('✅ All events imported successfully!');
}

importEvents().catch(console.error);
