// ============================================================
// Financial Statistics Engine
// ============================================================
import { PriceRecord, HistoricalStatistics, MovingAverage } from '../types';

const TRADING_DAYS_PER_YEAR = 252;

export function calculateReturns(prices: PriceRecord[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1].adjustedClose ?? prices[i - 1].close;
    const curr = prices[i].adjustedClose ?? prices[i].close;
    if (prev > 0) {
      returns.push((curr / prev) - 1);
    }
  }
  return returns;
}

export function calculateLogReturns(prices: PriceRecord[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1].adjustedClose ?? prices[i - 1].close;
    const curr = prices[i].adjustedClose ?? prices[i].close;
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev));
    }
  }
  return returns;
}

export function calculateHistoricalStatistics(prices: PriceRecord[]): HistoricalStatistics {
  if (prices.length < 2) {
    throw new Error('Insufficient data for statistics calculation');
  }

  const returns = calculateReturns(prices);
  if (returns.length === 0) {
    throw new Error('No valid returns could be calculated');
  }

  // Total return
  const firstPrice = prices[0].adjustedClose ?? prices[0].close;
  const lastPrice = prices[prices.length - 1].adjustedClose ?? prices[prices.length - 1].close;
  const totalReturn = (lastPrice / firstPrice) - 1;

  // Annualized return
  const tradingDays = prices.length;
  const years = tradingDays / TRADING_DAYS_PER_YEAR;
  const annualizedReturn = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  // Annualized volatility
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
  const dailyVol = Math.sqrt(variance);
  const annualizedVolatility = dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR);

  // Maximum drawdown
  let maxDrawdown = 0;
  let maxDrawdownDate = prices[0].date;
  let peak = prices[0].adjustedClose ?? prices[0].close;
  let peakDate = prices[0].date;

  for (let i = 1; i < prices.length; i++) {
    const price = prices[i].adjustedClose ?? prices[i].close;
    if (price > peak) {
      peak = price;
      peakDate = prices[i].date;
    }
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = peakDate;
    }
  }

  // Sharpe ratio (assuming 0 risk-free rate for simplicity)
  const sharpeRatio = annualizedVolatility > 0 ? annualizedReturn / annualizedVolatility : null;

  // Best and worst days
  let bestDay = { date: prices[1].date, return: returns[0] };
  let worstDay = { date: prices[1].date, return: returns[0] };
  for (let i = 0; i < returns.length; i++) {
    if (returns[i] > bestDay.return) bestDay = { date: prices[i + 1].date, return: returns[i] };
    if (returns[i] < worstDay.return) worstDay = { date: prices[i + 1].date, return: returns[i] };
  }

  // Positive/negative days
  const positiveDays = returns.filter(r => r > 0).length;
  const negativeDays = returns.filter(r => r < 0).length;

  // Volume statistics
  const volumes = prices.map(p => p.volume).filter(v => v > 0);
  const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  const sortedVolumes = [...volumes].sort((a, b) => a - b);
  const medianVolume = sortedVolumes.length > 0 
    ? sortedVolumes[Math.floor(sortedVolumes.length / 2)] 
    : 0;

  // Skewness
  const n = returns.length;
  const skewness = n > 2 
    ? (returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / dailyVol, 3), 0) * n) / 
      ((n - 1) * (n - 2))
    : 0;

  // Kurtosis (excess)
  const kurtosis = n > 3
    ? ((returns.reduce((sum, r) => sum + Math.pow((r - meanReturn) / dailyVol, 4), 0) * n * (n + 1)) / 
       ((n - 1) * (n - 2) * (n - 3))) - (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)))
    : 0;

  return {
    totalReturn,
    annualizedReturn,
    annualizedVolatility,
    maxDrawdown,
    maxDrawdownDate,
    sharpeRatio,
    avgDailyReturn: meanReturn,
    bestDay,
    worstDay,
    positiveDays,
    negativeDays,
    avgVolume,
    medianVolume,
    skewness,
    kurtosis,
  };
}

export function calculateMovingAverages(prices: PriceRecord[]): MovingAverage[] {
  const periods = [
    { period: 20, label: '20-day MA' },
    { period: 50, label: '50-day MA' },
    { period: 200, label: '200-day MA' },
  ];

  return periods
    .filter(p => prices.length >= p.period)
    .map(({ period, label }) => {
      const values: { date: string; value: number }[] = [];
      for (let i = period - 1; i < prices.length; i++) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += prices[j].adjustedClose ?? prices[j].close;
        }
        values.push({ date: prices[i].date, value: sum / period });
      }
      return { period, label, values };
    });
}

export function calculateRollingVolatility(prices: PriceRecord[], window: number = 20): { date: string; value: number }[] {
  const returns = calculateReturns(prices);
  const result: { date: string; value: number }[] = [];

  for (let i = window - 1; i < returns.length; i++) {
    const windowReturns = returns.slice(i - window + 1, i + 1);
    const mean = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
    const variance = windowReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (windowReturns.length - 1);
    const dailyVol = Math.sqrt(variance);
    const annualizedVol = dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR);
    result.push({ date: prices[i + 1].date, value: annualizedVol });
  }

  return result;
}

export function calculateMomentum(prices: PriceRecord[], periods: number[] = [5, 10, 20, 60]): { date: string; [key: string]: number | string }[] {
  const result: { date: string; [key: string]: number | string }[] = [];

  for (let i = Math.max(...periods); i < prices.length; i++) {
    const entry: { date: string; [key: string]: number | string } = { date: prices[i].date };
    for (const p of periods) {
      const prevPrice = prices[i - p].adjustedClose ?? prices[i - p].close;
      const currPrice = prices[i].adjustedClose ?? prices[i].close;
      entry[`momentum_${p}d`] = prevPrice > 0 ? ((currPrice / prevPrice) - 1) * 100 : 0;
    }
    result.push(entry);
  }

  return result;
}

export function calculateDrawdownSeries(prices: PriceRecord[]): { date: string; drawdown: number }[] {
  const result: { date: string; drawdown: number }[] = [];
  let peak = prices[0].adjustedClose ?? prices[0].close;

  for (const p of prices) {
    const price = p.adjustedClose ?? p.close;
    if (price > peak) peak = price;
    const dd = peak > 0 ? (peak - price) / peak : 0;
    result.push({ date: p.date, drawdown: dd });
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param prices - Price records
 * @param period - RSI period (default 14)
 * @returns Array of { date, value } objects
 */
export function calculateRSI(prices: PriceRecord[], period: number = 14): { date: string; value: number }[] {
  if (prices.length < period + 1) return [];

  const returns = calculateReturns(prices);
  const result: { date: string; value: number }[] = [];

  let avgGain = 0;
  let avgLoss = 0;

  // Calculate initial average gain/loss
  for (let i = 0; i < period; i++) {
    const change = returns[i];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  result.push({ date: prices[period].date, value: rsi });

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < returns.length; i++) {
    const change = returns[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push({ date: prices[i + 1].date, value: rsi });
  }

  return result;
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 * @param prices - Price records
 * @param fastPeriod - Fast EMA period (default 12)
 * @param slowPeriod - Slow EMA period (default 26)
 * @param signalPeriod - Signal line period (default 9)
 * @returns Object with macd, signal, and histogram arrays
 */
export function calculateMACD(
  prices: PriceRecord[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: { date: string; value: number }[];
  signal: { date: string; value: number }[];
  histogram: { date: string; value: number }[];
} {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const closes = prices.map(p => p.adjustedClose ?? p.close);

  // Calculate EMAs
  const calculateEMA = (data: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    ema.push(sum / period);

    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
    }

    return ema;
  };

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine: number[] = [];
  const offset = slowPeriod - fastPeriod;
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalPeriod - 1] - signalLine[i]);
  }

  // Format results with dates
  const startDate = slowPeriod + signalPeriod - 1;
  const macd: { date: string; value: number }[] = [];
  const signal: { date: string; value: number }[] = [];
  const histogramResult: { date: string; value: number }[] = [];

  for (let i = 0; i < signalLine.length; i++) {
    const dateIdx = startDate + i;
    if (dateIdx < prices.length) {
      macd.push({ date: prices[dateIdx].date, value: macdLine[i + signalPeriod - 1] });
      signal.push({ date: prices[dateIdx].date, value: signalLine[i] });
      histogramResult.push({ date: prices[dateIdx].date, value: histogram[i] });
    }
  }

  return { macd, signal, histogram: histogramResult };
}
