import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllStorage,
  saveDatasets,
  loadDatasets,
  saveWatchlist,
  loadWatchlist,
  saveSettings,
  loadSettings,
  getStorageUsage,
} from '../utils/storage';
import { AppSettings } from '../types';

describe('Storage Layer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveToStorage / loadFromStorage', () => {
    it('should save and load simple data', () => {
      const data = { name: 'test', value: 42 };
      const result = saveToStorage('test_key', data);
      expect(result).toBe(true);

      const loaded = loadFromStorage('test_key', null);
      expect(loaded).toEqual(data);
    });

    it('should return default value for missing key', () => {
      const loaded = loadFromStorage('missing_key', 'default');
      expect(loaded).toBe('default');
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      saveToStorage('test_array', data);
      const loaded = loadFromStorage('test_array', []);
      expect(loaded).toEqual(data);
    });

    it('should handle nested objects', () => {
      const data = {
        level1: {
          level2: {
            value: 'deep',
          },
        },
      };
      saveToStorage('test_nested', data);
      const loaded = loadFromStorage('test_nested', {});
      expect(loaded).toEqual(data);
    });
  });

  describe('removeFromStorage', () => {
    it('should remove data', () => {
      saveToStorage('test_remove', { value: 1 });
      const result = removeFromStorage('test_remove');
      expect(result).toBe(true);

      const loaded = loadFromStorage('test_remove', null);
      expect(loaded).toBeNull();
    });
  });

  describe('clearAllStorage', () => {
    it('should clear all PREDICTA data', () => {
      saveToStorage('predicta_datasets', {});
      saveToStorage('predicta_watchlist', []);
      saveToStorage('predicta_settings', {});

      const result = clearAllStorage();
      expect(result).toBe(true);

      expect(loadFromStorage('predicta_datasets', null)).toBeNull();
      expect(loadFromStorage('predicta_watchlist', null)).toBeNull();
      expect(loadFromStorage('predicta_settings', null)).toBeNull();
    });
  });

  describe('saveDatasets / loadDatasets', () => {
    it('should save and load datasets Map', () => {
      const datasets = new Map();
      datasets.set('TEST', {
        info: {
          symbol: 'TEST',
          name: 'Test Stock',
          exchange: 'TEST',
          currency: 'USD',
          dataSource: 'test',
          importedAt: '2024-01-01',
          recordCount: 100,
          dateRange: { start: '2023-01-01', end: '2023-12-31' },
        },
        prices: [],
        quality: {
          totalRecords: 100,
          missingDates: [],
          duplicateDates: [],
          invalidPrices: 0,
          negativeVolumes: 0,
          zeroVolumeDays: 0,
          staleDataDays: 0,
          gapsLargerThan: [],
          overallScore: 'good' as const,
          warnings: [],
        },
      });

      saveDatasets(datasets);
      const loaded = loadDatasets();

      expect(loaded.size).toBe(1);
      expect(loaded.has('TEST')).toBe(true);
      expect(loaded.get('TEST')!.info.symbol).toBe('TEST');
    });
  });

  describe('saveWatchlist / loadWatchlist', () => {
    it('should save and load watchlist', () => {
      const watchlist = [
        {
          symbol: 'TEST1',
          name: 'Test 1',
          exchange: 'TEST',
          addedAt: '2024-01-01',
          anomalyCount: 0,
        },
        {
          symbol: 'TEST2',
          name: 'Test 2',
          exchange: 'TEST',
          addedAt: '2024-01-02',
          anomalyCount: 2,
        },
      ];

      saveWatchlist(watchlist);
      const loaded = loadWatchlist();

      expect(loaded).toEqual(watchlist);
    });
  });

  describe('saveSettings / loadSettings', () => {
    it('should save and load settings', () => {
      const settings: AppSettings = {
        currency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        defaultHorizon: 10,
        riskTolerance: 'aggressive',
        dataProvider: 'test',
        apiKeyConfigured: true,
        autoRefresh: false,
      };

      saveSettings(settings);
      const loaded = loadSettings({} as AppSettings);

      expect(loaded).toEqual(settings);
    });
  });

  describe('getStorageUsage', () => {
    it('should report storage usage', () => {
      saveToStorage('test_usage', { data: 'x'.repeat(1000) });
      const usage = getStorageUsage();

      expect(usage.used).toBeGreaterThan(0);
      expect(usage.available).toBeGreaterThan(0);
    });
  });
});
