// ============================================================
// Test Fixtures — Deterministic Synthetic Data
// ============================================================
// IMPORTANT: All data in this file is SYNTHETIC and generated for testing.
// It is NOT real market data and must never be presented as such.
// ============================================================
import { PriceRecord } from '../types';

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Provides deterministic output for reproducible tests.
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate deterministic synthetic OHLCV data.
 * Uses a seeded PRNG so tests are reproducible.
 */
export function generateTestPrices(
  numDays: number = 300,
  startPrice: number = 100,
  seed: number = 42,
  startDate: string = '2022-01-03'
): PriceRecord[] {
  const rng = seededRandom(seed);
  const prices: PriceRecord[] = [];
  let price = startPrice;
  const start = new Date(startDate);

  let calendarDay = 0;
  while (prices.length < numDays) {
    const date = new Date(start);
    date.setDate(start.getDate() + calendarDay);
    calendarDay++;

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (rng() - 0.48) * 2; // slight upward bias
    const open = price;
    const close = Math.max(1, price + change);
    const high = Math.max(open, close) + rng() * 1.5;
    const low = Math.min(open, close) - rng() * 1.5;
    const volume = Math.floor(500000 + rng() * 1500000);

    prices.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(Math.max(0.01, low) * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
  }

  return prices;
}

/**
 * Generate constant-price data (zero returns, zero volatility).
 */
export function generateConstantPrices(numDays: number = 100, price: number = 50): PriceRecord[] {
  const prices: PriceRecord[] = [];
  const start = new Date('2022-01-03');
  let calendarDay = 0;

  while (prices.length < numDays) {
    const date = new Date(start);
    date.setDate(start.getDate() + calendarDay);
    calendarDay++;
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    prices.push({
      date: date.toISOString().split('T')[0],
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 1000000,
    });
  }

  return prices;
}

/**
 * Generate prices with gaps (missing trading days).
 */
export function generateGappyPrices(numDays: number = 100, gapFrequency: number = 10): PriceRecord[] {
  const base = generateTestPrices(numDays + 20, 100, 42);
  // Remove every Nth record to simulate gaps
  return base.filter((_, i) => i % gapFrequency !== 0);
}

/**
 * Generate prices with duplicate dates.
 */
export function generateDuplicateDatePrices(): PriceRecord[] {
  const base = generateTestPrices(50, 100, 42);
  // Insert a duplicate of the 10th record
  const duplicate = { ...base[10] };
  const result = [...base];
  result.splice(11, 0, duplicate);
  return result;
}

/**
 * Generate prices with invalid values (zero/negative prices).
 */
export function generateInvalidPrices(): PriceRecord[] {
  const base = generateTestPrices(50, 100, 42);
  const result = [...base];
  // Insert a record with zero close price
  result.splice(20, 0, {
    date: '2022-06-15',
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 1000,
  });
  // Insert a record with negative volume
  result.splice(30, 0, {
    date: '2022-07-15',
    open: 100,
    high: 105,
    low: 98,
    close: 102,
    volume: -500,
  });
  return result;
}

/**
 * Generate a valid CSV string for testing.
 */
export function generateTestCSV(numRows: number = 100): string {
  const prices = generateTestPrices(numRows, 100, 42);
  const header = 'Date,Open,High,Low,Close,Volume';
  const rows = prices.map(p =>
    `${p.date},${p.open},${p.high},${p.low},${p.close},${p.volume}`
  );
  return [header, ...rows].join('\n');
}

/**
 * Generate an invalid CSV string (missing columns).
 */
export function generateInvalidCSV(): string {
  return `Name,Value,Category\nStock A,100,Tech\nStock B,200,Finance`;
}

/**
 * Generate a CSV with mixed date formats.
 */
export function generateMixedDateCSV(): string {
  return `Date,Open,High,Low,Close,Volume
2022-01-03,100,102,99,101,1000000
2022-01-04,101,103,100,102,1100000
2022-01-05,102,104,101,103,1200000`;
}
