/**
 * Health Check Endpoint (/api/health)
 * 
 * Purpose: Liveness probe for load balancers and container orchestration
 * Returns: Basic health status without deep dependency checks
 * 
 * Use Cases:
 * - Kubernetes liveness probe
 * - Load balancer health checks
 * - Uptime monitoring (Pingdom, UptimeRobot, etc.)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// Health check with timeout and retry logic
async function checkDatabaseHealth(timeoutMs: number = 12000, retries: number = 2): Promise<{ status: string; responseTime: number; error?: string; attempt?: number }> {
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();
    
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Database health check timeout after ${timeoutMs}ms`)), timeoutMs);
      });
      
      // Race between database query and timeout
      const dbPromise = db.execute(sql`SELECT 1 as health_check`);
      
      const result = await Promise.race([dbPromise, timeoutPromise]);
      
      const responseTime = Date.now() - startTime;
      
      // Verify the result is valid
      if (result && Array.isArray(result) && result.length > 0) {
        return {
          status: "up",
          responseTime,
          attempt,
        };
      } else {
        throw new Error('Invalid database response');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown database error";
      
      console.warn(`[Health Check] Database attempt ${attempt}/${retries} failed after ${responseTime}ms:`, errorMessage);
      
      // If this is the last attempt, return the error
      if (attempt === retries) {
        return {
          status: "down",
          responseTime,
          error: errorMessage,
          attempt,
        };
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  // This should never be reached, but just in case
  return {
    status: "down",
    responseTime: 0,
    error: "All retry attempts failed",
    attempt: retries,
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Check database with 10 second timeout and 2 retries (less than Railway's health check timeout)
    const dbCheck = await checkDatabaseHealth(10000, 2);
    
    const isHealthy = dbCheck.status === "up";
    
    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        checks: {
          database: {
            status: dbCheck.status,
            responseTime: `${dbCheck.responseTime}ms`,
            ...(dbCheck.attempt && { attempt: `${dbCheck.attempt}/2` }),
            ...(dbCheck.error && { error: dbCheck.error }),
          },
        },
      },
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": isHealthy ? "pass" : "fail",
        },
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        checks: {
          database: {
            status: "error",
            responseTime: "N/A",
            error: error instanceof Error ? error.message : "Health check error",
          },
        },
      },
      { 
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "fail",
        },
      }
    );
  }
}
