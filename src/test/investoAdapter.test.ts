// ============================================================
// Investo Adapter Tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { 
  investoPricesToRecords, 
  investoToDataset, 
  getInvestoAttribution, 
  formatInvestoTimestamp 
} from '../engine/investoAdapter';
import type { InvestoPriceBar, InvestoStock, InvestoResponse } from '../services/investoClient';

describe('Investo Adapter', () => {
  describe('investoPricesToRecords', () => {
    it('should convert valid price bars to PriceRecord[]', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 1000000 },
        { date: '2024-01-02', open: 102, high: 108, low: 101, close: 106, volume: 1200000 },
      ];

      const records = investoPricesToRecords(bars);

      expect(records).toHaveLength(2);
      expect(records[0].date).toBe('2024-01-01');
      expect(records[0].open).toBe(100);
      expect(records[0].high).toBe(105);
      expect(records[0].low).toBe(98);
      expect(records[0].close).toBe(102);
      expect(records[0].volume).toBe(1000000);
    });

    it('should handle null high/low values (use close as fallback)', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: 100, high: null, low: null, close: 102, volume: 1000000 },
      ];

      const records = investoPricesToRecords(bars);

      expect(records).toHaveLength(1);
      expect(records[0].high).toBe(102); // Fallback to close
      expect(records[0].low).toBe(102);  // Fallback to close
    });

    it('should handle null open value (use close as fallback)', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: null, high: 105, low: 98, close: 102, volume: 1000000 },
      ];

      const records = investoPricesToRecords(bars);

      expect(records).toHaveLength(1);
      expect(records[0].open).toBe(102); // Fallback to close
    });

    it('should handle null volume (default to 0)', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: null as any },
      ];

      const records = investoPricesToRecords(bars);

      expect(records).toHaveLength(1);
      expect(records[0].volume).toBe(0);
    });

    it('should filter out bars with null or zero close', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 1000000 },
        { date: '2024-01-02', open: 102, high: 108, low: 101, close: null as any, volume: 1200000 },
        { date: '2024-01-03', open: 106, high: 110, low: 105, close: 0, volume: 1100000 },
        { date: '2024-01-04', open: 108, high: 112, low: 107, close: 109, volume: 1300000 },
      ];

      const records = investoPricesToRecords(bars);

      expect(records).toHaveLength(2);
      expect(records[0].date).toBe('2024-01-01');
      expect(records[1].date).toBe('2024-01-04');
    });

    it('should sort records by date', () => {
      const bars: InvestoPriceBar[] = [
        { date: '2024-01-03', open: 106, high: 110, low: 105, close: 109, volume: 1100000 },
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 1000000 },
        { date: '2024-01-02', open: 102, high: 108, low: 101, close: 106, volume: 1200000 },
      ];

      const records = investoPricesToRecords(bars);

      expect(records[0].date).toBe('2024-01-01');
      expect(records[1].date).toBe('2024-01-02');
      expect(records[2].date).toBe('2024-01-03');
    });

    it('should handle empty array', () => {
      const records = investoPricesToRecords([]);
      expect(records).toHaveLength(0);
    });
  });

  describe('investoToDataset', () => {
    it('should create a complete StockDataset', () => {
      const stock: InvestoStock = {
        symbol: 'GTCO',
        name: 'Guaranty Trust Holding Company Plc',
        sector: 'FINANCIAL SERVICES',
        market: 'Main Board',
        price: 129.2,
        previous_close: 127,
        change_percent: 1.73,
        volume: 9579089,
        market_cap: 4722289653208.8,
        shares_outstanding: 36550229514,
        trade_date: '2026-07-17T00:00:00',
        has_fundamentals: true,
        has_verdict: true,
      };

      const bars: InvestoPriceBar[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 1000000 },
        { date: '2024-01-02', open: 102, high: 108, low: 101, close: 106, volume: 1200000 },
      ];

      const fetchedAt = '2026-07-18T01:10:30.914Z';
      const dataset = investoToDataset(stock, bars, fetchedAt);

      expect(dataset.info.symbol).toBe('GTCO');
      expect(dataset.info.name).toBe('Guaranty Trust Holding Company Plc');
      expect(dataset.info.exchange).toBe('NGX');
      expect(dataset.info.currency).toBe('NGN');
      expect(dataset.info.dataSource).toBe('Investo API');
      expect(dataset.info.importedAt).toBe(fetchedAt);
      expect(dataset.info.recordCount).toBe(2);
      expect(dataset.info.dateRange.start).toBe('2024-01-01');
      expect(dataset.info.dateRange.end).toBe('2024-01-02');

      expect(dataset.prices).toHaveLength(2);
      expect(dataset.quality).toBeDefined();
      expect(dataset.quality.totalRecords).toBe(2);
    });

    it('should handle stocks with no price data', () => {
      const stock: InvestoStock = {
        symbol: 'TEST',
        name: 'Test Stock',
        sector: 'TEST',
        market: 'Test Board',
        price: 0,
        previous_close: 0,
        change_percent: 0,
        volume: 0,
        market_cap: 0,
        shares_outstanding: 0,
        trade_date: '2026-07-17T00:00:00',
        has_fundamentals: false,
        has_verdict: false,
      };

      const dataset = investoToDataset(stock, [], '2026-07-18T00:00:00Z');

      expect(dataset.info.recordCount).toBe(0);
      expect(dataset.info.dateRange.start).toBe('');
      expect(dataset.info.dateRange.end).toBe('');
      expect(dataset.prices).toHaveLength(0);
    });
  });

  describe('getInvestoAttribution', () => {
    it('should return attribution from meta', () => {
      const meta = { attribution: 'Investo — investo.ng' };
      expect(getInvestoAttribution(meta)).toBe('Investo — investo.ng');
    });

    it('should return default attribution if meta is undefined', () => {
      expect(getInvestoAttribution(undefined)).toBe('Investo — investo.ng');
    });

    it('should return default attribution if meta.attribution is missing', () => {
      expect(getInvestoAttribution({})).toBe('Investo — investo.ng');
    });
  });

  describe('formatInvestoTimestamp', () => {
    it('should format ISO timestamp to locale string', () => {
      const formatted = formatInvestoTimestamp('2026-07-18T01:10:30.914Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Jul');
      expect(formatted).toContain('18');
    });

    it('should return "Unknown" for undefined', () => {
      expect(formatInvestoTimestamp(undefined)).toBe('Unknown');
    });

    it('should return "Unknown" for invalid date', () => {
      expect(formatInvestoTimestamp('invalid')).toBe('Invalid Date');
    });
  });
});
