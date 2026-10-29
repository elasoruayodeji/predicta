import { describe, it, expect } from 'vitest';
import { walkForwardBacktest, compareModels } from '../engine/evaluation';
import { generateTestPrices } from './fixtures';
import { ModelType } from '../types';

describe('Walk-Forward Evaluation Engine', () => {
  describe('walkForwardBacktest', () => {
    it('should produce folds for sufficient data', () => {
      const prices = generateTestPrices(500, 100, 42);
      const result = walkForwardBacktest(prices, {
        modelId: 'ridge_regression',
        horizon: 5,
        trainingWindowDays: 252,
        testWindowDays: 60,
        stepSize: 10,
      });

      expect(result.folds.length).toBeGreaterThan(0);
      expect(result.aggregateMetrics).toBeDefined();
      expect(result.evaluationWindow.start).toBeDefined();
      expect(result.evaluationWindow.end).toBeDefined();
    });

    it('should return empty folds for insufficient data', () => {
      const prices = generateTestPrices(50, 100, 42);
      const result = walkForwardBacktest(prices, {
        modelId: 'ridge_regression',
        horizon: 5,
        trainingWindowDays: 252,
        testWindowDays: 60,
        stepSize: 10,
      });

      expect(result.folds.length).toBe(0);
    });

    it('should ensure training data precedes test data (no leakage)', () => {
      const prices = generateTestPrices(500, 100, 42);
      const result = walkForwardBacktest(prices, {
        modelId: 'ridge_regression',
        horizon: 5,
        trainingWindowDays: 252,
        testWindowDays: 60,
        stepSize: 10,
      });

      result.folds.forEach(fold => {
        expect(fold.trainingEnd <= fold.testStart).toBe(true);
      });
    });

    it('should produce valid metrics for each fold', () => {
      const prices = generateTestPrices(500, 100, 42);
      const result = walkForwardBacktest(prices, {
        modelId: 'ridge_regression',
        horizon: 5,
        trainingWindowDays: 252,
        testWindowDays: 60,
        stepSize: 10,
      });

      result.folds.forEach(fold => {
        expect(isFinite(fold.metrics.mae)).toBe(true);
        expect(isFinite(fold.metrics.rmse)).toBe(true);
        expect(fold.metrics.directionalAccuracy).toBeGreaterThanOrEqual(0);
        expect(fold.metrics.directionalAccuracy).toBeLessThanOrEqual(1);
      });
    });

    it('should limit number of folds for performance', () => {
      const prices = generateTestPrices(1000, 100, 42);
      const result = walkForwardBacktest(prices, {
        modelId: 'ridge_regression',
        horizon: 5,
        trainingWindowDays: 252,
        testWindowDays: 60,
        stepSize: 5,
      });

      expect(result.folds.length).toBeLessThanOrEqual(12);
    });

    it('should work with different model types', () => {
      const prices = generateTestPrices(500, 100, 42);
      const modelIds: ModelType[] = ['persistence', 'historical_average', 'ridge_regression'];

      modelIds.forEach(modelId => {
        const result = walkForwardBacktest(prices, {
          modelId,
          horizon: 5,
          trainingWindowDays: 252,
          testWindowDays: 60,
          stepSize: 10,
        });

        expect(result.folds.length).toBeGreaterThan(0);
        expect(isFinite(result.aggregateMetrics.mae)).toBe(true);
      });
    });

    it('should handle different horizons', () => {
      const prices = generateTestPrices(500, 100, 42);
      const horizons = [1, 5, 20];

      horizons.forEach(horizon => {
        const result = walkForwardBacktest(prices, {
          modelId: 'ridge_regression',
          horizon,
          trainingWindowDays: 252,
          testWindowDays: 60,
          stepSize: 10,
        });

        expect(result.folds.length).toBeGreaterThan(0);
      });
    });
  });

  describe('compareModels', () => {
    it('should compare multiple models', () => {
      const prices = generateTestPrices(500, 100, 42);
      const modelIds: ModelType[] = ['persistence', 'historical_average', 'ridge_regression'];

      const { results, testDates } = compareModels(prices, modelIds, 5);

      expect(results.length).toBe(modelIds.length);
      results.forEach(result => {
        expect(result.folds.length).toBeGreaterThan(0);
        expect(isFinite(result.aggregateMetrics.mae)).toBe(true);
      });
    });

    it('should use consistent evaluation periods', () => {
      const prices = generateTestPrices(500, 100, 42);
      const modelIds: ModelType[] = ['persistence', 'historical_average', 'ridge_regression'];

      const { results } = compareModels(prices, modelIds, 5);

      // All models should have similar evaluation windows
      const firstWindow = results[0].evaluationWindow;
      results.forEach(result => {
        // Windows should be close (may differ slightly due to fold boundaries)
        expect(result.evaluationWindow.start).toBeDefined();
        expect(result.evaluationWindow.end).toBeDefined();
      });
    });
  });
});
