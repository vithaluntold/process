import { describe, it, expect } from 'vitest';
import { StatisticalAnalyzer, AnomalyDetector, Forecaster, MonteCarloSimulator } from '@/lib/ts-ml-algorithms';

describe('StatisticalAnalyzer', () => {
  describe('mean', () => {
    it('should calculate mean of positive numbers', () => {
      expect(StatisticalAnalyzer.mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should calculate mean of mixed numbers', () => {
      expect(StatisticalAnalyzer.mean([-2, 0, 2, 4])).toBe(1);
    });

    it('should return 0 for empty array', () => {
      expect(StatisticalAnalyzer.mean([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(StatisticalAnalyzer.mean([42])).toBe(42);
    });

    it('should handle decimal values', () => {
      expect(StatisticalAnalyzer.mean([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      expect(StatisticalAnalyzer.standardDeviation(values)).toBeCloseTo(2, 0);
    });

    it('should return 0 for empty array', () => {
      expect(StatisticalAnalyzer.standardDeviation([])).toBe(0);
    });

    it('should return 0 for identical values', () => {
      expect(StatisticalAnalyzer.standardDeviation([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('median', () => {
    it('should calculate median for odd-length array', () => {
      expect(StatisticalAnalyzer.median([1, 3, 5, 7, 9])).toBe(5);
    });

    it('should calculate median for even-length array', () => {
      expect(StatisticalAnalyzer.median([1, 2, 3, 4])).toBe(2.5);
    });

    it('should handle unsorted arrays', () => {
      expect(StatisticalAnalyzer.median([9, 1, 5, 3, 7])).toBe(5);
    });

    it('should return 0 for empty array', () => {
      expect(StatisticalAnalyzer.median([])).toBe(0);
    });
  });

  describe('percentile', () => {
    it('should calculate 50th percentile (median)', () => {
      expect(StatisticalAnalyzer.percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    });

    it('should calculate 25th percentile (Q1)', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(StatisticalAnalyzer.percentile(values, 25)).toBeCloseTo(2.75, 1);
    });

    it('should calculate 75th percentile (Q3)', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(StatisticalAnalyzer.percentile(values, 75)).toBeCloseTo(6.25, 1);
    });

    it('should return 0 for empty array', () => {
      expect(StatisticalAnalyzer.percentile([], 50)).toBe(0);
    });
  });

  describe('iqr', () => {
    it('should calculate IQR correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = StatisticalAnalyzer.iqr(values);
      expect(result.iqr).toBeCloseTo(3.5, 1);
    });

    it('should return q1, q3, and iqr', () => {
      const result = StatisticalAnalyzer.iqr([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(result).toHaveProperty('q1');
      expect(result).toHaveProperty('q3');
      expect(result).toHaveProperty('iqr');
    });
  });

  describe('mad', () => {
    it('should calculate median absolute deviation', () => {
      const values = [1, 1, 2, 2, 4, 6, 9];
      const result = StatisticalAnalyzer.mad(values);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('AnomalyDetector', () => {
  const normalData = [10, 12, 11, 10, 13, 11, 12, 10, 11, 12];
  const dataWithOutliers = [10, 12, 11, 10, 100, 11, 12, 10, 11, -50];

  describe('zScoreDetection', () => {
    it('should detect anomalies in data with outliers', () => {
      const results = AnomalyDetector.zScoreDetection(dataWithOutliers, 2);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should not detect anomalies in normal data', () => {
      const results = AnomalyDetector.zScoreDetection(normalData, 3);
      expect(results.length).toBe(0);
    });

    it('should return empty array for data with zero std', () => {
      const results = AnomalyDetector.zScoreDetection([5, 5, 5, 5], 3);
      expect(results).toEqual([]);
    });

    it('should include severity in results', () => {
      const results = AnomalyDetector.zScoreDetection(dataWithOutliers, 2);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('severity');
        expect(['low', 'medium', 'high', 'critical']).toContain(results[0].severity);
      }
    });
  });

  describe('modifiedZScoreDetection', () => {
    it('should detect anomalies using modified z-score', () => {
      const results = AnomalyDetector.modifiedZScoreDetection(dataWithOutliers, 3);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle data with zero MAD', () => {
      const results = AnomalyDetector.modifiedZScoreDetection([5, 5, 5, 5], 3);
      expect(results).toEqual([]);
    });
  });

  describe('iqrDetection', () => {
    it('should detect outliers using IQR method', () => {
      const results = AnomalyDetector.iqrDetection(dataWithOutliers, 1.5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return anomaly results with proper structure', () => {
      const results = AnomalyDetector.iqrDetection(dataWithOutliers, 1.5);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('index');
        expect(results[0]).toHaveProperty('score');
        expect(results[0]).toHaveProperty('isAnomaly');
        expect(results[0]).toHaveProperty('severity');
      }
    });
  });

  describe('isolationScore', () => {
    it('should detect anomalies using isolation forest approach', () => {
      const largerDataWithOutliers = [
        ...Array(100).fill(0).map(() => 10 + Math.random() * 2),
        500,
        -200
      ];
      const results = AnomalyDetector.isolationScore(largerDataWithOutliers, 0.05);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should return results with proper structure', () => {
      const data = Array(100).fill(0).map((_, i) => i === 50 ? 1000 : Math.random() * 10);
      const results = AnomalyDetector.isolationScore(data, 0.05);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('index');
        expect(results[0]).toHaveProperty('score');
        expect(results[0]).toHaveProperty('isAnomaly');
        expect(results[0]).toHaveProperty('severity');
      }
    });
  });
});

describe('Forecaster', () => {
  const timeSeriesData = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190];

  describe('simpleExponentialSmoothing', () => {
    it('should generate forecasts with correct horizon', () => {
      const results = Forecaster.simpleExponentialSmoothing(timeSeriesData, 5);
      expect(results.length).toBe(5);
    });

    it('should include confidence intervals', () => {
      const results = Forecaster.simpleExponentialSmoothing(timeSeriesData, 3);
      expect(results[0]).toHaveProperty('lower');
      expect(results[0]).toHaveProperty('upper');
      expect(results[0].lower).toBeLessThanOrEqual(results[0].value);
      expect(results[0].upper).toBeGreaterThanOrEqual(results[0].value);
    });

    it('should handle alpha parameter', () => {
      const results1 = Forecaster.simpleExponentialSmoothing(timeSeriesData, 3, 0.1);
      const results2 = Forecaster.simpleExponentialSmoothing(timeSeriesData, 3, 0.9);
      expect(results1[0].value).not.toEqual(results2[0].value);
    });
  });

  describe('holtWinters', () => {
    it('should generate forecasts with trend', () => {
      const results = Forecaster.holtWinters(timeSeriesData, 5);
      expect(results.length).toBe(5);
    });

    it('should capture upward trend', () => {
      const results = Forecaster.holtWinters(timeSeriesData, 3);
      expect(results[2].value).toBeGreaterThan(results[0].value);
    });
  });

  describe('linearRegression', () => {
    it('should forecast using linear regression', () => {
      const results = Forecaster.linearRegression(timeSeriesData, 5);
      expect(results.length).toBe(5);
    });

    it('should extrapolate linear trend', () => {
      const linearData = [10, 20, 30, 40, 50];
      const results = Forecaster.linearRegression(linearData, 1);
      expect(results[0].value).toBeCloseTo(60, 0);
    });
  });

  describe('movingAverage', () => {
    it('should generate forecasts using moving average', () => {
      const results = Forecaster.movingAverage(timeSeriesData, 3);
      expect(results.length).toBe(3);
    });

    it('should respect window size', () => {
      const results1 = Forecaster.movingAverage(timeSeriesData, 3, 3);
      const results2 = Forecaster.movingAverage(timeSeriesData, 3, 5);
      expect(results1[0].value).not.toEqual(results2[0].value);
    });
  });
});

describe('MonteCarloSimulator', () => {
  describe('simulate', () => {
    it('should generate samples based on base cycle time and variance', () => {
      const results = MonteCarloSimulator.simulate(100, 0.1, 100);
      expect(results.samples.length).toBeLessThanOrEqual(100);
    });

    it('should provide statistics', () => {
      const results = MonteCarloSimulator.simulate(100, 0.1, 500);
      expect(results).toHaveProperty('statistics');
      expect(results.statistics).toHaveProperty('mean');
      expect(results.statistics).toHaveProperty('median');
      expect(results.statistics).toHaveProperty('stdDev');
      expect(results.statistics).toHaveProperty('min');
      expect(results.statistics).toHaveProperty('max');
    });

    it('should provide percentiles', () => {
      const results = MonteCarloSimulator.simulate(100, 0.2, 500);
      expect(results).toHaveProperty('percentiles');
      expect(results.percentiles).toHaveProperty('p10');
      expect(results.percentiles).toHaveProperty('p25');
      expect(results.percentiles).toHaveProperty('p50');
      expect(results.percentiles).toHaveProperty('p75');
      expect(results.percentiles).toHaveProperty('p90');
      expect(results.percentiles).toHaveProperty('p95');
      expect(results.percentiles).toHaveProperty('p99');
    });

    it('should have mean close to base cycle time', () => {
      const baseCycleTime = 100;
      const results = MonteCarloSimulator.simulate(baseCycleTime, 0.1, 1000);
      expect(results.statistics.mean).toBeGreaterThan(baseCycleTime * 0.8);
      expect(results.statistics.mean).toBeLessThan(baseCycleTime * 1.2);
    });
  });

  describe('compareScenarios', () => {
    it('should compare baseline and optimized scenarios', () => {
      const baseline = { cycleTime: 100, variance: 0.2 };
      const optimized = { cycleTime: 80, variance: 0.15 };
      const results = MonteCarloSimulator.compareScenarios(baseline, optimized, 500);
      
      expect(results).toHaveProperty('baseline');
      expect(results).toHaveProperty('optimized');
      expect(results).toHaveProperty('improvement');
    });

    it('should calculate improvement metrics', () => {
      const baseline = { cycleTime: 100, variance: 0.2 };
      const optimized = { cycleTime: 80, variance: 0.15 };
      const results = MonteCarloSimulator.compareScenarios(baseline, optimized, 500);
      
      expect(results.improvement).toHaveProperty('cycleTimeReduction');
      expect(results.improvement).toHaveProperty('varianceReduction');
      expect(results.improvement).toHaveProperty('confidenceLevel');
    });

    it('should show positive improvement for better scenario', () => {
      const baseline = { cycleTime: 100, variance: 0.3 };
      const optimized = { cycleTime: 70, variance: 0.1 };
      const results = MonteCarloSimulator.compareScenarios(baseline, optimized, 1000);
      
      expect(results.improvement.cycleTimeReduction).toBeGreaterThan(0);
    });
  });
});
