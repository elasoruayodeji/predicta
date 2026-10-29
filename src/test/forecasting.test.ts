import { describe, it, expect } from 'vitest';
import { runForecast, runModelComparison } from '../engine/forecasting';
import { generateTestPrices } from './fixtures';
import { ForecastHorizon, ModelType } from '../types';

describe('Forecasting Orchestration Engine', () => {
  describe('runForecast', () => {
    it('should generate forecast for valid inputs', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.modelId).toBe('ridge_regression');
      expect(result.horizon).toBe(5);
      expect(result.estimatedReturn).toBeDefined();
      expect(result.estimatedPrice).toBeDefined();
      expect(result.lowerBound).toBeDefined();
      expect(result.upperBound).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should return insufficient_data status for small dataset', () => {
      const prices = generateTestPrices(50, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.status).toBe('insufficient_data');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown model', () => {
      const prices = generateTestPrices(300, 100, 42);
      expect(() => runForecast(prices, 5, 'unknown' as ModelType)).toThrow('Unknown model');
    });

    it('should throw error for unsupported horizon', () => {
      const prices = generateTestPrices(300, 100, 42);
      expect(() => runForecast(prices, 10 as ForecastHorizon, 'ridge_regression')).toThrow('does not support horizon');
    });

    it('should calculate uncertainty bounds', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.lowerBound).toBeLessThan(result.estimatedPrice);
      expect(result.upperBound).toBeGreaterThan(result.estimatedPrice);
      expect(result.lowerBound).toBeGreaterThanOrEqual(0);
    });

    it('should include training period information', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.trainingPeriod.start).toBeDefined();
      expect(result.trainingPeriod.end).toBeDefined();
      expect(result.trainedAt).toBeDefined();
    });

    it('should include last observed price and date', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.lastObservedPrice).toBeGreaterThan(0);
      expect(result.lastObservedDate).toBeDefined();
    });

    it('should respect training window parameter', () => {
      const prices = generateTestPrices(500, 100, 42);
      const result1 = runForecast(prices, 5, 'ridge_regression', 100);
      const result2 = runForecast(prices, 5, 'ridge_regression', 400);

      // Both should produce valid forecasts
      expect(isFinite(result1.estimatedReturn)).toBe(true);
      expect(isFinite(result2.estimatedReturn)).toBe(true);
    });

    it('should add warnings for long horizons', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result20 = runForecast(prices, 20, 'ridge_regression');
      const result60 = runForecast(prices, 60, 'ridge_regression');

      expect(result20.warnings.some(w => w.includes('Longer forecast'))).toBe(true);
      expect(result60.warnings.some(w => w.includes('60-session'))).toBe(true);
    });

    it('should add warnings for short data', () => {
      const prices = generateTestPrices(200, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      expect(result.warnings.some(w => w.includes('Less than one year'))).toBe(true);
    });

    it('should set experimental status when underperforming baseline', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = runForecast(prices, 5, 'ridge_regression');

      // If baseline improvement is negative, status should be experimental
      if (result.metrics.baselineImprovement < 0) {
        expect(result.status).toBe('experimental');
      }
    });

    it('should work with all model types', () => {
      const prices = generateTestPrices(300, 100, 42);
      const modelIds: ModelType[] = ['persistence', 'historical_average', 'linear_regression', 'ridge_regression', 'gradient_boosting'];

      modelIds.forEach(modelId => {
        const result = runForecast(prices, 5, modelId);
        expect(result.modelId).toBe(modelId);
        expect(isFinite(result.estimatedReturn)).toBe(true);
      });
    });

    it('should work with all horizons', () => {
      const prices = generateTestPrices(300, 100, 42);
      const horizons: ForecastHorizon[] = [1, 5, 20, 60];

      horizons.forEach(horizon => {
        const result = runForecast(prices, horizon, 'ridge_regression');
        expect(result.horizon).toBe(horizon);
        expect(isFinite(result.estimatedReturn)).toBe(true);
      });
    });
  });

  describe('runModelComparison', () => {
    it('should compare all models', () => {
      const prices = generateTestPrices(500, 100, 42);
      const comparison = runModelComparison(prices, 5);

      expect(comparison.models.length).toBe(5);
      expect(comparison.baselineModelId).toBe('historical_average');
    });

    it('should include metrics for each model', () => {
      const prices = generateTestPrices(500, 100, 42);
      const comparison = runModelComparison(prices, 5);

      comparison.models.forEach(model => {
        expect(model.modelId).toBeDefined();
        expect(model.modelName).toBeDefined();
        expect(model.metrics).toBeDefined();
        expect(isFinite(model.metrics.mae)).toBe(true);
        expect(isFinite(model.metrics.rmse)).toBe(true);
      });
    });

    it('should assign status to each model', () => {
      const prices = generateTestPrices(500, 100, 42);
      const comparison = runModelComparison(prices, 5);

      comparison.models.forEach(model => {
        expect(['valid', 'experimental', 'insufficient_data', 'failed_validation']).toContain(model.status);
      });
    });

    it('should include evaluation period', () => {
      const prices = generateTestPrices(500, 100, 42);
      const comparison = runModelComparison(prices, 5);

      expect(comparison.evaluationPeriod.start).toBeDefined();
      expect(comparison.evaluationPeriod.end).toBeDefined();
    });

    it('should handle insufficient data gracefully', () => {
      const prices = generateTestPrices(100, 100, 42);
      const comparison = runModelComparison(prices, 5);

      // Should still produce results, but with insufficient_data status
      expect(comparison.models.length).toBe(5);
    });

    it('should work with different horizons', () => {
      const prices = generateTestPrices(500, 100, 42);
      const horizons: ForecastHorizon[] = [1, 5, 20];

      horizons.forEach(horizon => {
        const comparison = runModelComparison(prices, horizon);
        expect(comparison.models.length).toBe(5);
      });
    });
  });
});
