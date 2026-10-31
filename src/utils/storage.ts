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

/**
 * Get user-scoped storage key
 */
function getUserKey(baseKey: string, userId?: string): string {
  if (!userId) return baseKey;
  return `${baseKey}_${userId}`;
}

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

export function saveDatasets(datasets: Map<string, StockDataset>, userId?: string): boolean {
  // Convert Map to object for serialization
  const obj = Object.fromEntries(datasets);
  return saveToStorage(getUserKey(STORAGE_KEYS.DATASETS, userId), obj);
}

export function loadDatasets(userId?: string): Map<string, StockDataset> {
  const obj = loadFromStorage<Record<string, StockDataset>>(getUserKey(STORAGE_KEYS.DATASETS, userId), {});
  return new Map(Object.entries(obj));
}

export function saveWatchlist(watchlist: WatchlistItem[], userId?: string): boolean {
  return saveToStorage(getUserKey(STORAGE_KEYS.WATCHLIST, userId), watchlist);
}

export function loadWatchlist(userId?: string): WatchlistItem[] {
  return loadFromStorage<WatchlistItem[]>(getUserKey(STORAGE_KEYS.WATCHLIST, userId), []);
}

export function saveSettings(settings: AppSettings, userId?: string): boolean {
  return saveToStorage(getUserKey(STORAGE_KEYS.SETTINGS, userId), settings);
}

export function loadSettings(defaultSettings: AppSettings, userId?: string): AppSettings {
  return loadFromStorage<AppSettings>(getUserKey(STORAGE_KEYS.SETTINGS, userId), defaultSettings);
}

export function saveReports(reports: ResearchReport[], userId?: string): boolean {
  return saveToStorage(getUserKey(STORAGE_KEYS.REPORTS, userId), reports);
}

export function loadReports(userId?: string): ResearchReport[] {
  return loadFromStorage<ResearchReport[]>(getUserKey(STORAGE_KEYS.REPORTS, userId), []);
}

export function saveAnomalies(anomalies: Map<string, AnomalyEvent[]>, userId?: string): boolean {
  const obj = Object.fromEntries(anomalies);
  return saveToStorage(getUserKey(STORAGE_KEYS.ANOMALIES, userId), obj);
}

export function loadAnomalies(userId?: string): Map<string, AnomalyEvent[]> {
  const obj = loadFromStorage<Record<string, AnomalyEvent[]>>(getUserKey(STORAGE_KEYS.ANOMALIES, userId), {});
  return new Map(Object.entries(obj));
}

/**
 * Clear all data for a specific user
 */
export function clearUserData(userId: string): boolean {
  if (!isStorageAvailable()) return false;

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(getUserKey(key, userId));
    });
    return true;
  } catch (error) {
    console.error('Failed to clear user data', error);
    return false;
  }
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
