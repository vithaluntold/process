/**
 * Pure TypeScript ML Algorithms
 * Provides statistical and ML-like methods without Python dependencies
 */

interface DataPoint {
  value: number;
  index: number;
  metadata?: Record<string, any>;
}

interface AnomalyResult {
  index: number;
  score: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ForecastResult {
  step: number;
  value: number;
  lower: number;
  upper: number;
}

export class StatisticalAnalyzer {
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  static iqr(values: number[]): { q1: number; q3: number; iqr: number } {
    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    return { q1, q3, iqr: q3 - q1 };
  }

  static mad(values: number[]): number {
    const med = this.median(values);
    const deviations = values.map(v => Math.abs(v - med));
    return this.median(deviations);
  }
}

export class AnomalyDetector {
  static zScoreDetection(values: number[], threshold: number = 3): AnomalyResult[] {
    const mean = StatisticalAnalyzer.mean(values);
    const std = StatisticalAnalyzer.standardDeviation(values);
    
    if (std === 0) return [];

    return values.map((value, index) => {
      const zScore = Math.abs((value - mean) / std);
      const isAnomaly = zScore > threshold;
      
      let severity: AnomalyResult['severity'] = 'low';
      if (zScore > 5) severity = 'critical';
      else if (zScore > 4) severity = 'high';
      else if (zScore > 3) severity = 'medium';

      return {
        index,
        score: zScore,
        isAnomaly,
        severity,
      };
    }).filter(r => r.isAnomaly);
  }

  static modifiedZScoreDetection(values: number[], threshold: number = 3.5): AnomalyResult[] {
    const median = StatisticalAnalyzer.median(values);
    const mad = StatisticalAnalyzer.mad(values);
    
    if (mad === 0) return [];
    
    const k = 1.4826;

    return values.map((value, index) => {
      const modifiedZScore = Math.abs(0.6745 * (value - median) / mad);
      const isAnomaly = modifiedZScore > threshold;
      
      let severity: AnomalyResult['severity'] = 'low';
      if (modifiedZScore > 5) severity = 'critical';
      else if (modifiedZScore > 4) severity = 'high';
      else if (modifiedZScore > 3.5) severity = 'medium';

      return {
        index,
        score: modifiedZScore,
        isAnomaly,
        severity,
      };
    }).filter(r => r.isAnomaly);
  }

  static iqrDetection(values: number[], multiplier: number = 1.5): AnomalyResult[] {
    const { q1, q3, iqr } = StatisticalAnalyzer.iqr(values);
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    return values.map((value, index) => {
      const isAnomaly = value < lowerBound || value > upperBound;
      const distance = value < lowerBound 
        ? (lowerBound - value) / iqr 
        : value > upperBound 
          ? (value - upperBound) / iqr 
          : 0;
      
      let severity: AnomalyResult['severity'] = 'low';
      if (distance > 3) severity = 'critical';
      else if (distance > 2) severity = 'high';
      else if (distance > 1) severity = 'medium';

      return {
        index,
        score: distance,
        isAnomaly,
        severity,
      };
    }).filter(r => r.isAnomaly);
  }

  static isolationScore(values: number[], contamination: number = 0.05): AnomalyResult[] {
    const n = values.length;
    const numTrees = 100;
    const sampleSize = Math.min(256, n);
    
    const scores = new Array(n).fill(0);
    
    for (let t = 0; t < numTrees; t++) {
      const sampleIndices = this.randomSample(n, sampleSize);
      const sample = sampleIndices.map(i => values[i]);
      const min = Math.min(...sample);
      const max = Math.max(...sample);
      
      values.forEach((value, i) => {
        const depth = this.estimateDepth(value, min, max, sampleSize);
        scores[i] += depth;
      });
    }
    
    const avgScores = scores.map(s => s / numTrees);
    const c_n = this.averagePathLength(sampleSize);
    const anomalyScores = avgScores.map(s => Math.pow(2, -s / c_n));
    
    const threshold = StatisticalAnalyzer.percentile(
      anomalyScores, 
      (1 - contamination) * 100
    );

    return values.map((_, index) => {
      const score = anomalyScores[index];
      const isAnomaly = score > threshold;
      
      let severity: AnomalyResult['severity'] = 'low';
      if (score > 0.8) severity = 'critical';
      else if (score > 0.7) severity = 'high';
      else if (score > 0.6) severity = 'medium';

      return {
        index,
        score,
        isAnomaly,
        severity,
      };
    }).filter(r => r.isAnomaly);
  }

  private static randomSample(n: number, size: number): number[] {
    const indices: number[] = [];
    const available = Array.from({ length: n }, (_, i) => i);
    
    for (let i = 0; i < Math.min(size, n); i++) {
      const randIndex = Math.floor(Math.random() * available.length);
      indices.push(available[randIndex]);
      available.splice(randIndex, 1);
    }
    
    return indices;
  }

  private static estimateDepth(value: number, min: number, max: number, sampleSize: number): number {
    let depth = 0;
    let currentMin = min;
    let currentMax = max;
    const maxDepth = Math.ceil(Math.log2(sampleSize));
    
    while (depth < maxDepth && currentMax > currentMin) {
      const splitPoint = currentMin + Math.random() * (currentMax - currentMin);
      depth++;
      
      if (value < splitPoint) {
        currentMax = splitPoint;
      } else {
        currentMin = splitPoint;
      }
    }
    
    return depth;
  }

  private static averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  }
}

export class Forecaster {
  static simpleExponentialSmoothing(
    values: number[], 
    horizon: number, 
    alpha: number = 0.3
  ): ForecastResult[] {
    if (values.length === 0) return [];
    
    let level = values[0];
    
    for (let i = 1; i < values.length; i++) {
      level = alpha * values[i] + (1 - alpha) * level;
    }
    
    const std = StatisticalAnalyzer.standardDeviation(values);
    const forecast: ForecastResult[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const margin = 1.96 * std * Math.sqrt(i / values.length);
      forecast.push({
        step: i,
        value: Math.max(0, level),
        lower: Math.max(0, level - margin),
        upper: level + margin,
      });
    }
    
    return forecast;
  }

  static holtWinters(
    values: number[],
    horizon: number,
    alpha: number = 0.3,
    beta: number = 0.1
  ): ForecastResult[] {
    if (values.length < 2) return [];
    
    let level = values[0];
    let trend = values[1] - values[0];
    
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }
    
    const std = StatisticalAnalyzer.standardDeviation(values);
    const forecast: ForecastResult[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const pointForecast = level + i * trend;
      const margin = 1.96 * std * Math.sqrt(i / values.length);
      
      forecast.push({
        step: i,
        value: Math.max(0, pointForecast),
        lower: Math.max(0, pointForecast - margin),
        upper: pointForecast + margin,
      });
    }
    
    return forecast;
  }

  static linearRegression(values: number[], horizon: number): ForecastResult[] {
    if (values.length < 2) return [];
    
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = StatisticalAnalyzer.mean(values);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    const residuals = values.map((v, i) => v - (slope * i + intercept));
    const std = StatisticalAnalyzer.standardDeviation(residuals);
    
    const forecast: ForecastResult[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const x = n - 1 + i;
      const pointForecast = slope * x + intercept;
      const margin = 1.645 * std * Math.sqrt(1 + 1/n + Math.pow(x - xMean, 2) / denominator);
      
      forecast.push({
        step: i,
        value: Math.max(0, pointForecast),
        lower: Math.max(0, pointForecast - margin),
        upper: pointForecast + margin,
      });
    }
    
    return forecast;
  }

  static movingAverage(values: number[], horizon: number, windowSize: number = 7): ForecastResult[] {
    if (values.length === 0) return [];
    
    const window = Math.min(windowSize, values.length);
    const recentValues = values.slice(-window);
    const ma = StatisticalAnalyzer.mean(recentValues);
    const std = StatisticalAnalyzer.standardDeviation(recentValues);
    
    const forecast: ForecastResult[] = [];
    
    for (let i = 1; i <= horizon; i++) {
      const margin = 1.28 * std * Math.sqrt(i / window);
      
      forecast.push({
        step: i,
        value: Math.max(0, ma),
        lower: Math.max(0, ma - margin),
        upper: ma + margin,
      });
    }
    
    return forecast;
  }
}

export class MonteCarloSimulator {
  static simulate(
    baseCycleTime: number,
    variance: number,
    numSimulations: number = 1000
  ): {
    samples: number[];
    statistics: {
      mean: number;
      median: number;
      stdDev: number;
      min: number;
      max: number;
    };
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  } {
    const samples: number[] = [];
    
    for (let i = 0; i < numSimulations; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const value = Math.max(1, baseCycleTime + z * baseCycleTime * variance);
      samples.push(value);
    }
    
    samples.sort((a, b) => a - b);
    
    return {
      samples: samples.slice(0, 100),
      statistics: {
        mean: StatisticalAnalyzer.mean(samples),
        median: StatisticalAnalyzer.median(samples),
        stdDev: StatisticalAnalyzer.standardDeviation(samples),
        min: Math.min(...samples),
        max: Math.max(...samples),
      },
      percentiles: {
        p10: StatisticalAnalyzer.percentile(samples, 10),
        p25: StatisticalAnalyzer.percentile(samples, 25),
        p50: StatisticalAnalyzer.percentile(samples, 50),
        p75: StatisticalAnalyzer.percentile(samples, 75),
        p90: StatisticalAnalyzer.percentile(samples, 90),
        p95: StatisticalAnalyzer.percentile(samples, 95),
        p99: StatisticalAnalyzer.percentile(samples, 99),
      },
    };
  }

  static compareScenarios(
    baseline: { cycleTime: number; variance: number },
    optimized: { cycleTime: number; variance: number },
    numSimulations: number = 1000
  ): {
    baseline: ReturnType<typeof MonteCarloSimulator.simulate>;
    optimized: ReturnType<typeof MonteCarloSimulator.simulate>;
    improvement: {
      cycleTimeReduction: number;
      varianceReduction: number;
      confidenceLevel: number;
    };
  } {
    const baselineResult = this.simulate(baseline.cycleTime, baseline.variance, numSimulations);
    const optimizedResult = this.simulate(optimized.cycleTime, optimized.variance, numSimulations);
    
    const cycleTimeReduction = ((baselineResult.statistics.mean - optimizedResult.statistics.mean) / baselineResult.statistics.mean) * 100;
    const varianceReduction = ((baselineResult.statistics.stdDev - optimizedResult.statistics.stdDev) / baselineResult.statistics.stdDev) * 100;
    
    let betterCount = 0;
    for (let i = 0; i < Math.min(baselineResult.samples.length, optimizedResult.samples.length); i++) {
      if (optimizedResult.samples[i] < baselineResult.samples[i]) {
        betterCount++;
      }
    }
    const confidenceLevel = betterCount / Math.min(baselineResult.samples.length, optimizedResult.samples.length);
    
    return {
      baseline: baselineResult,
      optimized: optimizedResult,
      improvement: {
        cycleTimeReduction,
        varianceReduction,
        confidenceLevel,
      },
    };
  }
}

export type { DataPoint, AnomalyResult, ForecastResult };
