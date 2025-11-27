/**
 * Readiness Check Endpoint (/api/ready)
 * 
 * Purpose: Readiness probe for container orchestration and load balancers
 * Returns: Detailed status of all dependencies required to serve traffic
 * 
 * Use Cases:
 * - Kubernetes readiness probe
 * - Deployment verification
 * - Pre-traffic health gates
 * 
 * Difference from /health:
 * - /health = Is the application running? (liveness)
 * - /ready = Is the application ready to receive traffic? (readiness)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface DependencyCheck {
  status: "up" | "down" | "degraded";
  responseTime?: string;
  error?: string;
}

interface ReadinessResponse {
  status: "ready" | "not_ready" | "degraded";
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: DependencyCheck;
    encryption: DependencyCheck;
  };
}

async function checkDatabase(): Promise<DependencyCheck> {
  const startTime = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 1000) {
      return {
        status: "degraded",
        responseTime: `${responseTime}ms`,
      };
    }
    
    return {
      status: "up",
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkEncryption(): Promise<DependencyCheck> {
  const startTime = Date.now();
  try {
    const kmsProvider = process.env.KMS_PROVIDER || "local";
    
    if (kmsProvider === "local" && !process.env.MASTER_ENCRYPTION_KEY) {
      return {
        status: "degraded",
        responseTime: `${Date.now() - startTime}ms`,
        error: "Using default encryption key",
      };
    }
    
    return {
      status: "up",
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      status: "down",
      responseTime: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : "Encryption check failed",
    };
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  const [databaseCheck, encryptionCheck] = await Promise.all([
    checkDatabase(),
    checkEncryption(),
  ]);
  
  const allChecks = [databaseCheck, encryptionCheck];
  const hasDown = allChecks.some(c => c.status === "down");
  const hasDegraded = allChecks.some(c => c.status === "degraded");
  
  let overallStatus: "ready" | "not_ready" | "degraded";
  let httpStatus: number;
  
  if (hasDown) {
    overallStatus = "not_ready";
    httpStatus = 503;
  } else if (hasDegraded) {
    overallStatus = "degraded";
    httpStatus = 200;
  } else {
    overallStatus = "ready";
    httpStatus = 200;
  }
  
  const response: ReadinessResponse = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: databaseCheck,
      encryption: encryptionCheck,
    },
  };
  
  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
