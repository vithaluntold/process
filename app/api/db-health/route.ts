import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    // Simple database connectivity test
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp,
        database: {
          status: "connected",
          responseTime: `${responseTime}ms`,
        },
        environment: process.env.NODE_ENV || "development",
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Database health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        database: {
          status: "error",
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : "Unknown database error",
        },
        environment: process.env.NODE_ENV || "development",
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