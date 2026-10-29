import { describe, it, expect } from 'vitest';
import { validatePriceData, cleanPriceData } from '../engine/dataValidation';
import { generateTestPrices, generateDuplicateDatePrices, generateInvalidPrices, generateConstantPrices } from './fixtures';

describe('Data Validation Engine', () => {
  describe('validatePriceData', () => {
    it('should validate clean data as excellent or good quality', () => {
      const prices = generateTestPrices(300, 100, 42);
      const report = validatePriceData(prices);

      expect(report.totalRecords).toBe(300);
      expect(report.duplicateDates.length).toBe(0);
      expect(report.invalidPrices).toBe(0);
      expect(report.negativeVolumes).toBe(0);
      expect(['excellent', 'good']).toContain(report.overallScore);
    });

    it('should detect duplicate dates', () => {
      const prices = generateDuplicateDatePrices();
      const report = validatePriceData(prices);

      expect(report.duplicateDates.length).toBeGreaterThan(0);
    });

    it('should detect invalid prices', () => {
      const prices = generateInvalidPrices();
      const report = validatePriceData(prices);

      expect(report.invalidPrices).toBeGreaterThan(0);
    });

    it('should detect negative volumes', () => {
      const prices = generateInvalidPrices();
      const report = validatePriceData(prices);

      expect(report.negativeVolumes).toBeGreaterThan(0);
    });

    it('should detect stale data', () => {
      const prices = generateTestPrices(100, 100, 42, '2020-01-01');
      const report = validatePriceData(prices);

      // Data from 2020 should be stale by now
      expect(report.staleDataDays).toBeGreaterThan(30);
    });

    it('should detect data gaps', () => {
      // Create prices with a large gap
      const prices = generateTestPrices(50, 100, 42);
      // Add a record 60 days later
      const lastDate = new Date(prices[prices.length - 1].date);
      lastDate.setDate(lastDate.getDate() + 60);
      prices.push({
        date: lastDate.toISOString().split('T')[0],
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 1000000,
      });

      const report = validatePriceData(prices);
      const hasLargeGap = report.gapsLargerThan.some(g => g.days >= 30);
      expect(hasLargeGap).toBe(true);
    });

    it('should warn about insufficient data', () => {
      const prices = generateTestPrices(30, 100, 42);
      const report = validatePriceData(prices);

      expect(report.warnings.some(w => w.includes('Limited data'))).toBe(true);
    });

    it('should score poor quality for many issues', () => {
      const prices = generateInvalidPrices();
      const report = validatePriceData(prices);

      // With invalid prices and negative volumes, score should be fair or poor
      expect(['fair', 'poor']).toContain(report.overallScore);
    });

    it('should handle constant prices', () => {
      const prices = generateConstantPrices(100, 50);
      const report = validatePriceData(prices);

      expect(report.totalRecords).toBe(100);
      expect(report.invalidPrices).toBe(0);
    });
  });

  describe('cleanPriceData', () => {
    it('should remove duplicates', () => {
      const prices = generateDuplicateDatePrices();
      const cleaned = cleanPriceData(prices);

      const dates = cleaned.map(p => p.date);
      const uniqueDates = new Set(dates);
      expect(dates.length).toBe(uniqueDates.size);
    });

    it('should remove invalid prices', () => {
      const prices = generateInvalidPrices();
      const cleaned = cleanPriceData(prices);

      cleaned.forEach(p => {
        expect(p.open).toBeGreaterThan(0);
        expect(p.high).toBeGreaterThan(0);
        expect(p.low).toBeGreaterThan(0);
        expect(p.close).toBeGreaterThan(0);
      });
    });

    it('should remove negative volumes', () => {
      const prices = generateInvalidPrices();
      const cleaned = cleanPriceData(prices);

      cleaned.forEach(p => {
        expect(p.volume).toBeGreaterThanOrEqual(0);
      });
    });

    it('should sort by date', () => {
      const prices = generateTestPrices(100, 100, 42);
      // Shuffle
      const shuffled = [...prices].sort(() => Math.random() - 0.5);
      const cleaned = cleanPriceData(shuffled);

      for (let i = 1; i < cleaned.length; i++) {
        expect(cleaned[i].date >= cleaned[i - 1].date).toBe(true);
      }
    });

    it('should remove records where high < low', () => {
      const prices = generateTestPrices(50, 100, 42);
      prices[10] = { ...prices[10], high: 90, low: 100 }; // invalid

      const cleaned = cleanPriceData(prices);
      const hasInvalid = cleaned.some(p => p.high < p.low);
      expect(hasInvalid).toBe(false);
    });

    it('should preserve valid records', () => {
      const prices = generateTestPrices(100, 100, 42);
      const cleaned = cleanPriceData(prices);

      expect(cleaned.length).toBe(100); // all should be valid
    });
  });
});
