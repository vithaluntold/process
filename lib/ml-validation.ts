/**
 * ML Algorithm Validation Utilities
 * Provides validation and testing functions for ML algorithms
 */

import { AnomalyDetector, Forecaster, MonteCarloSimulator, StatisticalAnalyzer } from './ts-ml-algorithms';

interface ValidationResult {
  algorithm: string;
  passed: boolean;
  metrics: Record<string, any>;
  errors: string[];
}

export function validateStatisticalAnalyzer(): ValidationResult {
  const errors: string[] = [];
  const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  try {
    const mean = StatisticalAnalyzer.mean(testData);
    if (Math.abs(mean - 5.5) > 0.001) errors.push(`Mean incorrect: got ${mean}, expected 5.5`);
    
    const median = StatisticalAnalyzer.median(testData);
    if (Math.abs(median - 5.5) > 0.001) errors.push(`Median incorrect: got ${median}, expected 5.5`);
    
    const stdDev = StatisticalAnalyzer.standardDeviation(testData);
    if (Math.abs(stdDev - 2.8723) > 0.01) errors.push(`StdDev incorrect: got ${stdDev}`);
    
    const p25 = StatisticalAnalyzer.percentile(testData, 25);
    if (p25 < 2 || p25 > 4) errors.push(`P25 out of range: got ${p25}`);
    
    const p75 = StatisticalAnalyzer.percentile(testData, 75);
    if (p75 < 7 || p75 > 9) errors.push(`P75 out of range: got ${p75}`);
    
    return {
      algorithm: 'StatisticalAnalyzer',
      passed: errors.length === 0,
      metrics: { mean, median, stdDev, p25, p75 },
      errors,
    };
  } catch (e: any) {
    return {
      algorithm: 'StatisticalAnalyzer',
      passed: false,
      metrics: {},
      errors: [e.message],
    };
  }
}

export function validateAnomalyDetector(): ValidationResult {
  const errors: string[] = [];
  const normalData = [10, 11, 9, 10, 12, 11, 10, 9, 11, 10];
  const dataWithAnomaly = [...normalData, 100];
  
  try {
    const zScoreResults = AnomalyDetector.zScoreDetection(dataWithAnomaly, 3);
    if (zScoreResults.length === 0) {
      errors.push('Z-Score failed to detect obvious anomaly (100 in normal data)');
    }
    
    const iqrResults = AnomalyDetector.iqrDetection(dataWithAnomaly, 1.5);
    if (iqrResults.length === 0) {
      errors.push('IQR failed to detect obvious anomaly');
    }
    
    const isolationResults = AnomalyDetector.isolationScore(dataWithAnomaly, 0.1);
    
    const noAnomalyZScore = AnomalyDetector.zScoreDetection(normalData, 3);
    if (noAnomalyZScore.length > 0) {
      errors.push('Z-Score detected false positives in normal data');
    }
    
    return {
      algorithm: 'AnomalyDetector',
      passed: errors.length === 0,
      metrics: {
        zScoreAnomalies: zScoreResults.length,
        iqrAnomalies: iqrResults.length,
        isolationAnomalies: isolationResults.length,
      },
      errors,
    };
  } catch (e: any) {
    return {
      algorithm: 'AnomalyDetector',
      passed: false,
      metrics: {},
      errors: [e.message],
    };
  }
}

export function validateForecaster(): ValidationResult {
  const errors: string[] = [];
  const trendingData = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
  
  try {
    const hwForecast = Forecaster.holtWinters(trendingData, 5);
    if (hwForecast.length !== 5) {
      errors.push(`Holt-Winters returned ${hwForecast.length} points, expected 5`);
    }
    if (hwForecast[0]?.value <= trendingData[trendingData.length - 1]) {
      errors.push('Holt-Winters failed to capture upward trend');
    }
    
    const lrForecast = Forecaster.linearRegression(trendingData, 5);
    if (lrForecast.length !== 5) {
      errors.push(`Linear Regression returned ${lrForecast.length} points, expected 5`);
    }
    
    const expectedNext = 30;
    if (Math.abs((lrForecast[0]?.value || 0) - expectedNext) > 2) {
      errors.push(`Linear Regression forecast inaccurate: got ${lrForecast[0]?.value}, expected ~${expectedNext}`);
    }
    
    const maForecast = Forecaster.movingAverage(trendingData, 5, 3);
    if (maForecast.length !== 5) {
      errors.push(`Moving Average returned ${maForecast.length} points, expected 5`);
    }
    
    return {
      algorithm: 'Forecaster',
      passed: errors.length === 0,
      metrics: {
        hwFirstValue: hwForecast[0]?.value,
        lrFirstValue: lrForecast[0]?.value,
        maFirstValue: maForecast[0]?.value,
      },
      errors,
    };
  } catch (e: any) {
    return {
      algorithm: 'Forecaster',
      passed: false,
      metrics: {},
      errors: [e.message],
    };
  }
}

export function validateMonteCarloSimulator(): ValidationResult {
  const errors: string[] = [];
  
  try {
    const result = MonteCarloSimulator.simulate(100, 0.2, 1000);
    
    if (result.samples.length === 0) {
      errors.push('Monte Carlo returned no samples');
    }
    
    if (Math.abs(result.statistics.mean - 100) > 20) {
      errors.push(`Mean deviates too much from base: got ${result.statistics.mean}`);
    }
    
    if (result.percentiles.p50 <= 0) {
      errors.push('Median is zero or negative');
    }
    
    if (result.percentiles.p10 >= result.percentiles.p90) {
      errors.push('Percentile ordering incorrect');
    }
    
    const comparison = MonteCarloSimulator.compareScenarios(
      { cycleTime: 100, variance: 0.3 },
      { cycleTime: 80, variance: 0.2 },
      500
    );
    
    if (comparison.improvement.cycleTimeReduction <= 0) {
      errors.push('Scenario comparison failed to show improvement');
    }
    
    return {
      algorithm: 'MonteCarloSimulator',
      passed: errors.length === 0,
      metrics: {
        mean: result.statistics.mean,
        median: result.statistics.median,
        p10: result.percentiles.p10,
        p90: result.percentiles.p90,
        improvement: comparison.improvement.cycleTimeReduction,
      },
      errors,
    };
  } catch (e: any) {
    return {
      algorithm: 'MonteCarloSimulator',
      passed: false,
      metrics: {},
      errors: [e.message],
    };
  }
}

export function runAllValidations(): {
  passed: boolean;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
} {
  const results = [
    validateStatisticalAnalyzer(),
    validateAnomalyDetector(),
    validateForecaster(),
    validateMonteCarloSimulator(),
  ];
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    passed: failed === 0,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  };
}
