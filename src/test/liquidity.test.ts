import { describe, it, expect } from 'vitest';
import {
  calculateLiquidityMetrics,
  generateLiquidityWarnings,
  formatLiquidityMetrics,
} from '../engine/liquidity';
import { PriceRecord } from '../types';

describe('Liquidity Analytics Engine', () => {
  // Helper to generate test price data
  const generateTestPrices = (days: number, basePrice: number = 100, volumePattern: 'high' | 'low' | 'mixed' = 'high'): PriceRecord[] => {
    const prices: PriceRecord[] = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      let volume = 0;
      if (volumePattern === 'high') {
        volume = 1000000 + Math.random() * 500000;
      } else if (volumePattern === 'low') {
        volume = Math.random() > 0.7 ? 10000 : 0; // Only 30% of days have volume
      } else if (volumePattern === 'mixed') {
        volume = i % 10 === 0 ? 0 : 500000 + Math.random() * 300000; // Every 10th day has no volume
      }
      
      const price = basePrice + (Math.random() - 0.5) * 10;
      
      prices.push({
        date: date.toISOString().split('T')[0],
        open: price,
        high: price + Math.random() * 2,
        low: price - Math.random() * 2,
        close: price,
        volume,
      });
    }
    
    return prices;
  };

  describe('calculateLiquidityMetrics', () => {
    it('should calculate liquidity metrics for high-liquidity stock', () => {
      const prices = generateTestPrices(250, 100, 'high');
      const metrics = calculateLiquidityMetrics(prices);

      expect(metrics.tradingDaysWithActivity.days250).toBeGreaterThan(200);
      expect(metrics.tradingDaysWithActivity.percentage250).toBeGreaterThan(80);
      expect(metrics.medianDailyValueTraded).toBeGreaterThan(0);
      expect(metrics.liquidityGrade).toBe('A');
      expect(metrics.liquidityScore).toBeGreaterThan(60);
      expect(metrics.stalePriceWarning).toBe(false);
      expect(metrics.canTradeRealistically).toBe(true);
    });

    it('should calculate liquidity metrics for low-liquidity stock', () => {
      const prices = generateTestPrices(250, 100, 'low');
      const metrics = calculateLiquidityMetrics(prices);

      expect(metrics.tradingDaysWithActivity.days250).toBeLessThan(100);
      expect(metrics.tradingDaysWithActivity.percentage250).toBeLessThan(40);
      expect(metrics.liquidityGrade).toBe('D' as any);
      expect(metrics.liquidityScore).toBeLessThan(40);
      expect(metrics.canTradeRealistically).toBe(false);
    });

    it('should detect stale prices', () => {
      const prices = generateTestPrices(250, 100, 'high');
      // Make last 10 days have no price movement
      for (let i = prices.length - 10; i < prices.length; i++) {
        prices[i].close = prices[i - 1].close;
        prices[i].open = prices[i - 1].close;
        prices[i].high = prices[i - 1].close;
        prices[i].low = prices[i - 1].close;
      }
      
      const metrics = calculateLiquidityMetrics(prices);
      
      expect(metrics.consecutiveDaysWithoutMovement).toBeGreaterThanOrEqual(10);
      expect(metrics.stalePriceWarning).toBe(true);
    });

    it('should calculate volume concentration', () => {
      const prices = generateTestPrices(250, 100, 'high');
      // Make one day have 90% of total volume
      const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
      prices[0].volume = totalVolume * 0.9;
      
      const metrics = calculateLiquidityMetrics(prices);
      
      expect(metrics.volumeConcentration).toBeGreaterThan(0.5);
    });

    it('should estimate days to liquidate position', () => {
      const prices = generateTestPrices(250, 100, 'high');
      const metrics = calculateLiquidityMetrics(prices);
      
      const daysToLiquidate1M = metrics.estimatedDaysToLiquidate(1_000_000);
      const daysToLiquidate10M = metrics.estimatedDaysToLiquidate(10_000_000);
      
      expect(daysToLiquidate1M).toBeGreaterThan(0);
      expect(daysToLiquidate10M).toBeGreaterThan(daysToLiquidate1M);
    });

    it('should generate trading restrictions for illiquid stocks', () => {
      const prices = generateTestPrices(250, 100, 'low');
      const metrics = calculateLiquidityMetrics(prices);
      
      expect(metrics.tradingRestrictions.length).toBeGreaterThan(0);
    });

    it('should throw error for empty price data', () => {
      expect(() => calculateLiquidityMetrics([])).toThrow('No price data available');
    });
  });

  describe('generateLiquidityWarnings', () => {
    it('should generate stale price warning', () => {
      const prices = generateTestPrices(250, 100, 'high');
      // Make last 10 days have no price movement
      for (let i = prices.length - 10; i < prices.length; i++) {
        prices[i].close = prices[i - 1].close;
      }
      
      const metrics = calculateLiquidityMetrics(prices);
      const warnings = generateLiquidityWarnings(metrics);
      
      const staleWarning = warnings.find(w => w.type === 'stale_price');
      expect(staleWarning).toBeDefined();
      expect(staleWarning?.severity).toBe('high');
    });

    it('should generate low liquidity warning for grade F', () => {
      const prices = generateTestPrices(250, 100, 'low');
      const metrics = calculateLiquidityMetrics(prices);
      const warnings = generateLiquidityWarnings(metrics);
      
      const liquidityWarning = warnings.find(w => w.type === 'low_liquidity');
      expect(liquidityWarning).toBeDefined();
    });

    it('should generate concentrated volume warning', () => {
      const prices = generateTestPrices(250, 100, 'high');
      const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
      prices[0].volume = totalVolume * 0.9;
      
      const metrics = calculateLiquidityMetrics(prices);
      const warnings = generateLiquidityWarnings(metrics);
      
      const concentrationWarning = warnings.find(w => w.type === 'concentrated_volume');
      expect(concentrationWarning).toBeDefined();
    });

    it('should generate irregular trading warning', () => {
      const prices = generateTestPrices(250, 100, 'low');
      const metrics = calculateLiquidityMetrics(prices);
      const warnings = generateLiquidityWarnings(metrics);
      
      const irregularWarning = warnings.find(w => w.type === 'irregular_trading');
      expect(irregularWarning).toBeDefined();
    });
  });

  describe('formatLiquidityMetrics', () => {
    it('should format liquidity metrics for display', () => {
      const prices = generateTestPrices(250, 100, 'high');
      const metrics = calculateLiquidityMetrics(prices);
      const formatted = formatLiquidityMetrics(metrics);
      
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted.find(f => f.label === 'Liquidity Grade')).toBeDefined();
      expect(formatted.find(f => f.label === 'Median Daily Value')).toBeDefined();
      expect(formatted.find(f => f.label === 'Trading Frequency (1Y)')).toBeDefined();
    });

    it('should format NGN values correctly', () => {
      const prices = generateTestPrices(250, 100, 'high');
      const metrics = calculateLiquidityMetrics(prices);
      const formatted = formatLiquidityMetrics(metrics);
      
      const medianValue = formatted.find(f => f.label === 'Median Daily Value');
      expect(medianValue?.value).toMatch(/₦/);
    });
  });
});
