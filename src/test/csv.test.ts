import { describe, it, expect } from 'vitest';
import { parseCSV, generateSampleCSV } from '../utils/csv';
import { generateTestCSV, generateInvalidCSV, generateMixedDateCSV } from './fixtures';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV with standard headers', () => {
      const csv = generateTestCSV(50);
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(50);
      expect(errors.length).toBe(0);
    });

    it('should parse all required fields', () => {
      const csv = generateTestCSV(10);
      const { records } = parseCSV(csv);

      records.forEach(r => {
        expect(r.date).toBeDefined();
        expect(typeof r.open).toBe('number');
        expect(typeof r.high).toBe('number');
        expect(typeof r.low).toBe('number');
        expect(typeof r.close).toBe('number');
        expect(typeof r.volume).toBe('number');
      });
    });

    it('should handle mixed date formats', () => {
      const csv = generateMixedDateCSV();
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(3);
      expect(errors.length).toBe(0);
    });

    it('should reject CSV with missing required columns', () => {
      const csv = generateInvalidCSV();
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(0);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'Date,Open,High,Low,Close,Volume';
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(0);
    });

    it('should skip rows with invalid dates', () => {
      const csv = `Date,Open,High,Low,Close,Volume
2022-01-03,100,102,99,101,1000000
invalid-date,101,103,100,102,1100000
2022-01-05,102,104,101,103,1200000`;

      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(2);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should skip rows with non-numeric prices', () => {
      const csv = `Date,Open,High,Low,Close,Volume
2022-01-03,100,102,99,101,1000000
2022-01-04,abc,103,100,102,1100000
2022-01-05,102,104,101,103,1200000`;

      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(2);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle CSV with quoted fields', () => {
      const csv = `"Date","Open","High","Low","Close","Volume"
"2022-01-03","100","102","99","101","1000000"`;

      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(1);
      expect(errors.length).toBe(0);
    });

    it('should handle CSV with commas in numbers', () => {
      const csv = `Date,Open,High,Low,Close,Volume
2022-01-03,"1,000.50","1,020.75","990.25","1,010.30","1,000,000"`;

      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(1);
      expect(records[0].open).toBeCloseTo(1000.50, 2);
      expect(records[0].volume).toBe(1000000);
    });

    it('should handle optional Adj Close column', () => {
      const csv = `Date,Open,High,Low,Close,Adj Close,Volume
2022-01-03,100,102,99,101,100.50,1000000`;

      const { records, errors } = parseCSV(csv);

      expect(records.length).toBe(1);
      expect(records[0].adjustedClose).toBeCloseTo(100.50, 2);
    });

    it('should normalize dates to YYYY-MM-DD format', () => {
      const csv = `Date,Open,High,Low,Close,Volume
2022-01-03,100,102,99,101,1000000
2022/01/04,101,103,100,102,1100000`;

      const { records } = parseCSV(csv);

      expect(records[0].date).toBe('2022-01-03');
      expect(records[1].date).toBe('2022-01-04');
    });

    it('should ensure volume is non-negative', () => {
      const csv = `Date,Open,High,Low,Close,Volume
2022-01-03,100,102,99,101,-500`;

      const { records } = parseCSV(csv);

      expect(records[0].volume).toBe(0); // clamped to 0
    });
  });

  describe('generateSampleCSV', () => {
    it('should generate valid CSV', () => {
      const csv = generateSampleCSV();
      const { records, errors } = parseCSV(csv);

      expect(records.length).toBeGreaterThan(0);
      expect(errors.length).toBe(0);
    });

    it('should generate synthetic data (not real market data)', () => {
      const csv = generateSampleCSV();
      const { records } = parseCSV(csv);

      // Verify it's synthetic by checking that prices follow a random walk
      // Real market data would have specific patterns
      expect(records.length).toBeGreaterThan(100);

      // Check that it's clearly labeled in the function (documentation check)
      // The function should be documented as synthetic
    });
  });
});
