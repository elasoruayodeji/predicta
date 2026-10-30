// ============================================================
// Liquidity Analytics Engine
// ============================================================
// Calculates liquidity metrics for Nigerian stocks
// Critical for distinguishing quoted prices from tradable prices
// ============================================================

import { PriceRecord } from '../types';

export interface LiquidityMetrics {
  // Trading activity metrics
  tradingDaysWithActivity: {
    days30: number;
    days90: number;
    days250: number;
    percentage30: number;
    percentage90: number;
    percentage250: number;
  };

  // Volume metrics
  medianDailyValueTraded: number; // in NGN
  averageDailyVolume: number;
  medianDailyVolume: number;
  volumeConcentration: number; // Herfindahl index (0-1, higher = more concentrated)

  // Stale price detection
  consecutiveDaysWithoutMovement: number;
  stalePriceWarning: boolean;
  lastMovementDate: string;

  // Liquidity grade
  liquidityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  liquidityScore: number; // 0-100

  // Position liquidation estimate
  estimatedDaysToLiquidate: (positionValueNGN: number) => number;

  // Trading restrictions
  canTradeRealistically: boolean;
  tradingRestrictions: string[];
}

export interface LiquidityWarning {
  type: 'stale_price' | 'low_liquidity' | 'concentrated_volume' | 'irregular_trading';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

/**
 * Calculate comprehensive liquidity metrics for a stock
 */
export function calculateLiquidityMetrics(prices: PriceRecord[]): LiquidityMetrics {
  if (prices.length === 0) {
    throw new Error('No price data available for liquidity calculation');
  }

  const now = new Date();
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const days250Ago = new Date(now.getTime() - 250 * 24 * 60 * 60 * 1000);

  // Filter prices by time periods
  const prices30 = prices.filter(p => new Date(p.date) >= days30Ago);
  const prices90 = prices.filter(p => new Date(p.date) >= days90Ago);
  const prices250 = prices.filter(p => new Date(p.date) >= days250Ago);

  // Calculate trading days with activity (volume > 0)
  const activeDays30 = prices30.filter(p => p.volume > 0).length;
  const activeDays90 = prices90.filter(p => p.volume > 0).length;
  const activeDays250 = prices250.filter(p => p.volume > 0).length;

  // Calculate daily value traded (price * volume)
  const dailyValues = prices.map(p => p.close * p.volume);
  const sortedValues = [...dailyValues].sort((a, b) => a - b);
  const medianDailyValue = sortedValues[Math.floor(sortedValues.length / 2)] || 0;

  // Volume metrics
  const volumes = prices.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const sortedVolumes = [...volumes].sort((a, b) => a - b);
  const medianVolume = sortedVolumes[Math.floor(sortedVolumes.length / 2)] || 0;

  // Volume concentration (Herfindahl index)
  const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
  const volumeShares = volumes.map(v => v / totalVolume);
  const volumeConcentration = volumeShares.reduce((sum, share) => sum + share * share, 0);

  // Stale price detection
  let consecutiveDaysWithoutMovement = 0;
  let lastMovementDate = prices[prices.length - 1].date;

  for (let i = prices.length - 1; i >= 1; i--) {
    const priceChange = Math.abs(prices[i].close - prices[i - 1].close);
    const priceChangePercent = priceChange / prices[i - 1].close;

    if (priceChangePercent < 0.001) { // Less than 0.1% change
      consecutiveDaysWithoutMovement++;
    } else {
      lastMovementDate = prices[i].date;
      break;
    }
  }

  const stalePriceWarning = consecutiveDaysWithoutMovement >= 5;

  // Calculate liquidity score (0-100)
  const liquidityScore = calculateLiquidityScore(
    activeDays250 / Math.max(prices250.length, 1),
    medianDailyValue,
    volumeConcentration,
    consecutiveDaysWithoutMovement
  );

  // Assign liquidity grade
  const liquidityGrade = assignLiquidityGrade(liquidityScore);

  // Position liquidation estimator
  const estimatedDaysToLiquidate = (positionValueNGN: number): number => {
    if (medianDailyValue <= 0) return Infinity;
    // Assume we can trade up to 10% of median daily volume without impact
    const tradeableDailyValue = medianDailyValue * 0.1;
    return Math.ceil(positionValueNGN / tradeableDailyValue);
  };

  // Trading restrictions
  const tradingRestrictions: string[] = [];
  if (liquidityGrade === 'F') {
    tradingRestrictions.push('Extremely low liquidity - position may be impossible to exit');
  }
  if (stalePriceWarning) {
    tradingRestrictions.push('Stale price detected - last meaningful movement was several days ago');
  }
  if (volumeConcentration > 0.5) {
    tradingRestrictions.push('Highly concentrated volume - trading may be dominated by few participants');
  }
  if (activeDays250 / Math.max(prices250.length, 1) < 0.3) {
    tradingRestrictions.push('Infrequent trading - stock trades less than 30% of trading days');
  }

  const canTradeRealistically = liquidityGrade !== 'F' && !stalePriceWarning;

  return {
    tradingDaysWithActivity: {
      days30: activeDays30,
      days90: activeDays90,
      days250: activeDays250,
      percentage30: (activeDays30 / Math.max(prices30.length, 1)) * 100,
      percentage90: (activeDays90 / Math.max(prices90.length, 1)) * 100,
      percentage250: (activeDays250 / Math.max(prices250.length, 1)) * 100,
    },
    medianDailyValueTraded: medianDailyValue,
    averageDailyVolume: avgVolume,
    medianDailyVolume: medianVolume,
    volumeConcentration,
    consecutiveDaysWithoutMovement,
    stalePriceWarning,
    lastMovementDate,
    liquidityGrade,
    liquidityScore,
    estimatedDaysToLiquidate,
    canTradeRealistically,
    tradingRestrictions,
  };
}

/**
 * Calculate liquidity score (0-100)
 */
function calculateLiquidityScore(
  tradingFrequency: number,
  medianDailyValue: number,
  volumeConcentration: number,
  staleDays: number
): number {
  let score = 0;

  // Trading frequency (0-40 points)
  score += Math.min(tradingFrequency * 50, 40);

  // Median daily value (0-30 points)
  // NGX benchmarks: >10M NGN = excellent, >1M = good, >100K = fair, <100K = poor
  if (medianDailyValue >= 10_000_000) score += 30;
  else if (medianDailyValue >= 1_000_000) score += 20;
  else if (medianDailyValue >= 100_000) score += 10;
  else score += 5;

  // Volume concentration penalty (0-20 points)
  // Lower concentration is better
  if (volumeConcentration < 0.2) score += 20;
  else if (volumeConcentration < 0.3) score += 15;
  else if (volumeConcentration < 0.4) score += 10;
  else score += 5;

  // Stale price penalty (0-10 points)
  if (staleDays === 0) score += 10;
  else if (staleDays < 3) score += 7;
  else if (staleDays < 5) score += 4;
  else score += 0;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Assign liquidity grade based on score
 */
function assignLiquidityGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

/**
 * Generate liquidity warnings for a stock
 */
export function generateLiquidityWarnings(metrics: LiquidityMetrics): LiquidityWarning[] {
  const warnings: LiquidityWarning[] = [];

  // Stale price warning
  if (metrics.stalePriceWarning) {
    warnings.push({
      type: 'stale_price',
      severity: metrics.consecutiveDaysWithoutMovement >= 10 ? 'critical' : 'high',
      message: `No meaningful price movement for ${metrics.consecutiveDaysWithoutMovement} consecutive days`,
      metric: 'consecutiveDaysWithoutMovement',
      value: metrics.consecutiveDaysWithoutMovement,
      threshold: 5,
    });
  }

  // Low liquidity warning
  if (metrics.liquidityGrade === 'F') {
    warnings.push({
      type: 'low_liquidity',
      severity: 'critical',
      message: 'Extremely low liquidity - position may be impossible to exit at quoted prices',
      metric: 'liquidityScore',
      value: metrics.liquidityScore,
      threshold: 20,
    });
  } else if (metrics.liquidityGrade === 'D') {
    warnings.push({
      type: 'low_liquidity',
      severity: 'high',
      message: 'Very low liquidity - large positions may be difficult to exit',
      metric: 'liquidityScore',
      value: metrics.liquidityScore,
      threshold: 40,
    });
  }

  // Concentrated volume warning
  if (metrics.volumeConcentration > 0.5) {
    warnings.push({
      type: 'concentrated_volume',
      severity: metrics.volumeConcentration > 0.7 ? 'high' : 'medium',
      message: 'Trading volume is highly concentrated - may be dominated by few participants',
      metric: 'volumeConcentration',
      value: metrics.volumeConcentration,
      threshold: 0.5,
    });
  }

  // Irregular trading warning
  if (metrics.tradingDaysWithActivity.percentage250 < 30) {
    warnings.push({
      type: 'irregular_trading',
      severity: metrics.tradingDaysWithActivity.percentage250 < 10 ? 'high' : 'medium',
      message: `Stock trades only ${metrics.tradingDaysWithActivity.percentage250.toFixed(1)}% of trading days`,
      metric: 'tradingPercentage',
      value: metrics.tradingDaysWithActivity.percentage250,
      threshold: 30,
    });
  }

  return warnings;
}

/**
 * Format liquidity metrics for display
 */
export function formatLiquidityMetrics(metrics: LiquidityMetrics): {
  label: string;
  value: string;
  description: string;
}[] {
  return [
    {
      label: 'Liquidity Grade',
      value: metrics.liquidityGrade,
      description: `Score: ${metrics.liquidityScore.toFixed(1)}/100`,
    },
    {
      label: 'Median Daily Value',
      value: formatNGN(metrics.medianDailyValueTraded),
      description: 'Median value traded per day',
    },
    {
      label: 'Trading Frequency (1Y)',
      value: `${metrics.tradingDaysWithActivity.percentage250.toFixed(1)}%`,
      description: `${metrics.tradingDaysWithActivity.days250} of ${Math.round(metrics.tradingDaysWithActivity.days250 / (metrics.tradingDaysWithActivity.percentage250 / 100) || 1)} days`,
    },
    {
      label: 'Volume Concentration',
      value: (metrics.volumeConcentration * 100).toFixed(1) + '%',
      description: metrics.volumeConcentration > 0.3 ? 'Highly concentrated' : 'Well distributed',
    },
    {
      label: 'Days to Liquidate ₦1M',
      value: metrics.estimatedDaysToLiquidate(1_000_000).toString(),
      description: 'Estimated trading days to exit ₦1M position',
    },
    {
      label: 'Stale Price',
      value: metrics.stalePriceWarning ? 'YES' : 'No',
      description: metrics.stalePriceWarning
        ? `${metrics.consecutiveDaysWithoutMovement} days without movement`
        : 'Price is current',
    },
  ];
}

function formatNGN(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(1)}K`;
  return `₦${value.toFixed(0)}`;
}
