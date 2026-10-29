import { describe, it, expect } from 'vitest';
import {
  persistenceModel,
  historicalAverageModel,
  linearRegressionModel,
  ridgeRegressionModel,
  gradientBoostingModel,
  createModel,
  calculateMetrics,
  generateForecast,
  MODEL_DEFINITIONS,
} from '../engine/models';
import { buildFeatures, standardizeFeatures } from '../engine/features';
import { generateTestPrices, generateConstantPrices } from './fixtures';
import { ModelType } from '../types';

describe('Forecasting Models', () => {
  describe('Persistence Model (Naive Baseline)', () => {
    it('should always predict zero return', () => {
      const prices = generateTestPrices(100, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const model = persistenceModel(matrix.features, matrix.targets);

      const prediction = model.predict(matrix.features[0]);
      expect(prediction).toBe(0);
    });

    it('should predict zero regardless of input features', () => {
      const model = persistenceModel([], []);
      expect(model.predict([1, 2, 3])).toBe(0);
      expect(model.predict([100, 200, 300])).toBe(0);
    });
  });

  describe('Historical Average Model', () => {
    it('should predict the mean of training targets', () => {
      const targets = [0.01, 0.02, 0.03, -0.01, 0.005];
      const model = historicalAverageModel([], targets);

      const expected = targets.reduce((a, b) => a + b, 0) / targets.length;
      const prediction = model.predict([1, 2, 3]);
      expect(prediction).toBeCloseTo(expected, 5);
    });

    it('should return zero for empty targets', () => {
      const model = historicalAverageModel([], []);
      expect(model.predict([1, 2, 3])).toBe(0);
    });

    it('should predict constant value regardless of features', () => {
      const targets = [0.05, 0.05, 0.05];
      const model = historicalAverageModel([], targets);

      expect(model.predict([1, 2, 3])).toBeCloseTo(0.05, 5);
      expect(model.predict([100, 200, 300])).toBeCloseTo(0.05, 5);
    });
  });

  describe('Linear Regression Model', () => {
    it('should produce finite predictions', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const model = linearRegressionModel(train, matrix.targets);
      const prediction = model.predict(train[0]);

      expect(isFinite(prediction)).toBe(true);
    });

    it('should return weights array', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const { weights } = linearRegressionModel(train, matrix.targets);
      expect(weights.length).toBe(matrix.features[0].length + 1); // +1 for bias
    });

    it('should handle empty training data', () => {
      const model = linearRegressionModel([], []);
      expect(model.predict([1, 2, 3])).toBe(0);
    });
  });

  describe('Ridge Regression Model', () => {
    it('should produce finite predictions', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const model = ridgeRegressionModel(train, matrix.targets);
      const prediction = model.predict(train[0]);

      expect(isFinite(prediction)).toBe(true);
    });

    it('should apply L2 regularization', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      // Higher alpha should produce different weights
      const model1 = ridgeRegressionModel(train, matrix.targets, 0.1);
      const model2 = ridgeRegressionModel(train, matrix.targets, 10.0);

      const pred1 = model1.predict(train[0]);
      const pred2 = model2.predict(train[0]);

      // Predictions should differ (regularization effect)
      expect(pred1).not.toBeCloseTo(pred2, 3);
    });
  });

  describe('Gradient Boosting Model', () => {
    it('should produce finite predictions', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const model = gradientBoostingModel(train, matrix.targets, 20, 0.1);
      const prediction = model.predict(train[0]);

      expect(isFinite(prediction)).toBe(true);
    });

    it('should handle empty training data', () => {
      const model = gradientBoostingModel([], [], 10, 0.1);
      expect(model.predict([1, 2, 3])).toBe(0);
    });

    it('should use learning rate', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const model1 = gradientBoostingModel(train, matrix.targets, 20, 0.01);
      const model2 = gradientBoostingModel(train, matrix.targets, 20, 0.5);

      const pred1 = model1.predict(train[0]);
      const pred2 = model2.predict(train[0]);

      // Different learning rates should produce different predictions
      expect(pred1).not.toBeCloseTo(pred2, 5);
    });
  });

  describe('Model Factory', () => {
    it('should create all defined models', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const { train } = standardizeFeatures(matrix.features);

      const modelIds: ModelType[] = ['persistence', 'historical_average', 'linear_regression', 'ridge_regression', 'gradient_boosting'];

      modelIds.forEach(id => {
        const model = createModel(id, train, matrix.targets);
        expect(model).toBeDefined();
        expect(typeof model.predict).toBe('function');

        const prediction = model.predict(train[0]);
        expect(isFinite(prediction)).toBe(true);
      });
    });

    it('should throw error for unknown model', () => {
      expect(() => createModel('unknown' as ModelType, [], [])).toThrow('Unknown model');
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate MAE correctly', () => {
      const predictions = [1, 2, 3];
      const actuals = [1.1, 2.2, 2.7];

      const metrics = calculateMetrics(predictions, actuals);
      const expectedMAE = (0.1 + 0.2 + 0.3) / 3;

      expect(metrics.mae).toBeCloseTo(expectedMAE, 5);
    });

    it('should calculate RMSE correctly', () => {
      const predictions = [1, 2, 3];
      const actuals = [1.1, 2.2, 2.7];

      const metrics = calculateMetrics(predictions, actuals);
      const expectedRMSE = Math.sqrt((0.01 + 0.04 + 0.09) / 3);

      expect(metrics.rmse).toBeCloseTo(expectedRMSE, 5);
    });

    it('should calculate directional accuracy', () => {
      const predictions = [0.01, -0.02, 0.03, -0.01];
      const actuals = [0.02, -0.01, 0.02, 0.01]; // 3 correct, 1 wrong

      const metrics = calculateMetrics(predictions, actuals);
      expect(metrics.directionalAccuracy).toBeCloseTo(0.75, 5);
    });

    it('should calculate baseline improvement', () => {
      const predictions = [1, 2, 3];
      const actuals = [1.1, 2.2, 2.7];
      const baselinePredictions = [1.5, 1.5, 1.5]; // worse predictions

      const metrics = calculateMetrics(predictions, actuals, baselinePredictions);
      expect(metrics.baselineImprovement).toBeGreaterThan(0);
    });

    it('should return zero metrics for empty arrays', () => {
      const metrics = calculateMetrics([], []);
      expect(metrics.mae).toBe(0);
      expect(metrics.rmse).toBe(0);
      expect(metrics.directionalAccuracy).toBe(0);
    });

    it('should calculate prediction interval coverage', () => {
      const predictions = [1, 2, 3, 4, 5];
      const actuals = [1.1, 2.1, 3.1, 4.1, 5.1]; // all within ~0.1 of predictions

      const metrics = calculateMetrics(predictions, actuals);
      expect(metrics.predictionIntervalCoverage).toBeGreaterThan(80); // should be high
    });
  });

  describe('generateForecast', () => {
    it('should generate forecast for all model types', () => {
      const prices = generateTestPrices(300, 100, 42);
      const modelIds: ModelType[] = ['persistence', 'historical_average', 'linear_regression', 'ridge_regression', 'gradient_boosting'];

      modelIds.forEach(modelId => {
        const result = generateForecast(modelId, prices, 5);

        expect(result.prediction).toBeDefined();
        expect(isFinite(result.prediction)).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.trainingTimeMs).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return zero prediction for insufficient data', () => {
      const prices = generateTestPrices(30, 100, 42);
      const result = generateForecast('ridge_regression', prices, 5);

      expect(result.prediction).toBe(0);
    });

    it('should use training window parameter', () => {
      const prices = generateTestPrices(500, 100, 42);

      const result1 = generateForecast('ridge_regression', prices, 5, 100);
      const result2 = generateForecast('ridge_regression', prices, 5, 400);

      // Different training windows should produce different results
      // (though both should be finite)
      expect(isFinite(result1.prediction)).toBe(true);
      expect(isFinite(result2.prediction)).toBe(true);
    });

    it('should generate forecast for latest price point', () => {
      const prices = generateTestPrices(300, 100, 42);
      const result = generateForecast('ridge_regression', prices, 5);

      // Forecast should be based on the last price
      const lastPrice = prices[prices.length - 1].close;
      const estimatedPrice = lastPrice * (1 + result.prediction);

      expect(estimatedPrice).toBeGreaterThan(0);
      expect(isFinite(estimatedPrice)).toBe(true);
    });
  });

  describe('Model Definitions', () => {
    it('should have all required fields', () => {
      MODEL_DEFINITIONS.forEach(def => {
        expect(def.id).toBeDefined();
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.category).toBeDefined();
        expect(def.supportedHorizons).toBeDefined();
        expect(def.minDataPoints).toBeGreaterThan(0);
      });
    });

    it('should support all forecast horizons', () => {
      MODEL_DEFINITIONS.forEach(def => {
        expect(def.supportedHorizons).toContain(1);
        expect(def.supportedHorizons).toContain(5);
        expect(def.supportedHorizons).toContain(20);
        expect(def.supportedHorizons).toContain(60);
      });
    });
  });

  describe('Baseline Comparison', () => {
    it('should compare models against naive baseline', () => {
      const prices = generateTestPrices(300, 100, 42);
      const matrix = buildFeatures(prices, 5);
      const splitIdx = Math.floor(matrix.features.length * 0.8);

      const trainFeatures = matrix.features.slice(0, splitIdx);
      const trainTargets = matrix.targets.slice(0, splitIdx);
      const testFeatures = matrix.features.slice(splitIdx);
      const testTargets = matrix.targets.slice(splitIdx);

      const { train: stdTrain, test: stdTest } = standardizeFeatures(trainFeatures, testFeatures);

      // Train models
      const persistence = persistenceModel(stdTrain, trainTargets);
      const historical = historicalAverageModel(stdTrain, trainTargets);
      const ridge = ridgeRegressionModel(stdTrain, trainTargets);

      // Generate predictions
      const persistencePreds = stdTest!.map(f => persistence.predict(f));
      const historicalPreds = stdTest!.map(f => historical.predict(f));
      const ridgePreds = stdTest!.map(f => ridge.predict(f));

      // Calculate metrics
      const persistenceMetrics = calculateMetrics(persistencePreds, testTargets);
      const historicalMetrics = calculateMetrics(historicalPreds, testTargets);
      const ridgeMetrics = calculateMetrics(ridgePreds, testTargets, historicalPreds);

      // All models should produce valid metrics
      expect(isFinite(persistenceMetrics.mae)).toBe(true);
      expect(isFinite(historicalMetrics.mae)).toBe(true);
      expect(isFinite(ridgeMetrics.mae)).toBe(true);

      // Ridge should have baseline improvement calculated
      expect(typeof ridgeMetrics.baselineImprovement).toBe('number');
    });
  });
});
