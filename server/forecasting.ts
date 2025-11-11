import { db } from "@/lib/db";
import { eventLogs } from "@/shared/schema";
import { eq, sql, and, gte } from "drizzle-orm";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface ForecastMetric {
  metric: string;
  current: number;
  forecast30d: number;
  forecast60d: number;
  forecast90d: number;
  lower30d: number;
  upper30d: number;
  lower60d: number;
  upper60d: number;
  lower90d: number;
  upper90d: number;
  confidence: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient';
  dataPoints: number;
  modelType: 'holt-winters' | 'linear-regression' | 'moving-average' | 'heuristic';
}

interface ForecastReport {
  processId: number;
  generatedAt: string;
  cycleTime: ForecastMetric;
  throughput: ForecastMetric;
  resourceUtilization: ForecastMetric;
  bottlenecks: Array<{
    activity: string;
    currentUtilization: number;
    forecast30d: number;
    forecast60d: number;
    forecast90d: number;
  }>;
  chartData: Array<{
    date: string;
    cycletime: number;
    forecast?: number;
    lower?: number;
    upper?: number;
  }>;
}

export class ForecastingService {
  async generateForecast(processId: number): Promise<ForecastReport> {
    const events = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.processId, processId))
      .orderBy(eventLogs.timestamp);

    if (events.length === 0) {
      throw new Error("No event logs found for forecasting");
    }

    const timeSeriesData = this.aggregateTimeSeries(events);
    
    const cycleTimeData = this.calculateCycleTimeTimeSeries(events);
    const throughputData = this.calculateThroughputTimeSeries(events);
    const resourceUtilData = this.calculateResourceUtilizationTimeSeries(events);

    const cycleTimeForecast = this.forecastMetric(
      cycleTimeData,
      "Cycle Time"
    );
    
    const throughputForecast = this.forecastMetric(
      throughputData,
      "Throughput"
    );

    const resourceForecast = this.forecastMetric(
      resourceUtilData,
      "Resource Utilization"
    );

    const bottleneckForecasts = this.forecastBottlenecks(events);

    const chartData = this.buildChartData(cycleTimeData, cycleTimeForecast);

    return {
      processId,
      generatedAt: new Date().toISOString(),
      cycleTime: cycleTimeForecast,
      throughput: throughputForecast,
      resourceUtilization: resourceForecast,
      bottlenecks: bottleneckForecasts,
      chartData,
    };
  }

  private calculateCycleTimeTimeSeries(events: any[]): TimeSeriesData[] {
    const caseGroups = new Map<string, any[]>();
    
    for (const event of events) {
      if (!caseGroups.has(event.caseId)) {
        caseGroups.set(event.caseId, []);
      }
      caseGroups.get(event.caseId)!.push(event);
    }

    const dailyData = new Map<string, number[]>();
    
    for (const [caseId, caseEvents] of caseGroups) {
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

    const timeSeries: TimeSeriesData[] = [];
    for (const [date, values] of dailyData) {
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      timeSeries.push({ date, value: avgValue });
    }

    return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateThroughputTimeSeries(events: any[]): TimeSeriesData[] {
    const dailyData = new Map<string, Set<string>>();
    
    for (const event of events) {
      const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, new Set());
      }
      dailyData.get(dateKey)!.add(event.caseId);
    }

    const timeSeries: TimeSeriesData[] = [];
    for (const [date, cases] of dailyData) {
      timeSeries.push({ date, value: cases.size });
    }

    return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateResourceUtilizationTimeSeries(events: any[]): TimeSeriesData[] {
    const dailyResources = new Map<string, Set<string>>();
    const dailyActivities = new Map<string, number>();
    
    for (const event of events) {
      if (!event.resource) continue;
      
      const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyResources.has(dateKey)) {
        dailyResources.set(dateKey, new Set());
        dailyActivities.set(dateKey, 0);
      }
      dailyResources.get(dateKey)!.add(event.resource);
      dailyActivities.set(dateKey, dailyActivities.get(dateKey)! + 1);
    }

    const timeSeries: TimeSeriesData[] = [];
    for (const [date, resources] of dailyResources) {
      const activities = dailyActivities.get(date)!;
      const utilization = resources.size > 0 ? (activities / resources.size) * 10 : 0;
      timeSeries.push({ date, value: Math.min(100, utilization) });
    }

    return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
  }

  private forecastMetric(
    data: TimeSeriesData[],
    metricName: string
  ): ForecastMetric {
    if (data.length === 0) {
      return this.buildInsufficientDataForecast(metricName);
    }

    const values = data.map(d => d.value);
    const current = values[values.length - 1] || 0;
    const dataPoints = data.length;

    let modelType: 'holt-winters' | 'linear-regression' | 'moving-average' | 'heuristic' = 'heuristic';
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'insufficient' = 'insufficient';
    
    if (dataPoints < 6) {
      dataQuality = 'insufficient';
      return this.buildHeuristicForecast(current, metricName, dataPoints);
    } else if (dataPoints < 12) {
      dataQuality = 'fair';
      modelType = 'moving-average';
      return this.movingAverageForecast(values, metricName, dataPoints, dataQuality);
    } else if (dataPoints < 30) {
      dataQuality = 'good';
      modelType = 'linear-regression';
      return this.linearRegressionForecast(values, metricName, dataPoints, dataQuality);
    } else {
      dataQuality = 'excellent';
      modelType = 'holt-winters';
      return this.holtWintersForecast(values, metricName, dataPoints, dataQuality);
    }
  }

  private holtWintersForecast(
    values: number[],
    metricName: string,
    dataPoints: number,
    dataQuality: string
  ): ForecastMetric {
    const alpha = 0.3;
    const beta = 0.1;
    const current = values[values.length - 1];
    
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

    const stdDev = this.calculateStdDev(values);
    const margin = 1.96 * stdDev;

    return {
      metric: metricName,
      current,
      forecast30d: Math.max(0, forecast30d),
      forecast60d: Math.max(0, forecast60d),
      forecast90d: Math.max(0, forecast90d),
      lower30d: Math.max(0, forecast30d - margin),
      upper30d: forecast30d + margin,
      lower60d: Math.max(0, forecast60d - margin * 1.2),
      upper60d: forecast60d + margin * 1.2,
      lower90d: Math.max(0, forecast90d - margin * 1.5),
      upper90d: forecast90d + margin * 1.5,
      confidence: 0.95,
      dataQuality: dataQuality as any,
      dataPoints,
      modelType: 'holt-winters',
    };
  }

  private linearRegressionForecast(
    values: number[],
    metricName: string,
    dataPoints: number,
    dataQuality: string
  ): ForecastMetric {
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const current = values[n - 1];
    const forecast30d = intercept + slope * (n + 30);
    const forecast60d = intercept + slope * (n + 60);
    const forecast90d = intercept + slope * (n + 90);

    const stdDev = this.calculateStdDev(values);
    const margin = 1.645 * stdDev;

    return {
      metric: metricName,
      current,
      forecast30d: Math.max(0, forecast30d),
      forecast60d: Math.max(0, forecast60d),
      forecast90d: Math.max(0, forecast90d),
      lower30d: Math.max(0, forecast30d - margin),
      upper30d: forecast30d + margin,
      lower60d: Math.max(0, forecast60d - margin * 1.3),
      upper60d: forecast60d + margin * 1.3,
      lower90d: Math.max(0, forecast90d - margin * 1.6),
      upper90d: forecast90d + margin * 1.6,
      confidence: 0.90,
      dataQuality: dataQuality as any,
      dataPoints,
      modelType: 'linear-regression',
    };
  }

  private movingAverageForecast(
    values: number[],
    metricName: string,
    dataPoints: number,
    dataQuality: string
  ): ForecastMetric {
    const window = Math.min(7, Math.floor(values.length / 2));
    const recent = values.slice(-window);
    const ma = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    const current = values[values.length - 1];
    const forecast30d = ma;
    const forecast60d = ma;
    const forecast90d = ma;

    const stdDev = this.calculateStdDev(recent);
    const margin = 1.28 * stdDev;

    return {
      metric: metricName,
      current,
      forecast30d: Math.max(0, forecast30d),
      forecast60d: Math.max(0, forecast60d),
      forecast90d: Math.max(0, forecast90d),
      lower30d: Math.max(0, forecast30d - margin),
      upper30d: forecast30d + margin,
      lower60d: Math.max(0, forecast60d - margin * 1.5),
      upper60d: forecast60d + margin * 1.5,
      lower90d: Math.max(0, forecast90d - margin * 2),
      upper90d: forecast90d + margin * 2,
      confidence: 0.80,
      dataQuality: dataQuality as any,
      dataPoints,
      modelType: 'moving-average',
    };
  }

  private buildHeuristicForecast(
    current: number,
    metricName: string,
    dataPoints: number
  ): ForecastMetric {
    return {
      metric: metricName,
      current,
      forecast30d: current,
      forecast60d: current,
      forecast90d: current,
      lower30d: current * 0.7,
      upper30d: current * 1.3,
      lower60d: current * 0.6,
      upper60d: current * 1.4,
      lower90d: current * 0.5,
      upper90d: current * 1.5,
      confidence: 0.60,
      dataQuality: 'insufficient',
      dataPoints,
      modelType: 'heuristic',
    };
  }

  private buildInsufficientDataForecast(metricName: string): ForecastMetric {
    return {
      metric: metricName,
      current: 0,
      forecast30d: 0,
      forecast60d: 0,
      forecast90d: 0,
      lower30d: 0,
      upper30d: 0,
      lower60d: 0,
      upper60d: 0,
      lower90d: 0,
      upper90d: 0,
      confidence: 0,
      dataQuality: 'insufficient',
      dataPoints: 0,
      modelType: 'heuristic',
    };
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private forecastBottlenecks(events: any[]): Array<{
    activity: string;
    currentUtilization: number;
    forecast30d: number;
    forecast60d: number;
    forecast90d: number;
  }> {
    const activityCounts = new Map<string, number>();
    
    for (const event of events) {
      activityCounts.set(event.activity, (activityCounts.get(event.activity) || 0) + 1);
    }

    const bottlenecks: Array<any> = [];
    const sortedActivities = Array.from(activityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [activity, count] of sortedActivities) {
      const utilization = Math.min(100, (count / events.length) * 100);
      bottlenecks.push({
        activity,
        currentUtilization: utilization,
        forecast30d: utilization * 1.05,
        forecast60d: utilization * 1.1,
        forecast90d: utilization * 1.15,
      });
    }

    return bottlenecks;
  }

  private aggregateTimeSeries(events: any[]): any {
    return {};
  }

  private buildChartData(
    historicalData: TimeSeriesData[],
    forecast: ForecastMetric
  ): Array<{
    date: string;
    cycletime: number;
    forecast?: number;
    lower?: number;
    upper?: number;
  }> {
    const chartData: any[] = [];

    for (const dataPoint of historicalData.slice(-30)) {
      chartData.push({
        date: dataPoint.date,
        cycletime: dataPoint.value,
      });
    }

    const lastDate = historicalData.length > 0 
      ? new Date(historicalData[historicalData.length - 1].date)
      : new Date();

    for (let i = 1; i <= 90; i += 10) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      let forecastValue: number;
      let lower: number;
      let upper: number;
      
      if (i <= 30) {
        forecastValue = forecast.forecast30d;
        lower = forecast.lower30d;
        upper = forecast.upper30d;
      } else if (i <= 60) {
        forecastValue = forecast.forecast60d;
        lower = forecast.lower60d;
        upper = forecast.upper60d;
      } else {
        forecastValue = forecast.forecast90d;
        lower = forecast.lower90d;
        upper = forecast.upper90d;
      }

      chartData.push({
        date: forecastDate.toISOString().split('T')[0],
        forecast: forecastValue,
        lower,
        upper,
      });
    }

    return chartData;
  }
}
