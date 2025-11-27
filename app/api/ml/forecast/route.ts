/**
 * ML Forecasting API - Enhanced with Python ML Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { withApiGuards } from '@/lib/api-guards';
import { API_ANALYSIS_LIMIT } from '@/lib/rate-limiter';
import { db } from '@/lib/db';
import { eventLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateForecastWithML } from '@/lib/ml-client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guardError = withApiGuards(request, 'ml-forecast', API_ANALYSIS_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const { processId, horizon = 30, algorithm = 'holt_winters', metric = 'cycle_time' } = body;

    if (!processId) {
      return NextResponse.json({ error: 'Process ID required' }, { status: 400 });
    }

    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, parseInt(processId)))
      .orderBy(eventLogs.timestamp);

    if (events.length < 10) {
      return NextResponse.json(
        { error: 'Insufficient data: need at least 10 events' },
        { status: 400 }
      );
    }

    const caseGroups = new Map<string, typeof events>();
    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const dailyData = new Map<string, number[]>();
    
    for (const [, caseEvents] of caseGroups) {
      const sorted = caseEvents.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      if (sorted.length < 2) continue;
      
      const startTime = new Date(sorted[0].timestamp);
      const endTime = new Date(sorted[sorted.length - 1].timestamp);
      const cycleTime = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      const dateKey = startTime.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(cycleTime);
    }

    const sortedDates = Array.from(dailyData.keys()).sort();
    const values = sortedDates.map(date => {
      const dayValues = dailyData.get(date)!;
      return dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    });

    if (values.length < 3) {
      return NextResponse.json(
        { error: 'Insufficient time series data: need at least 3 data points' },
        { status: 400 }
      );
    }

    const mlResult = await generateForecastWithML(values, {
      timestamps: sortedDates,
      horizon,
      algorithm: algorithm as 'holt_winters' | 'linear_regression' | 'moving_average',
    });

    if (mlResult) {
      const chartData = sortedDates.slice(-30).map((date, i) => ({
        date,
        actual: values[values.length - 30 + i] || values[i],
      }));

      mlResult.forecast.forEach((f, i) => {
        const forecastDate = new Date(sortedDates[sortedDates.length - 1]);
        forecastDate.setDate(forecastDate.getDate() + f.step);
        chartData.push({
          date: forecastDate.toISOString().split('T')[0],
          forecast: f.value,
          lower: f.lower,
          upper: f.upper,
        } as any);
      });

      return NextResponse.json({
        success: true,
        source: 'ml_api',
        algorithm: mlResult.algorithm,
        metric,
        current: values[values.length - 1],
        forecast: {
          day30: mlResult.forecast.find(f => f.step === 30)?.value || mlResult.forecast[mlResult.forecast.length - 1]?.value,
          day60: mlResult.forecast.find(f => f.step === 60)?.value,
          day90: mlResult.forecast.find(f => f.step === 90)?.value,
        },
        confidenceIntervals: mlResult.confidence_intervals,
        chartData,
        metrics: mlResult.metrics,
      });
    }

    const alpha = 0.3;
    const beta = 0.1;
    let level = values[0];
    let trend = 0;
    
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    const forecast30d = level + 30 * trend;
    const forecast60d = level + 60 * trend;
    const forecast90d = level + 90 * trend;

    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - values.reduce((a, b) => a + b, 0) / values.length, 2), 0) / values.length
    );

    const chartData = sortedDates.slice(-30).map((date, i) => ({
      date,
      actual: values[values.length - 30 + i] || values[i],
    }));

    for (let i = 1; i <= horizon; i += 10) {
      const forecastDate = new Date(sortedDates[sortedDates.length - 1]);
      forecastDate.setDate(forecastDate.getDate() + i);
      const forecastValue = level + i * trend;
      const margin = 1.96 * stdDev * Math.sqrt(i / values.length);
      
      chartData.push({
        date: forecastDate.toISOString().split('T')[0],
        forecast: Math.max(0, forecastValue),
        lower: Math.max(0, forecastValue - margin),
        upper: forecastValue + margin,
      } as any);
    }

    return NextResponse.json({
      success: true,
      source: 'statistical_fallback',
      algorithm: 'holt_winters',
      metric,
      current: values[values.length - 1],
      forecast: {
        day30: Math.max(0, forecast30d),
        day60: Math.max(0, forecast60d),
        day90: Math.max(0, forecast90d),
      },
      confidenceIntervals: {
        confidence_level: 0.95,
        method: 'prediction_interval',
      },
      chartData,
      metrics: {
        level,
        trend,
        alpha,
        beta,
        dataPoints: values.length,
      },
    });
  } catch (error) {
    console.error('ML forecasting error:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
