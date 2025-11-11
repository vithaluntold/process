import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processes, performanceMetrics, automationOpportunities } from "@/shared/schema";
import { eq, sql, count, avg } from "drizzle-orm";
import { getCurrentUser } from "@/lib/server-auth";
import { appCache } from "@/lib/cache";

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `dashboard-stats:${user.id}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    const result = await db.execute(sql`
      WITH user_processes AS (
        SELECT id FROM ${processes} WHERE user_id = ${user.id}
      ),
      process_stats AS (
        SELECT COUNT(*) as process_count FROM user_processes
      ),
      metrics_stats AS (
        SELECT 
          AVG(cycle_time) as avg_cycle_time,
          AVG(conformance_rate) as avg_conformance
        FROM ${performanceMetrics} pm
        WHERE pm.process_id IN (SELECT id FROM user_processes)
      ),
      automation_stats AS (
        SELECT AVG(automation_potential) as avg_automation
        FROM ${automationOpportunities} ao
        WHERE ao.process_id IN (SELECT id FROM user_processes)
      )
      SELECT 
        ps.process_count,
        ms.avg_cycle_time,
        ms.avg_conformance,
        as_tbl.avg_automation
      FROM process_stats ps
      CROSS JOIN metrics_stats ms
      CROSS JOIN automation_stats as_tbl
    `);

    const row = result.rows[0] as any;

    const stats = {
      processCount: Number(row?.process_count || 0),
      avgCycleTime: row?.avg_cycle_time ? Math.round(Number(row.avg_cycle_time) * 10) / 10 : 0,
      conformanceRate: row?.avg_conformance ? Math.round(Number(row.avg_conformance) * 10) / 10 : 0,
      automationPotential: row?.avg_automation ? Math.round(Number(row.avg_automation) * 10) / 10 : 0,
    };

    const responseData = { stats };
    appCache.set(cacheKey, responseData, 30);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
