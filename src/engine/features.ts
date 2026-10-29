// ============================================================
// Feature Engineering Engine
// ============================================================
import { PriceRecord } from '../types';
import { calculateReturns } from './statistics';

export interface FeatureMatrix {
  dates: string[];
  features: number[][];
  featureNames: string[];
  targets: number[];  // future returns
  targetDates: string[];
}

/**
 * Build feature matrix for forecasting.
 * CRITICAL: All features at time t use ONLY information available at time t.
 * Target is the h-period ahead return from t to t+h.
 */
export function buildFeatures(
  prices: PriceRecord[],
  horizon: number,
  maxLag: number = 10
): FeatureMatrix {
  const returns = calculateReturns(prices);
  const featureNames: string[] = [];
  const features: number[][] = [];
  const targets: number[] = [];
  const dates: string[] = [];
  const targetDates: string[] = [];

  // Define features
  // 1. Lagged returns
  for (let lag = 1; lag <= Math.min(maxLag, 5); lag++) {
    featureNames.push(`return_lag_${lag}`);
  }
  // 2. Rolling mean returns
  featureNames.push('rolling_mean_5');
  featureNames.push('rolling_mean_10');
  featureNames.push('rolling_mean_20');
  // 3. Rolling volatility
  featureNames.push('rolling_vol_5');
  featureNames.push('rolling_vol_10');
  featureNames.push('rolling_vol_20');
  // 4. Volume change
  featureNames.push('volume_change_1');
  featureNames.push('volume_ratio_5');
  // 5. Price position relative to MAs
  featureNames.push('price_to_ma20');
  featureNames.push('price_to_ma50');
  // 6. Momentum
  featureNames.push('momentum_5');
  featureNames.push('momentum_10');
  featureNames.push('momentum_20');
  // 7. High-low range
  featureNames.push('hl_range');

  const startIdx = Math.max(50, horizon + 1); // Need enough history for features

  for (let i = startIdx; i < prices.length - horizon; i++) {
    const returnIdx = i - 1; // returns[i-1] is the return from prices[i-1] to prices[i]
    if (returnIdx < 0 || returnIdx >= returns.length) continue;

    const row: number[] = [];

    // Lagged returns
    for (let lag = 1; lag <= Math.min(maxLag, 5); lag++) {
      const idx = returnIdx - lag + 1;
      row.push(idx >= 0 && idx < returns.length ? returns[idx] : 0);
    }

    // Rolling mean returns (5, 10, 20)
    for (const window of [5, 10, 20]) {
      let sum = 0;
      let count = 0;
      for (let j = returnIdx - window + 1; j <= returnIdx; j++) {
        if (j >= 0 && j < returns.length) {
          sum += returns[j];
          count++;
        }
      }
      row.push(count > 0 ? sum / count : 0);
    }

    // Rolling volatility (5, 10, 20)
    for (const window of [5, 10, 20]) {
      const windowReturns: number[] = [];
      for (let j = returnIdx - window + 1; j <= returnIdx; j++) {
        if (j >= 0 && j < returns.length) windowReturns.push(returns[j]);
      }
      if (windowReturns.length > 1) {
        const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
        const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (windowReturns.length - 1);
        row.push(Math.sqrt(variance));
      } else {
        row.push(0);
      }
    }

    // Volume change (1-day)
    if (i > 0 && prices[i - 1].volume > 0) {
      row.push((prices[i].volume - prices[i - 1].volume) / prices[i - 1].volume);
    } else {
      row.push(0);
    }

    // Volume ratio (5-day avg vs current)
    let volSum = 0;
    let volCount = 0;
    for (let j = i - 5; j < i; j++) {
      if (j >= 0) { volSum += prices[j].volume; volCount++; }
    }
    const avgVol5 = volCount > 0 ? volSum / volCount : prices[i].volume;
    row.push(avgVol5 > 0 ? prices[i].volume / avgVol5 : 1);

    // Price to MA20
    let ma20Sum = 0;
    let ma20Count = 0;
    for (let j = i - 19; j <= i; j++) {
      if (j >= 0) { ma20Sum += prices[j].close; ma20Count++; }
    }
    const ma20 = ma20Count > 0 ? ma20Sum / ma20Count : prices[i].close;
    row.push(ma20 > 0 ? (prices[i].close / ma20) - 1 : 0);

    // Price to MA50
    let ma50Sum = 0;
    let ma50Count = 0;
    for (let j = i - 49; j <= i; j++) {
      if (j >= 0) { ma50Sum += prices[j].close; ma50Count++; }
    }
    const ma50 = ma50Count > 0 ? ma50Sum / ma50Count : prices[i].close;
    row.push(ma50 > 0 ? (prices[i].close / ma50) - 1 : 0);

    // Momentum (5, 10, 20 day returns)
    for (const p of [5, 10, 20]) {
      const prevIdx = i - p;
      if (prevIdx >= 0 && prices[prevIdx].close > 0) {
        row.push((prices[i].close / prices[prevIdx].close) - 1);
      } else {
        row.push(0);
      }
    }

    // High-low range (normalized)
    row.push(prices[i].close > 0 ? (prices[i].high - prices[i].low) / prices[i].close : 0);

    // Target: h-period ahead return
    const futurePrice = prices[i + horizon].adjustedClose ?? prices[i + horizon].close;
    const currentPrice = prices[i].adjustedClose ?? prices[i].close;
    const targetReturn = currentPrice > 0 ? (futurePrice / currentPrice) - 1 : 0;

    features.push(row);
    targets.push(targetReturn);
    dates.push(prices[i].date);
    targetDates.push(prices[i + horizon].date);
  }

  return { dates, features, featureNames, targets, targetDates };
}

/**
 * Standardize features using ONLY training data statistics.
 * Returns standardized features and the scaler parameters.
 */
export function standardizeFeatures(
  trainFeatures: number[][],
  testFeatures?: number[][]
): { train: number[][]; test?: number[][]; means: number[]; stds: number[] } {
  const nFeatures = trainFeatures[0]?.length ?? 0;
  const means: number[] = new Array(nFeatures).fill(0);
  const stds: number[] = new Array(nFeatures).fill(0);

  // Calculate means
  for (const row of trainFeatures) {
    for (let j = 0; j < nFeatures; j++) {
      means[j] += row[j];
    }
  }
  for (let j = 0; j < nFeatures; j++) {
    means[j] /= trainFeatures.length;
  }

  // Calculate stds
  for (const row of trainFeatures) {
    for (let j = 0; j < nFeatures; j++) {
      stds[j] += Math.pow(row[j] - means[j], 2);
    }
  }
  for (let j = 0; j < nFeatures; j++) {
    stds[j] = Math.sqrt(stds[j] / (trainFeatures.length - 1));
    if (stds[j] < 1e-10) stds[j] = 1; // Prevent division by zero
  }

  // Apply standardization
  const train = trainFeatures.map(row =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );

  let test: number[][] | undefined;
  if (testFeatures) {
    test = testFeatures.map(row =>
      row.map((val, j) => (val - means[j]) / stds[j])
    );
  }

  return { train, test, means, stds };
}

/**
 * Build a feature vector for a SINGLE point at index `idx` in the prices array.
 * Uses ONLY data available at or before `idx` — no future information.
 * This is used for generating live forecasts where no target exists.
 * Returns null if insufficient history.
 */
export function buildSinglePointFeatures(prices: PriceRecord[], idx: number): number[] | null {
  if (idx < 50 || idx >= prices.length) return null;

  const returns = calculateReturns(prices);
  const returnIdx = idx - 1;
  if (returnIdx < 0 || returnIdx >= returns.length) return null;

  const row: number[] = [];

  // 1. Lagged returns (5 lags)
  for (let lag = 1; lag <= 5; lag++) {
    const i = returnIdx - lag + 1;
    row.push(i >= 0 && i < returns.length ? returns[i] : 0);
  }

  // 2. Rolling mean returns (5, 10, 20)
  for (const window of [5, 10, 20]) {
    let sum = 0, count = 0;
    for (let j = returnIdx - window + 1; j <= returnIdx; j++) {
      if (j >= 0 && j < returns.length) { sum += returns[j]; count++; }
    }
    row.push(count > 0 ? sum / count : 0);
  }

  // 3. Rolling volatility (5, 10, 20)
  for (const window of [5, 10, 20]) {
    const wReturns: number[] = [];
    for (let j = returnIdx - window + 1; j <= returnIdx; j++) {
      if (j >= 0 && j < returns.length) wReturns.push(returns[j]);
    }
    if (wReturns.length > 1) {
      const mean = wReturns.reduce((a, b) => a + b, 0) / wReturns.length;
      const variance = wReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (wReturns.length - 1);
      row.push(Math.sqrt(variance));
    } else {
      row.push(0);
    }
  }

  // 4. Volume change (1-day)
  if (idx > 0 && prices[idx - 1].volume > 0) {
    row.push((prices[idx].volume - prices[idx - 1].volume) / prices[idx - 1].volume);
  } else {
    row.push(0);
  }

  // 5. Volume ratio (5-day avg vs current)
  let volSum = 0, volCount = 0;
  for (let j = idx - 5; j < idx; j++) {
    if (j >= 0) { volSum += prices[j].volume; volCount++; }
  }
  const avgVol5 = volCount > 0 ? volSum / volCount : prices[idx].volume;
  row.push(avgVol5 > 0 ? prices[idx].volume / avgVol5 : 1);

  // 6. Price to MA20
  let ma20Sum = 0, ma20Count = 0;
  for (let j = idx - 19; j <= idx; j++) {
    if (j >= 0) { ma20Sum += prices[j].close; ma20Count++; }
  }
  const ma20 = ma20Count > 0 ? ma20Sum / ma20Count : prices[idx].close;
  row.push(ma20 > 0 ? (prices[idx].close / ma20) - 1 : 0);

  // 7. Price to MA50
  let ma50Sum = 0, ma50Count = 0;
  for (let j = idx - 49; j <= idx; j++) {
    if (j >= 0) { ma50Sum += prices[j].close; ma50Count++; }
  }
  const ma50 = ma50Count > 0 ? ma50Sum / ma50Count : prices[idx].close;
  row.push(ma50 > 0 ? (prices[idx].close / ma50) - 1 : 0);

  // 8. Momentum (5, 10, 20 day returns)
  for (const p of [5, 10, 20]) {
    const prevIdx = idx - p;
    if (prevIdx >= 0 && prices[prevIdx].close > 0) {
      row.push((prices[idx].close / prices[prevIdx].close) - 1);
    } else {
      row.push(0);
    }
  }

  // 9. High-low range (normalized)
  row.push(prices[idx].close > 0 ? (prices[idx].high - prices[idx].low) / prices[idx].close : 0);

  return row;
}
