import { describe, it, expect } from 'vitest';
import {
  adjustPricesForCorporateActions,
  calculateDividendYield,
  getDividendHistory,
  validateCorporateAction,
  createSampleCorporateAction,
  CorporateAction,
  DividendDetails,
  SplitDetails,
  BonusDetails,
  RightsDetails,
} from '../engine/corporateActions';
import { PriceRecord } from '../types';

describe('Corporate Actions Engine', () => {
  // Helper to generate test price data
  const generateTestPrices = (days: number, basePrice: number = 100): PriceRecord[] => {
    const prices: PriceRecord[] = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const price = basePrice + (Math.random() - 0.5) * 5;
      
      prices.push({
        date: date.toISOString().split('T')[0],
        open: price,
        high: price + Math.random() * 2,
        low: price - Math.random() * 2,
        close: price,
        volume: 1000000,
      });
    }
    
    return prices;
  };

  describe('adjustPricesForCorporateActions', () => {
    it('should adjust prices for dividend', () => {
      const prices = generateTestPrices(100, 100);
      const dividendAction: CorporateAction = {
        id: 'test-div-1',
        symbol: 'TEST',
        type: 'dividend',
        announcementDate: '2024-02-01',
        exDate: '2024-02-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          type: 'final',
          amountPerShare: 5,
          currency: 'NGN',
        } as DividendDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [dividendAction]);
      
      // Prices before ex-date should be reduced by dividend amount
      const exDateIndex = prices.findIndex(p => p.date === '2024-02-15');
      expect(adjusted[exDateIndex - 1].close).toBeLessThan(prices[exDateIndex - 1].close);
      expect(adjusted[exDateIndex - 1].close).toBeCloseTo(prices[exDateIndex - 1].close - 5, 2);
      
      // Prices on and after ex-date should be unchanged
      expect(adjusted[exDateIndex].close).toBe(prices[exDateIndex].close);
    });

    it('should adjust prices for stock split', () => {
      const prices = generateTestPrices(100, 100);
      const splitAction: CorporateAction = {
        id: 'test-split-1',
        symbol: 'TEST',
        type: 'stock_split',
        announcementDate: '2024-02-01',
        exDate: '2024-02-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          splitRatio: 2,
          oldShares: 1,
          newShares: 2,
        } as SplitDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [splitAction]);
      
      // Prices before ex-date should be halved (2:1 split)
      const exDateIndex = prices.findIndex(p => p.date === '2024-02-15');
      expect(adjusted[exDateIndex - 1].close).toBeCloseTo(prices[exDateIndex - 1].close / 2, 2);
      
      // Prices on and after ex-date should be unchanged
      expect(adjusted[exDateIndex].close).toBe(prices[exDateIndex].close);
    });

    it('should adjust prices for bonus issue', () => {
      const prices = generateTestPrices(100, 100);
      const bonusAction: CorporateAction = {
        id: 'test-bonus-1',
        symbol: 'TEST',
        type: 'bonus_issue',
        announcementDate: '2024-02-01',
        exDate: '2024-02-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          bonusRatio: 1,
          newShares: 1,
        } as BonusDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [bonusAction]);
      
      // Prices before ex-date should be halved (1:1 bonus)
      const exDateIndex = prices.findIndex(p => p.date === '2024-02-15');
      expect(adjusted[exDateIndex - 1].close).toBeCloseTo(prices[exDateIndex - 1].close / 2, 2);
    });

    it('should adjust prices for rights issue', () => {
      const prices = generateTestPrices(100, 100);
      const rightsAction: CorporateAction = {
        id: 'test-rights-1',
        symbol: 'TEST',
        type: 'rights_issue',
        announcementDate: '2024-02-01',
        exDate: '2024-02-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          rightsRatio: 2,
          rightsPrice: 80,
          currency: 'NGN',
        } as RightsDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [rightsAction]);
      
      // Prices before ex-date should be adjusted based on TERP
      const exDateIndex = prices.findIndex(p => p.date === '2024-02-15');
      expect(adjusted[exDateIndex - 1].close).not.toBe(prices[exDateIndex - 1].close);
    });

    it('should handle multiple corporate actions', () => {
      const prices = generateTestPrices(200, 100);
      
      const dividend1: CorporateAction = {
        id: 'test-div-1',
        symbol: 'TEST',
        type: 'dividend',
        announcementDate: '2024-02-01',
        exDate: '2024-02-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          type: 'interim',
          amountPerShare: 2,
          currency: 'NGN',
        } as DividendDetails,
      };

      const dividend2: CorporateAction = {
        id: 'test-div-2',
        symbol: 'TEST',
        type: 'dividend',
        announcementDate: '2024-06-01',
        exDate: '2024-06-15',
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          type: 'final',
          amountPerShare: 3,
          currency: 'NGN',
        } as DividendDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [dividend1, dividend2]);
      
      // Prices before first dividend should be reduced by both
      const exDate1Index = prices.findIndex(p => p.date === '2024-02-15');
      expect(adjusted[exDate1Index - 1].close).toBeCloseTo(prices[exDate1Index - 1].close - 5, 2);
      
      // Prices between dividends should be reduced by second dividend only
      const exDate2Index = prices.findIndex(p => p.date === '2024-06-15');
      expect(adjusted[exDate2Index - 1].close).toBeCloseTo(prices[exDate2Index - 1].close - 3, 2);
    });

    it('should handle missing ex-date gracefully', () => {
      const prices = generateTestPrices(100, 100);
      const dividendAction: CorporateAction = {
        id: 'test-div-1',
        symbol: 'TEST',
        type: 'dividend',
        announcementDate: '2024-12-01',
        exDate: '2024-12-15', // Date not in price history
        source: 'Test',
        verified: true,
        createdAt: new Date().toISOString(),
        details: {
          type: 'final',
          amountPerShare: 5,
          currency: 'NGN',
        } as DividendDetails,
      };

      const adjusted = adjustPricesForCorporateActions(prices, [dividendAction]);
      
      // Prices should be unchanged
      expect(adjusted).toEqual(prices);
    });

    it('should not adjust prices with no corporate actions', () => {
      const prices = generateTestPrices(100, 100);
      const adjusted = adjustPricesForCorporateActions(prices, []);
      
      expect(adjusted).toEqual(prices);
    });
  });

  describe('calculateDividendYield', () => {
    it('should calculate trailing 12-month dividend yield', () => {
      const actions: CorporateAction[] = [
        {
          id: 'div-1',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-03-01',
          exDate: '2024-03-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'interim',
            amountPerShare: 2,
            currency: 'NGN',
          } as DividendDetails,
        },
        {
          id: 'div-2',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-09-01',
          exDate: '2024-09-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'final',
            amountPerShare: 3,
            currency: 'NGN',
          } as DividendDetails,
        },
      ];

      const yield12m = calculateDividendYield(actions, 100, 'trailing12m');
      expect(yield12m).toBe(5); // (2 + 3) / 100 * 100
    });

    it('should calculate latest dividend yield', () => {
      const actions: CorporateAction[] = [
        {
          id: 'div-1',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-03-01',
          exDate: '2024-03-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'interim',
            amountPerShare: 2,
            currency: 'NGN',
          } as DividendDetails,
        },
        {
          id: 'div-2',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-09-01',
          exDate: '2024-09-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'final',
            amountPerShare: 3,
            currency: 'NGN',
          } as DividendDetails,
        },
      ];

      const yieldLatest = calculateDividendYield(actions, 100, 'latest');
      expect(yieldLatest).toBe(3); // 3 / 100 * 100
    });

    it('should return 0 for no dividends', () => {
      const actions: CorporateAction[] = [];
      const yield12m = calculateDividendYield(actions, 100);
      expect(yield12m).toBe(0);
    });

    it('should return 0 for zero price', () => {
      const actions: CorporateAction[] = [
        createSampleCorporateAction('TEST', 'dividend', '2024-03-15'),
      ];
      const yield12m = calculateDividendYield(actions, 0);
      expect(yield12m).toBe(0);
    });
  });

  describe('getDividendHistory', () => {
    it('should return dividend history sorted by date', () => {
      const actions: CorporateAction[] = [
        {
          id: 'div-1',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-03-01',
          exDate: '2024-03-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'interim',
            amountPerShare: 2,
            currency: 'NGN',
          } as DividendDetails,
        },
        {
          id: 'div-2',
          symbol: 'TEST',
          type: 'dividend',
          announcementDate: '2024-09-01',
          exDate: '2024-09-15',
          source: 'Test',
          verified: true,
          createdAt: new Date().toISOString(),
          details: {
            type: 'final',
            amountPerShare: 3,
            currency: 'NGN',
          } as DividendDetails,
        },
      ];

      const history = getDividendHistory(actions);
      
      expect(history.length).toBe(2);
      expect(history[0].date).toBe('2024-09-15'); // Most recent first
      expect(history[0].amount).toBe(3);
      expect(history[1].date).toBe('2024-03-15');
      expect(history[1].amount).toBe(2);
    });

    it('should exclude non-dividend actions', () => {
      const actions: CorporateAction[] = [
        createSampleCorporateAction('TEST', 'dividend', '2024-03-15'),
        createSampleCorporateAction('TEST', 'stock_split', '2024-06-15'),
      ];

      const history = getDividendHistory(actions);
      
      expect(history.length).toBe(1);
    });
  });

  describe('validateCorporateAction', () => {
    it('should validate correct dividend action', () => {
      const action = createSampleCorporateAction('TEST', 'dividend', '2024-03-15');
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate correct split action', () => {
      const action = createSampleCorporateAction('TEST', 'stock_split', '2024-03-15');
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(true);
    });

    it('should reject action with missing symbol', () => {
      const action = createSampleCorporateAction('TEST', 'dividend', '2024-03-15');
      action.symbol = '';
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing symbol');
    });

    it('should reject dividend with zero amount', () => {
      const action = createSampleCorporateAction('TEST', 'dividend', '2024-03-15');
      (action.details as DividendDetails).amountPerShare = 0;
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Dividend amount must be positive');
    });

    it('should reject split with equal shares', () => {
      const action = createSampleCorporateAction('TEST', 'stock_split', '2024-03-15');
      (action.details as SplitDetails).oldShares = 1;
      (action.details as SplitDetails).newShares = 1;
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Split ratio must change share count');
    });

    it('should reject action with ex-date before announcement', () => {
      const action = createSampleCorporateAction('TEST', 'dividend', '2024-03-15');
      action.announcementDate = '2024-03-20'; // After ex-date
      const validation = validateCorporateAction(action);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Ex-date cannot be before announcement date');
    });
  });

  describe('createSampleCorporateAction', () => {
    it('should create sample dividend action', () => {
      const action = createSampleCorporateAction('TEST', 'dividend', '2024-03-15');
      
      expect(action.symbol).toBe('TEST');
      expect(action.type).toBe('dividend');
      expect(action.exDate).toBe('2024-03-15');
      expect((action.details as DividendDetails).amountPerShare).toBeGreaterThan(0);
    });

    it('should create sample split action', () => {
      const action = createSampleCorporateAction('TEST', 'stock_split', '2024-03-15');
      
      expect(action.type).toBe('stock_split');
      expect((action.details as SplitDetails).splitRatio).toBe(2);
    });

    it('should create sample bonus action', () => {
      const action = createSampleCorporateAction('TEST', 'bonus_issue', '2024-03-15');
      
      expect(action.type).toBe('bonus_issue');
      expect((action.details as BonusDetails).bonusRatio).toBe(1);
    });

    it('should create sample rights action', () => {
      const action = createSampleCorporateAction('TEST', 'rights_issue', '2024-03-15');
      
      expect(action.type).toBe('rights_issue');
      expect((action.details as RightsDetails).rightsPrice).toBeGreaterThan(0);
    });
  });
});
