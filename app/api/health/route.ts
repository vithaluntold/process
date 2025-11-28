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

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Simple health check without database dependency initially
    // to ensure Railway can detect the service is running
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        message: "Service is running",
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "pass",
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
        error: error instanceof Error ? error.message : "Health check error",
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
