// ============================================================
// LocalStorage Persistence Layer
// ============================================================
// Provides lightweight persistence for datasets, watchlist, settings, and reports.
// Uses browser localStorage with JSON serialization.
// ============================================================

import { StockDataset, WatchlistItem, AppSettings, ResearchReport, AnomalyEvent } from '../types';

const STORAGE_KEYS = {
  DATASETS: 'predicta_datasets',
  WATCHLIST: 'predicta_watchlist',
  SETTINGS: 'predicta_settings',
  REPORTS: 'predicta_reports',
  ANOMALIES: 'predicta_anomalies',
};

const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB safe limit (localStorage is typically 5MB)

/**
 * Check if localStorage is available and has space.
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Estimate the size of a string in bytes.
 */
function estimateSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Save data to localStorage with error handling.
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const serialized = JSON.stringify(data);

    // Check size before saving
    if (estimateSize(serialized) > MAX_STORAGE_SIZE) {
      console.warn(`Data too large for localStorage: ${key}`);
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Load data from localStorage with error handling.
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isStorageAvailable()) return defaultValue;

  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return defaultValue;

    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage.
 */
export function removeFromStorage(key: string): boolean {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Clear all PREDICTA data from localStorage.
 */
export function clearAllStorage(): boolean {
  if (!isStorageAvailable()) return false;

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage', error);
    return false;
  }
}

// ============================================================
// Specific save/load functions for each data type
// ============================================================

export function saveDatasets(datasets: Map<string, StockDataset>): boolean {
  // Convert Map to object for serialization
  const obj = Object.fromEntries(datasets);
  return saveToStorage(STORAGE_KEYS.DATASETS, obj);
}

export function loadDatasets(): Map<string, StockDataset> {
  const obj = loadFromStorage<Record<string, StockDataset>>(STORAGE_KEYS.DATASETS, {});
  return new Map(Object.entries(obj));
}

export function saveWatchlist(watchlist: WatchlistItem[]): boolean {
  return saveToStorage(STORAGE_KEYS.WATCHLIST, watchlist);
}

export function loadWatchlist(): WatchlistItem[] {
  return loadFromStorage<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST, []);
}

export function saveSettings(settings: AppSettings): boolean {
  return saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function loadSettings(defaultSettings: AppSettings): AppSettings {
  return loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
}

export function saveReports(reports: ResearchReport[]): boolean {
  return saveToStorage(STORAGE_KEYS.REPORTS, reports);
}

export function loadReports(): ResearchReport[] {
  return loadFromStorage<ResearchReport[]>(STORAGE_KEYS.REPORTS, []);
}

export function saveAnomalies(anomalies: Map<string, AnomalyEvent[]>): boolean {
  const obj = Object.fromEntries(anomalies);
  return saveToStorage(STORAGE_KEYS.ANOMALIES, obj);
}

export function loadAnomalies(): Map<string, AnomalyEvent[]> {
  const obj = loadFromStorage<Record<string, AnomalyEvent[]>>(STORAGE_KEYS.ANOMALIES, {});
  return new Map(Object.entries(obj));
}

/**
 * Get storage usage information.
 */
export function getStorageUsage(): { used: number; available: number } {
  if (!isStorageAvailable()) return { used: 0, available: 0 };

  let used = 0;
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key);
    if (item) used += estimateSize(item);
  });

  return {
    used,
    available: MAX_STORAGE_SIZE - used,
  };
}
