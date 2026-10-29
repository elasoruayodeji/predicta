import { describe, it, expect } from 'vitest';
import { detectAnomalies } from '../engine/anomaly';
import { generateTestPrices, generateConstantPrices } from './fixtures';
import { PriceRecord } from '../types';

describe('Anomaly Detection Engine', () => {
  describe('detectAnomalies', () => {
    it('should detect price spikes', () => {
      const prices = generateTestPrices(200, 100, 42);
      // Insert a large price spike
      prices[100] = { ...prices[100], close: prices[99].close * 1.2 }; // 20% jump

      const anomalies = detectAnomalies(prices);
      const priceSpikes = anomalies.filter(a => a.type === 'price_spike' || a.type === 'price_drop');

      expect(priceSpikes.length).toBeGreaterThan(0);
    });

    it('should detect volume spikes', () => {
      const prices = generateTestPrices(200, 100, 42);
      // Insert a volume spike
      prices[100] = { ...prices[100], volume: prices[100].volume * 10 };

      const anomalies = detectAnomalies(prices);
      const volumeSpikes = anomalies.filter(a => a.type === 'volume_spike');

      expect(volumeSpikes.length).toBeGreaterThan(0);
    });

    it('should detect volatility spikes', () => {
      const prices = generateTestPrices(200, 100, 42);
      // Insert a period of high volatility
      for (let i = 100; i < 110; i++) {
        prices[i] = {
          ...prices[i],
          close: prices[i].close * (1 + (i % 2 === 0 ? 0.05 : -0.05)),
        };
      }

      const anomalies = detectAnomalies(prices);
      const volSpikes = anomalies.filter(a => a.type === 'volatility_spike');

      expect(volSpikes.length).toBeGreaterThan(0);
    });

    it('should return empty array for insufficient data', () => {
      const prices = generateTestPrices(20, 100, 42);
      const anomalies = detectAnomalies(prices);

      expect(anomalies).toHaveLength(0);
    });

    it('should return no anomalies for constant prices', () => {
      const prices = generateConstantPrices(200, 50);
      const anomalies = detectAnomalies(prices);

      expect(anomalies).toHaveLength(0);
    });

    it('should assign severity levels', () => {
      const prices = generateTestPrices(200, 100, 42);
      // Insert extreme spike
      prices[100] = { ...prices[100], close: prices[99].close * 1.5 }; // 50% jump

      const anomalies = detectAnomalies(prices);

      anomalies.forEach(a => {
        expect(['low', 'medium', 'high', 'critical']).toContain(a.severity);
        expect(a.score).toBeGreaterThan(0);
      });
    });

    it('should include description and reference', () => {
      const prices = generateTestPrices(200, 100, 42);
      prices[100] = { ...prices[100], close: prices[99].close * 1.2 };

      const anomalies = detectAnomalies(prices);

      anomalies.forEach(a => {
        expect(a.description).toBeDefined();
        expect(a.description.length).toBeGreaterThan(0);
        expect(a.reference).toBeDefined();
        expect(a.metric).toBeDefined();
      });
    });

    it('should include date for each anomaly', () => {
      const prices = generateTestPrices(200, 100, 42);
      prices[100] = { ...prices[100], close: prices[99].close * 1.2 };

      const anomalies = detectAnomalies(prices);

      anomalies.forEach(a => {
        expect(a.date).toBeDefined();
        expect(typeof a.date).toBe('string');
        expect(a.date.length).toBe(10); // YYYY-MM-DD format
      });
    });

    it('should sort by severity and date', () => {
      const prices = generateTestPrices(200, 100, 42);
      // Insert multiple anomalies
      prices[50] = { ...prices[50], close: prices[49].close * 1.15 };
      prices[100] = { ...prices[100], close: prices[99].close * 1.3 };
      prices[150] = { ...prices[150], volume: prices[150].volume * 8 };

      const anomalies = detectAnomalies(prices);

      // Should be sorted (critical first, then by date)
      if (anomalies.length > 1) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < anomalies.length; i++) {
          const prevSev = severityOrder[anomalies[i - 1].severity];
          const currSev = severityOrder[anomalies[i].severity];
          expect(prevSev).toBeLessThanOrEqual(currSev);
        }
      }
    });

    it('should respect custom thresholds', () => {
      const prices = generateTestPrices(200, 100, 42);
      prices[100] = { ...prices[100], close: prices[99].close * 1.1 }; // 10% jump

      const anomaliesDefault = detectAnomalies(prices);
      const anomaliesLoose = detectAnomalies(prices, { returnThresholdStd: 5.0 });

      // Loose threshold should detect fewer anomalies
      expect(anomaliesLoose.length).toBeLessThanOrEqual(anomaliesDefault.length);
    });

    it('should not flag normal variations as anomalies', () => {
      const prices = generateTestPrices(200, 100, 42);
      const anomalies = detectAnomalies(prices);

      // With normal random data, should have few or no critical anomalies
      const critical = anomalies.filter(a => a.severity === 'critical');
      expect(critical.length).toBeLessThanOrEqual(2); // allow some false positives
    });
  });
});
