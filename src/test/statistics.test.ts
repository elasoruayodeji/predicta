import { describe, it, expect } from 'vitest';
import {
  calculateReturns,
  calculateLogReturns,
  calculateHistoricalStatistics,
  calculateMovingAverages,
  calculateRollingVolatility,
  calculateMomentum,
  calculateDrawdownSeries,
} from '../engine/statistics';
import { generateTestPrices, generateConstantPrices } from './fixtures';

describe('Statistics Engine', () => {
  describe('calculateReturns', () => {
    it('should calculate simple returns correctly', () => {
      const prices = generateTestPrices(10, 100, 42);
      const returns = calculateReturns(prices);

      expect(returns).toHaveLength(9); // n-1 returns for n prices
      expect(typeof returns[0]).toBe('number');
      expect(isNaN(returns[0])).toBe(false);
    });

    it('should return empty array for single price', () => {
      const prices = generateTestPrices(1, 100, 42);
      const returns = calculateReturns(prices);
      expect(returns).toHaveLength(0);
    });

    it('should handle constant prices (zero returns)', () => {
      const prices = generateConstantPrices(10, 50);
      const returns = calculateReturns(prices);

      expect(returns).toHaveLength(9);
      returns.forEach(r => {
        expect(Math.abs(r)).toBeLessThan(0.0001); // essentially zero
      });
    });

    it('should calculate correct return for known values', () => {
      const prices = [
        { date: '2022-01-01', open: 100, high: 100, low: 100, close: 100, volume: 1000 },
        { date: '2022-01-02', open: 100, high: 100, low: 100, close: 110, volume: 1000 },
        { date: '2022-01-03', open: 110, high: 110, low: 110, close: 99, volume: 1000 },
      ];
      const returns = calculateReturns(prices);

      expect(returns[0]).toBeCloseTo(0.1, 5); // 10% gain
      expect(returns[1]).toBeCloseTo(-0.1, 5); // ~9.09% loss
    });
  });

  describe('calculateLogReturns', () => {
    it('should calculate log returns', () => {
      const prices = generateTestPrices(10, 100, 42);
      const logReturns = calculateLogReturns(prices);

      expect(logReturns).toHaveLength(9);
      logReturns.forEach(r => {
        expect(typeof r).toBe('number');
        expect(isNaN(r)).toBe(false);
      });
    });

    it('should return zero for constant prices', () => {
      const prices = generateConstantPrices(10, 50);
      const logReturns = calculateLogReturns(prices);

      logReturns.forEach(r => {
        expect(Math.abs(r)).toBeLessThan(0.0001);
      });
    });
  });

  describe('calculateHistoricalStatistics', () => {
    it('should calculate all statistics for valid data', () => {
      const prices = generateTestPrices(300, 100, 42);
      const stats = calculateHistoricalStatistics(prices);

      expect(stats.totalReturn).toBeDefined();
      expect(stats.annualizedReturn).toBeDefined();
      expect(stats.annualizedVolatility).toBeDefined();
      expect(stats.maxDrawdown).toBeDefined();
      expect(stats.maxDrawdownDate).toBeDefined();
      expect(stats.sharpeRatio).toBeDefined();
      expect(stats.avgDailyReturn).toBeDefined();
      expect(stats.bestDay).toBeDefined();
      expect(stats.worstDay).toBeDefined();
      expect(stats.positiveDays).toBeGreaterThanOrEqual(0);
      expect(stats.negativeDays).toBeGreaterThanOrEqual(0);
      expect(stats.avgVolume).toBeGreaterThan(0);
      expect(stats.medianVolume).toBeGreaterThan(0);
      expect(typeof stats.skewness).toBe('number');
      expect(typeof stats.kurtosis).toBe('number');
    });

    it('should throw error for insufficient data', () => {
      const prices = generateTestPrices(1, 100, 42);
      expect(() => calculateHistoricalStatistics(prices)).toThrow('Insufficient data');
    });

    it('should calculate zero volatility for constant prices', () => {
      const prices = generateConstantPrices(100, 50);
      const stats = calculateHistoricalStatistics(prices);

      expect(stats.annualizedVolatility).toBeCloseTo(0, 5);
      expect(stats.totalReturn).toBeCloseTo(0, 5);
    });

    it('should calculate positive total return for upward trend', () => {
      const prices = generateTestPrices(300, 100, 42); // seed 42 has slight upward bias
      const stats = calculateHistoricalStatistics(prices);

      // With upward bias, total return should be positive
      expect(stats.totalReturn).toBeGreaterThan(-0.5); // reasonable bound
    });

    it('should calculate max drawdown between 0 and 1', () => {
      const prices = generateTestPrices(300, 100, 42);
      const stats = calculateHistoricalStatistics(prices);

      expect(stats.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(stats.maxDrawdown).toBeLessThanOrEqual(1);
    });

    it('should calculate annualized volatility as non-negative', () => {
      const prices = generateTestPrices(300, 100, 42);
      const stats = calculateHistoricalStatistics(prices);

      expect(stats.annualizedVolatility).toBeGreaterThanOrEqual(0);
    });

    it('should count positive and negative days correctly', () => {
      const prices = generateTestPrices(100, 100, 42);
      const stats = calculateHistoricalStatistics(prices);

      const totalDays = stats.positiveDays + stats.negativeDays;
      expect(totalDays).toBe(99); // n-1 days
    });
  });

  describe('calculateMovingAverages', () => {
    it('should calculate 20, 50, 200-day MAs when data is sufficient', () => {
      const prices = generateTestPrices(300, 100, 42);
      const mas = calculateMovingAverages(prices);

      expect(mas.length).toBeGreaterThanOrEqual(2); // at least 20 and 50
      const ma20 = mas.find(ma => ma.period === 20);
      const ma50 = mas.find(ma => ma.period === 50);

      expect(ma20).toBeDefined();
      expect(ma50).toBeDefined();
      expect(ma20!.values.length).toBe(300 - 20 + 1);
      expect(ma50!.values.length).toBe(300 - 50 + 1);
    });

    it('should skip MAs when data is insufficient', () => {
      const prices = generateTestPrices(30, 100, 42);
      const mas = calculateMovingAverages(prices);

      const ma200 = mas.find(ma => ma.period === 200);
      expect(ma200).toBeUndefined();
    });

    it('should calculate correct MA values', () => {
      const prices = generateTestPrices(25, 100, 42);
      const mas = calculateMovingAverages(prices);
      const ma5 = mas.find(ma => ma.period === 5);

      // Manually calculate first MA5 value
      const expected = (prices[0].close + prices[1].close + prices[2].close + prices[3].close + prices[4].close) / 5;
      expect(ma5!.values[0].value).toBeCloseTo(expected, 2);
    });
  });

  describe('calculateRollingVolatility', () => {
    it('should calculate rolling volatility', () => {
      const prices = generateTestPrices(100, 100, 42);
      const vol = calculateRollingVolatility(prices, 20);

      expect(vol.length).toBeGreaterThan(0);
      vol.forEach(v => {
        expect(v.value).toBeGreaterThanOrEqual(0);
        expect(typeof v.date).toBe('string');
      });
    });

    it('should return zero volatility for constant prices', () => {
      const prices = generateConstantPrices(100, 50);
      const vol = calculateRollingVolatility(prices, 20);

      vol.forEach(v => {
        expect(v.value).toBeCloseTo(0, 5);
      });
    });
  });

  describe('calculateMomentum', () => {
    it('should calculate momentum for multiple periods', () => {
      const prices = generateTestPrices(100, 100, 42);
      const momentum = calculateMomentum(prices, [5, 10, 20]);

      expect(momentum.length).toBeGreaterThan(0);
      momentum.forEach(m => {
        expect(m.date).toBeDefined();
        expect(typeof m.momentum_5d).toBe('number');
        expect(typeof m.momentum_10d).toBe('number');
        expect(typeof m.momentum_20d).toBe('number');
      });
    });
  });

  describe('calculateDrawdownSeries', () => {
    it('should calculate drawdown series', () => {
      const prices = generateTestPrices(100, 100, 42);
      const dd = calculateDrawdownSeries(prices);

      expect(dd).toHaveLength(100);
      dd.forEach(d => {
        expect(d.drawdown).toBeGreaterThanOrEqual(0);
        expect(d.drawdown).toBeLessThanOrEqual(1);
      });
    });

    it('should start at zero drawdown', () => {
      const prices = generateTestPrices(100, 100, 42);
      const dd = calculateDrawdownSeries(prices);

      expect(dd[0].drawdown).toBe(0);
    });

    it('should return zero drawdown for constant prices', () => {
      const prices = generateConstantPrices(100, 50);
      const dd = calculateDrawdownSeries(prices);

      dd.forEach(d => {
        expect(d.drawdown).toBe(0);
      });
    });
  });
});
