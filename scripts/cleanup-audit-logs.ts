import { purgeOldAuditLogs, purgeFailedLoginAttempts } from "../lib/audit-retention";

async function runCleanup() {
  console.log("Starting audit log cleanup...");
  
  try {
    await purgeOldAuditLogs(90);
    console.log("✓ Purged audit logs older than 90 days");
    
    await purgeFailedLoginAttempts(30);
    console.log("✓ Purged failed login attempts older than 30 days");
    
    console.log("Audit log cleanup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Audit log cleanup failed:", error);
    process.exit(1);
  }
}

runCleanup();
