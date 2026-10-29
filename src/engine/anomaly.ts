// ============================================================
// Anomaly Detection Engine
// ============================================================
import { PriceRecord, AnomalyEvent } from '../types';
import { calculateReturns } from './statistics';

/**
 * Detect anomalies in historical price data using statistical thresholds.
 * Identifies unusual returns, volume spikes, and volatility changes.
 */
export function detectAnomalies(
  prices: PriceRecord[],
  options: {
    returnThresholdStd?: number;
    volumeThresholdStd?: number;
    volatilityWindow?: number;
    volatilityThresholdStd?: number;
  } = {}
): AnomalyEvent[] {
  const {
    returnThresholdStd = 2.5,
    volumeThresholdStd = 3.0,
    volatilityWindow = 20,
    volatilityThresholdStd = 2.0,
  } = options;

  if (prices.length < 30) return [];

  const returns = calculateReturns(prices);
  const anomalies: AnomalyEvent[] = [];

  // Calculate return statistics
  const returnMean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - returnMean, 2), 0) / (returns.length - 1);
  const returnStd = Math.sqrt(returnVariance);

  // Calculate volume statistics
  const volumes = prices.map(p => p.volume);
  const volMean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const volVariance = volumes.reduce((sum, v) => sum + Math.pow(v - volMean, 2), 0) / (volumes.length - 1);
  const volStd = Math.sqrt(volVariance);

  // 1. Detect unusual returns
  for (let i = 0; i < returns.length; i++) {
    const zScore = returnStd > 0 ? (returns[i] - returnMean) / returnStd : 0;
    
    if (Math.abs(zScore) >= returnThresholdStd) {
      const isPositive = returns[i] > 0;
      anomalies.push({
        date: prices[i + 1].date,
        type: isPositive ? 'price_spike' : 'price_drop',
        severity: Math.abs(zScore) >= 4 ? 'critical' : Math.abs(zScore) >= 3.5 ? 'high' : Math.abs(zScore) >= 3 ? 'medium' : 'low',
        score: Math.abs(zScore),
        metric: 'Daily Return',
        value: returns[i] * 100,
        threshold: returnThresholdStd * returnStd * 100,
        reference: `Mean: ${(returnMean * 100).toFixed(3)}%, Std: ${(returnStd * 100).toFixed(3)}%`,
        description: isPositive
          ? `Unusually large positive return of ${(returns[i] * 100).toFixed(2)}% (${Math.abs(zScore).toFixed(1)} standard deviations above mean)`
          : `Unusually large negative return of ${(returns[i] * 100).toFixed(2)}% (${Math.abs(zScore).toFixed(1)} standard deviations below mean)`,
      });
    }
  }

  // 2. Detect volume spikes
  for (let i = 0; i < prices.length; i++) {
    if (volStd > 0 && prices[i].volume > 0) {
      const zScore = (prices[i].volume - volMean) / volStd;
      if (zScore >= volumeThresholdStd) {
        anomalies.push({
          date: prices[i].date,
          type: 'volume_spike',
          severity: zScore >= 5 ? 'critical' : zScore >= 4 ? 'high' : 'medium',
          score: zScore,
          metric: 'Trading Volume',
          value: prices[i].volume,
          threshold: volMean + volumeThresholdStd * volStd,
          reference: `Mean: ${formatNumber(volMean)}, Std: ${formatNumber(volStd)}`,
          description: `Trading volume of ${formatNumber(prices[i].volume)} is ${zScore.toFixed(1)} standard deviations above average`,
        });
      }
    }
  }

  // 3. Detect volatility spikes (rolling)
  if (returns.length > volatilityWindow) {
    const rollingVols: number[] = [];
    for (let i = volatilityWindow - 1; i < returns.length; i++) {
      const window = returns.slice(i - volatilityWindow + 1, i + 1);
      const wMean = window.reduce((a, b) => a + b, 0) / window.length;
      const wVar = window.reduce((sum, r) => sum + Math.pow(r - wMean, 2), 0) / (window.length - 1);
      rollingVols.push(Math.sqrt(wVar));
    }

    const rvMean = rollingVols.reduce((a, b) => a + b, 0) / rollingVols.length;
    const rvVar = rollingVols.reduce((sum, v) => sum + Math.pow(v - rvMean, 2), 0) / (rollingVols.length - 1);
    const rvStd = Math.sqrt(rvVar);

    for (let i = 0; i < rollingVols.length; i++) {
      const zScore = rvStd > 0 ? (rollingVols[i] - rvMean) / rvStd : 0;
      if (zScore >= volatilityThresholdStd) {
        anomalies.push({
          date: prices[i + volatilityWindow].date,
          type: 'volatility_spike',
          severity: zScore >= 4 ? 'high' : 'medium',
          score: zScore,
          metric: `${volatilityWindow}-day Rolling Volatility`,
          value: rollingVols[i] * Math.sqrt(252) * 100,
          threshold: (rvMean + volatilityThresholdStd * rvStd) * Math.sqrt(252) * 100,
          reference: `Mean annualized vol: ${(rvMean * Math.sqrt(252) * 100).toFixed(1)}%`,
          description: `Rolling volatility spiked to ${(rollingVols[i] * Math.sqrt(252) * 100).toFixed(1)}% annualized (${zScore.toFixed(1)} std above mean)`,
        });
      }
    }
  }

  // Sort by severity and date
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.date.localeCompare(a.date);
  });

  return anomalies;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}
