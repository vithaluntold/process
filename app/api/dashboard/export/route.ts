/**
 * Dashboard Export API - Tenant-Safe Implementation
 * 
 * POST /api/dashboard/export - Export dashboard report as PDF
 * 
 * SECURITY: All queries automatically filtered by organizationId
 * MIGRATION: Converted from insecure userId-only pattern
 * RATE LIMITING: Protected against DoS via PDF generation abuse
 */

import { NextResponse } from 'next/server';
import { createTenantSafeHandler } from '@/lib/tenant-api-factory';
import { getProcessesByTenant, getDashboardStatsByTenant } from '@/server/tenant-storage';
import { db } from '@/lib/db';
import { eventLogs, processes, performanceMetrics, automationOpportunities } from '@/shared/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { z } from 'zod';
import { requireTenantContext } from '@/lib/tenant-context';
import { checkRateLimit, REPORT_GENERATION_LIMIT } from '@/lib/rate-limiter';

const exportSchema = z.object({
  dateRange: z.string().optional().default('all'),
  format: z.string().optional().default('pdf'),
});

export const POST = createTenantSafeHandler(async (request, context, params) => {
  try {
    const { organizationId, userId } = requireTenantContext();

    // Rate limiting for PDF generation to prevent DoS
    const rateLimit = checkRateLimit(
      `dashboard-export:${userId}`,
      REPORT_GENERATION_LIMIT
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { dateRange, format } = exportSchema.parse(body);

    // Calculate timestamp filter for events/metrics (NOT process creation)
    let startDate: Date | null = null;
    if (dateRange && dateRange !== 'all') {
      const daysAgo = parseInt(dateRange.replace('d', ''));
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
    }

    // Get process count for processes with activity in the date range
    // This counts DISTINCT processes that have events within the period
    const processCountQuery = startDate
      ? await db
          .selectDistinct({ processId: eventLogs.processId })
          .from(eventLogs)
          .innerJoin(processes, eq(eventLogs.processId, processes.id))
          .where(and(
            eq(processes.organizationId, organizationId),
            gte(eventLogs.timestamp, startDate)
          ))
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(processes)
          .where(eq(processes.organizationId, organizationId));

    const processCount = startDate
      ? processCountQuery.length
      : (processCountQuery[0] as any)?.count || 0;

    // Get process list for table (all processes for tenant, limited to 100 for PDF)
    const tenantProcesses = await db
      .select({
        id: processes.id,
        name: processes.name,
        description: processes.description,
        createdAt: processes.createdAt,
      })
      .from(processes)
      .where(eq(processes.organizationId, organizationId))
      .orderBy(sql`${processes.createdAt} DESC`)
      .limit(100);

    // Calculate average cycle time from event logs within date range
    // Step 1: Get duration for each process (only events within date range)
    // Step 2: Average those durations in JavaScript
    const cycleTimeQuery = startDate
      ? db
          .select({
            processId: eventLogs.processId,
            duration: sql<number>`
              EXTRACT(EPOCH FROM (
                MAX(${eventLogs.timestamp}) - MIN(${eventLogs.timestamp})
              )) / 86400
            `,
          })
          .from(eventLogs)
          .innerJoin(processes, eq(eventLogs.processId, processes.id))
          .where(and(
            eq(processes.organizationId, organizationId),
            gte(eventLogs.timestamp, startDate)
          ))
          .groupBy(eventLogs.processId)
      : db
          .select({
            processId: eventLogs.processId,
            duration: sql<number>`
              EXTRACT(EPOCH FROM (
                MAX(${eventLogs.timestamp}) - MIN(${eventLogs.timestamp})
              )) / 86400
            `,
          })
          .from(eventLogs)
          .innerJoin(processes, eq(eventLogs.processId, processes.id))
          .where(eq(processes.organizationId, organizationId))
          .groupBy(eventLogs.processId);

    const cycleTimeResult = await cycleTimeQuery;

    const avgCycleTime = cycleTimeResult.length > 0
      ? Math.round(
          cycleTimeResult.reduce((sum, r) => sum + (Number(r.duration) || 0), 0) /
          cycleTimeResult.length
        )
      : 0;

    // Calculate conformance rate from performance metrics
    // Note: performanceMetrics table doesn't have a timestamp, so we use all metrics for tenant
    const conformanceResult = await db
      .select({
        avgConformance: sql<number>`AVG(${performanceMetrics.conformanceRate})`,
      })
      .from(performanceMetrics)
      .innerJoin(processes, eq(performanceMetrics.processId, processes.id))
      .where(eq(processes.organizationId, organizationId));

    const conformanceRate = conformanceResult[0]?.avgConformance
      ? Math.round(Number(conformanceResult[0].avgConformance))
      : 85; // Default fallback

    // Calculate automation potential (simplified monetary estimate based on process count)
    // Original logic: processCount * 1.5 = millions in potential savings
    const automationPotential = (processCount * 1.5).toFixed(1);

    // Generate PDF report
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("EPI-Q Dashboard Report", 14, 20);

    // Date range
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(
      `Date Range: ${dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : dateRange === "90d" ? "Last 90 Days" : "All Time"}`,
      14,
      34
    );

    // Summary statistics
    doc.setFontSize(14);
    doc.text("Summary Statistics", 14, 45);

    doc.setFontSize(10);
    doc.text(`Active Processes: ${processCount}`, 14, 55);
    doc.text(`Average Cycle Time: ${avgCycleTime} days`, 14, 62);
    doc.text(`Conformance Rate: ${conformanceRate}%`, 14, 69);
    doc.text(`Automation Potential: $${automationPotential}M`, 14, 76);

    // Process list
    if (tenantProcesses.length > 0) {
      doc.setFontSize(14);
      doc.text("Active Processes", 14, 90);

      const tableData = tenantProcesses.slice(0, 20).map((p: any) => [
        p.id.toString(),
        p.name,
        p.description || "N/A",
        new Date(p.createdAt).toLocaleDateString(),
      ]);

      (doc as any).autoTable({
        startY: 95,
        head: [["ID", "Name", "Description", "Created"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 184, 217] },
      });
    }

    // Generate footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      doc.text("EPI-Q Process Mining Platform", doc.internal.pageSize.width - 70, doc.internal.pageSize.height - 10);
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dashboard-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Dashboard export error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to export dashboard' }, { status: 500 });
  }
});
