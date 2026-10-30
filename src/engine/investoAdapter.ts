// ============================================================
// Investo Data Adapter
// ============================================================
// Maps Investo API responses into PREDICTA's existing data types.
// Does NOT modify existing types or forecasting calculations.
// ============================================================

import { PriceRecord, StockInfo, StockDataset, DataQualityReport } from '../types';
import { validatePriceData } from './dataValidation';
import type { InvestoStock, InvestoPriceBar, InvestoResponse } from '../services/investoClient';

/**
 * Convert an Investo stock listing into a minimal StockInfo.
 * This is metadata only — no prices yet.
 */
export function investoStockToInfo(stock: InvestoStock, fetchedAt: string): StockInfo {
  return {
    symbol: stock.symbol,
    name: stock.name,
    exchange: 'NGX',
    currency: 'NGN',
    dataSource: 'Investo API',
    importedAt: fetchedAt,
    recordCount: 0, // Will be updated after prices are fetched
    dateRange: { start: '', end: '' }, // Will be updated after prices are fetched
  };
}

/**
 * Convert Investo price bars into PREDICTA PriceRecord[].
 * 
 * IMPORTANT: We do NOT fabricate missing OHLC values.
 * - If open/high/low are missing, we exclude the bar entirely
 * - Only bars with complete OHLC data are included
 * - Volume defaults to 0 if missing (acceptable for analysis)
 * - This prevents misleading candlestick charts and technical indicators
 */
export function investoPricesToRecords(bars: InvestoPriceBar[]): PriceRecord[] {
  return bars
    // Only include bars with complete OHLC data
    .filter(bar => {
      // Must have valid close price
      if (bar.close === null || bar.close <= 0) return false;
      // Must have open, high, low (not null)
      if (bar.open === null || bar.high === null || bar.low === null) return false;
      // High must be >= Low (valid candle)
      if (bar.high < bar.low) return false;
      return true;
    })
    .map(bar => ({
      date: bar.date,
      open: bar.open!,
      high: bar.high!,
      low: bar.low!,
      close: bar.close,
      volume: bar.volume ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build a complete StockDataset from Investo stock info and price bars.
 * This is the main entry point for importing Investo data into PREDICTA.
 */
export function investoToDataset(
  stock: InvestoStock,
  bars: InvestoPriceBar[],
  fetchedAt: string
): StockDataset {
  const prices = investoPricesToRecords(bars);
  
  const info: StockInfo = {
    symbol: stock.symbol,
    name: stock.name,
    exchange: 'NGX',
    currency: 'NGN',
    dataSource: 'Investo API',
    importedAt: fetchedAt,
    recordCount: prices.length,
    dateRange: {
      start: prices.length > 0 ? prices[0].date : '',
      end: prices.length > 0 ? prices[prices.length - 1].date : '',
    },
  };

  const quality: DataQualityReport = validatePriceData(prices);

  return {
    info,
    prices,
    quality,
  };
}

/**
 * Extract attribution string from Investo response meta.
 * Required by Investo's free-tier terms: "Data: Investo — investo.ng"
 */
export function getInvestoAttribution(meta?: { attribution?: string }): string {
  return meta?.attribution || 'Investo — investo.ng';
}

/**
 * Format Investo meta.generated_at for display.
 */
export function formatInvestoTimestamp(isoString?: string): string {
  if (!isoString) return 'Unknown';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
