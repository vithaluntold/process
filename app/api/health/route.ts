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

export async function GET() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        checks: {
          database: {
            status: "up",
            responseTime: `${responseTime}ms`,
          },
        },
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        checks: {
          database: {
            status: "down",
            responseTime: `${responseTime}ms`,
            error: error instanceof Error ? error.message : "Unknown error",
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
