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

// Health check with timeout
async function checkDatabaseHealth(timeoutMs: number = 10000): Promise<{ status: string; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database health check timeout')), timeoutMs);
    });
    
    // Race between database query and timeout
    const dbPromise = db.execute(sql`SELECT 1`);
    
    await Promise.race([dbPromise, timeoutPromise]);
    
    const responseTime = Date.now() - startTime;
    return {
      status: "up",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    
    return {
      status: "down",
      responseTime,
      error: errorMessage,
    };
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Check database with 8 second timeout (less than Railway's health check timeout)
    const dbCheck = await checkDatabaseHealth(8000);
    
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
            ...(dbCheck.error && { error: dbCheck.error }),
          },
        },
      },
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
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
        },
      }
    );
  }
}
