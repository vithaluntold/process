/**
 * ML Forecasting API - Enhanced with Python ML Backend + TypeScript Fallbacks
 */

import { NextRequest, NextResponse } from 'next/server';
import getCurrentUser from '@/lib/auth';
import { withApiGuards } from '@/lib/api-guards';
import { API_ANALYSIS_LIMIT } from '@/lib/rate-limiter';
import { db } from '@/lib/db';
import { eventLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateForecastWithML } from '@/lib/ml-client';
import { Forecaster } from '@/lib/ts-ml-algorithms';

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

    let forecastResults;
    let algorithmUsed = algorithm;

    if (algorithm === 'linear_regression') {
      forecastResults = Forecaster.linearRegression(values, horizon);
    } else if (algorithm === 'moving_average') {
      forecastResults = Forecaster.movingAverage(values, horizon, 7);
    } else {
      forecastResults = Forecaster.holtWinters(values, horizon);
      algorithmUsed = 'holt_winters';
    }

    const chartData: Array<any> = sortedDates.slice(-30).map((date, i) => ({
      date,
      actual: values[values.length - 30 + i] || values[i],
    }));

    forecastResults.forEach(f => {
      const forecastDate = new Date(sortedDates[sortedDates.length - 1]);
      forecastDate.setDate(forecastDate.getDate() + f.step);
      
      if (f.step % 10 === 0 || f.step <= 10) {
        chartData.push({
          date: forecastDate.toISOString().split('T')[0],
          forecast: f.value,
          lower: f.lower,
          upper: f.upper,
        });
      }
    });

    const day30 = forecastResults.find(f => f.step === 30) || forecastResults[Math.min(29, forecastResults.length - 1)];
    const day60 = forecastResults.find(f => f.step === 60) || forecastResults[Math.min(59, forecastResults.length - 1)];
    const day90 = forecastResults.find(f => f.step === 90) || forecastResults[forecastResults.length - 1];

    return NextResponse.json({
      success: true,
      source: 'typescript_ml',
      algorithm: algorithmUsed,
      metric,
      current: values[values.length - 1],
      forecast: {
        day30: day30?.value,
        day60: day60?.value,
        day90: day90?.value,
      },
      confidenceIntervals: {
        confidence_level: 0.95,
        method: 'prediction_interval',
      },
      chartData,
      metrics: {
        algorithm: algorithmUsed,
        dataPoints: values.length,
        horizon,
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
