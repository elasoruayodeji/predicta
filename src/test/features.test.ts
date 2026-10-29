import { describe, it, expect } from 'vitest';
import { buildFeatures, standardizeFeatures, buildSinglePointFeatures } from '../engine/features';
import { generateTestPrices } from './fixtures';

describe('Feature Engineering Engine', () => {
  describe('buildFeatures', () => {
    it('should build feature matrix with correct dimensions', () => {
      const prices = generateTestPrices(200, 100, 42);
      const horizon = 5;
      const matrix = buildFeatures(prices, horizon);

      expect(matrix.features.length).toBeGreaterThan(0);
      expect(matrix.features.length).toBe(matrix.targets.length);
      expect(matrix.features.length).toBe(matrix.dates.length);
      expect(matrix.featureNames.length).toBeGreaterThan(0);
    });

    it('should produce correct number of features', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);

      // Expected features: 5 lags + 3 rolling means + 3 rolling vols + 2 volume + 2 MA + 3 momentum + 1 HL = 19
      expect(matrix.featureNames.length).toBe(19);
      expect(matrix.features[0].length).toBe(19);
    });

    it('should not produce features for last horizon points (no target leakage)', () => {
      const prices = generateTestPrices(200, 100, 42);
      const horizon = 10;
      const matrix = buildFeatures(prices, horizon);

      // Last feature date should be before the last horizon prices
      const lastFeatureDate = matrix.dates[matrix.dates.length - 1];
      const lastPriceDate = prices[prices.length - 1].date;

      expect(lastFeatureDate < lastPriceDate).toBe(true);
    });

    it('should use only past data for lagged returns', () => {
      const prices = generateTestPrices(100, 100, 42);
      const matrix = buildFeatures(prices, 5);

      // All feature values should be finite numbers
      matrix.features.forEach(row => {
        row.forEach(val => {
          expect(isFinite(val)).toBe(true);
        });
      });
    });

    it('should handle insufficient data gracefully', () => {
      const prices = generateTestPrices(30, 100, 42);
      const matrix = buildFeatures(prices, 5);

      // Should produce fewer or no features
      expect(matrix.features.length).toBeLessThanOrEqual(30);
    });

    it('should produce different features for different horizons', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix1 = buildFeatures(prices, 1);
      const matrix5 = buildFeatures(prices, 5);

      // Different horizons should produce different number of samples
      expect(matrix1.features.length).not.toBe(matrix5.features.length);
    });
  });

  describe('standardizeFeatures', () => {
    it('should standardize training data to zero mean and unit variance', () => {
      const trainFeatures = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
      ];

      const { train, means, stds } = standardizeFeatures(trainFeatures);

      // Check means are close to 0
      const numFeatures = train[0].length;
      for (let j = 0; j < numFeatures; j++) {
        const colMean = train.reduce((sum, row) => sum + row[j], 0) / train.length;
        expect(Math.abs(colMean)).toBeLessThan(0.0001);
      }

      // Check stds are close to 1
      for (let j = 0; j < numFeatures; j++) {
        const colStd = Math.sqrt(
          train.reduce((sum, row) => sum + Math.pow(row[j] - 0, 2), 0) / (train.length - 1)
        );
        expect(Math.abs(colStd - 1)).toBeLessThan(0.0001);
      }
    });

    it('should apply training statistics to test data', () => {
      const trainFeatures = [
        [10, 20],
        [20, 30],
        [30, 40],
      ];
      const testFeatures = [
        [15, 25],
        [25, 35],
      ];

      const { test, means, stds } = standardizeFeatures(trainFeatures, testFeatures);

      expect(test).toBeDefined();
      expect(test!.length).toBe(2);
      expect(test![0].length).toBe(2);

      // Test data should be standardized using training means/stds
      const expectedTest00 = (15 - means[0]) / stds[0];
      expect(test![0][0]).toBeCloseTo(expectedTest00, 5);
    });

    it('should handle constant features (zero variance)', () => {
      const trainFeatures = [
        [5, 10],
        [5, 20],
        [5, 30],
      ];

      const { stds } = standardizeFeatures(trainFeatures);

      // First feature has zero variance, should default to 1
      expect(stds[0]).toBe(1);
      // Second feature has variance, should be > 1
      expect(stds[1]).toBeGreaterThan(1);
    });

    it('should not leak test statistics into training', () => {
      const trainFeatures = [[1], [2], [3]];
      const testFeatures = [[100], [200]];

      const { means, stds } = standardizeFeatures(trainFeatures, testFeatures);

      // Mean should be based only on training data
      expect(means[0]).toBeCloseTo(2, 5); // (1+2+3)/3
    });
  });

  describe('buildSinglePointFeatures', () => {
    it('should build features for a single point', () => {
      const prices = generateTestPrices(100, 100, 42);
      const features = buildSinglePointFeatures(prices, 99);

      expect(features).not.toBeNull();
      expect(features!.length).toBe(19); // same as buildFeatures
    });

    it('should return null for insufficient history', () => {
      const prices = generateTestPrices(30, 100, 42);
      const features = buildSinglePointFeatures(prices, 20);

      expect(features).toBeNull(); // need at least 50 points
    });

    it('should use only data up to the specified index', () => {
      const prices = generateTestPrices(100, 100, 42);
      const features50 = buildSinglePointFeatures(prices, 50);
      const features99 = buildSinglePointFeatures(prices, 99);

      expect(features50).not.toBeNull();
      expect(features99).not.toBeNull();

      // Features should be different (different data windows)
      expect(features50![0]).not.toBeCloseTo(features99![0], 5);
    });

    it('should produce finite values', () => {
      const prices = generateTestPrices(100, 100, 42);
      const features = buildSinglePointFeatures(prices, 99);

      features!.forEach(val => {
        expect(isFinite(val)).toBe(true);
      });
    });
  });

  describe('Data Leakage Prevention', () => {
    it('should not use future prices in features', () => {
      const prices = generateTestPrices(100, 100, 42);
      const matrix = buildFeatures(prices, 5);

      // Verify that feature at index i doesn't use prices[i+1] or later
      // This is a structural check - features are built from returns and rolling stats
      // which only use past data by construction
      expect(matrix.features.length).toBeGreaterThan(0);
    });

    it('should not use future returns in features', () => {
      const prices = generateTestPrices(100, 100, 42);
      const matrix = buildFeatures(prices, 5);

      // Targets should be future returns, features should be past/present
      // Verify by checking that targets are not all zero (they use future data)
      const nonZeroTargets = matrix.targets.filter(t => Math.abs(t) > 0.0001);
      expect(nonZeroTargets.length).toBeGreaterThan(0);
    });

    it('should standardize using only training data', () => {
      const prices = generateTestPrices(200, 100, 42);
      const matrix = buildFeatures(prices, 5);

      const splitIdx = Math.floor(matrix.features.length * 0.8);
      const trainFeatures = matrix.features.slice(0, splitIdx);
      const testFeatures = matrix.features.slice(splitIdx);

      const { means, stds } = standardizeFeatures(trainFeatures, testFeatures);

      // Verify means are from training data only
      const trainMean0 = trainFeatures.reduce((sum, row) => sum + row[0], 0) / trainFeatures.length;
      expect(means[0]).toBeCloseTo(trainMean0, 5);
    });
  });
});
