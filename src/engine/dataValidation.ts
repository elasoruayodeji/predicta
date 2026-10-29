// ============================================================
// Data Validation Engine
// ============================================================
import { PriceRecord, DataQualityReport } from '../types';

export function validatePriceData(records: PriceRecord[]): DataQualityReport {
  const warnings: string[] = [];
  const totalRecords = records.length;

  // Check for duplicate dates
  const dateSet = new Set<string>();
  const duplicateDates: string[] = [];
  for (const r of records) {
    if (dateSet.has(r.date)) {
      duplicateDates.push(r.date);
    }
    dateSet.add(r.date);
  }

  // Check for invalid prices
  let invalidPrices = 0;
  let negativeVolumes = 0;
  let zeroVolumeDays = 0;

  for (const r of records) {
    if (r.open <= 0 || r.high <= 0 || r.low <= 0 || r.close <= 0) {
      invalidPrices++;
    }
    if (r.high < r.low) {
      invalidPrices++;
    }
    if (r.open > r.high || r.open < r.low) {
      invalidPrices++;
    }
    if (r.close > r.high || r.close < r.low) {
      invalidPrices++;
    }
    if (r.volume < 0) {
      negativeVolumes++;
    }
    if (r.volume === 0) {
      zeroVolumeDays++;
    }
  }

  // Check for date gaps
  const sortedDates = records.map(r => r.date).sort();
  const gapsLargerThan: { days: number; count: number }[] = [];
  
  if (sortedDates.length > 1) {
    let gap3 = 0, gap5 = 0, gap10 = 0, gap30 = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const d1 = new Date(sortedDates[i - 1]);
      const d2 = new Date(sortedDates[i]);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) gap30++;
      if (diffDays > 10) gap10++;
      if (diffDays > 5) gap5++;
      if (diffDays > 3) gap3++;
    }
    if (gap3 > 0) gapsLargerThan.push({ days: 3, count: gap3 });
    if (gap5 > 0) gapsLargerThan.push({ days: 5, count: gap5 });
    if (gap10 > 0) gapsLargerThan.push({ days: 10, count: gap10 });
    if (gap30 > 0) gapsLargerThan.push({ days: 30, count: gap30 });
  }

  // Check for stale data
  const lastDate = sortedDates[sortedDates.length - 1];
  const daysSinceLast = Math.round((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
  const staleDataDays = daysSinceLast > 5 ? daysSinceLast : 0;

  // Missing dates detection (weekends and holidays are expected)
  const missingDates: string[] = [];

  // Generate warnings
  if (duplicateDates.length > 0) {
    warnings.push(`${duplicateDates.length} duplicate date(s) detected`);
  }
  if (invalidPrices > 0) {
    warnings.push(`${invalidPrices} invalid price observation(s) found`);
  }
  if (negativeVolumes > 0) {
    warnings.push(`${negativeVolumes} negative volume value(s) detected`);
  }
  if (zeroVolumeDays > totalRecords * 0.1) {
    warnings.push(`${((zeroVolumeDays / totalRecords) * 100).toFixed(1)}% of records have zero volume`);
  }
  if (staleDataDays > 30) {
    warnings.push(`Data is ${staleDataDays} days old — consider refreshing`);
  }
  if (gapsLargerThan.some(g => g.days >= 30)) {
    warnings.push('Large data gaps detected (>30 days)');
  }
  if (totalRecords < 50) {
    warnings.push('Limited data available — forecasts will be unreliable');
  }

  // Calculate overall score
  let score: DataQualityReport['overallScore'] = 'excellent';
  const issueCount = duplicateDates.length + invalidPrices + negativeVolumes;
  if (issueCount > totalRecords * 0.05 || staleDataDays > 90) {
    score = 'poor';
  } else if (issueCount > totalRecords * 0.02 || staleDataDays > 30) {
    score = 'fair';
  } else if (issueCount > 0 || staleDataDays > 7) {
    score = 'good';
  }

  return {
    totalRecords,
    missingDates,
    duplicateDates,
    invalidPrices,
    negativeVolumes,
    zeroVolumeDays,
    staleDataDays,
    gapsLargerThan,
    overallScore: score,
    warnings,
  };
}

export function cleanPriceData(records: PriceRecord[]): PriceRecord[] {
  // Remove duplicates (keep last occurrence)
  const seen = new Map<string, PriceRecord>();
  for (const r of records) {
    seen.set(r.date, r);
  }

  // Filter invalid records
  return Array.from(seen.values())
    .filter(r => r.open > 0 && r.high > 0 && r.low > 0 && r.close > 0)
    .filter(r => r.high >= r.low)
    .filter(r => r.volume >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}
