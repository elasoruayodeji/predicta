// ============================================================
// Liquidity Panel Component
// ============================================================
// Displays liquidity metrics and warnings for a stock
// ============================================================

import React from 'react';
import { LiquidityMetrics, LiquidityWarning } from '../../engine/liquidity';
import { formatLiquidityMetrics, generateLiquidityWarnings } from '../../engine/liquidity';
import { AlertTriangle, TrendingUp, DollarSign, Clock } from 'lucide-react';

interface LiquidityPanelProps {
  metrics: LiquidityMetrics;
}

export function LiquidityPanel({ metrics }: LiquidityPanelProps) {
  const warnings = generateLiquidityWarnings(metrics);
  const formattedMetrics = formatLiquidityMetrics(metrics);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Liquidity Grade */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Liquidity Assessment</h3>
          <div className={`text-2xl font-bold ${getGradeColor(metrics.liquidityGrade)}`}>
            {metrics.liquidityGrade}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-[var(--color-bg-tertiary)] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
              style={{ width: `${metrics.liquidityScore}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {metrics.liquidityScore.toFixed(1)}/100
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {metrics.canTradeRealistically
            ? 'This stock can be traded realistically at quoted prices'
            : 'Warning: This stock may be difficult to trade at quoted prices'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {formattedMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              {metric.label.includes('Value') && <DollarSign size={14} className="text-[var(--color-accent-blue)]" />}
              {metric.label.includes('Frequency') && <TrendingUp size={14} className="text-[var(--color-accent-blue)]" />}
              {metric.label.includes('Liquidate') && <Clock size={14} className="text-[var(--color-accent-blue)]" />}
              {metric.label.includes('Stale') && <AlertTriangle size={14} className="text-[var(--color-warning)]" />}
              <span className="text-xs text-[var(--color-text-muted)]">{metric.label}</span>
            </div>
            <div className="text-lg font-bold text-[var(--color-text-primary)]">
              {metric.value}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              {metric.description}
            </div>
          </div>
        ))}
      </div>

      {/* Trading Activity Breakdown */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Trading Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Last 30 days</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-[var(--color-bg-tertiary)] rounded-full h-1.5">
                <div
                  className="bg-[var(--color-accent-blue)] h-1.5 rounded-full"
                  style={{ width: `${metrics.tradingDaysWithActivity.percentage30}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--color-text-primary)] w-12 text-right">
                {metrics.tradingDaysWithActivity.percentage30.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Last 90 days</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-[var(--color-bg-tertiary)] rounded-full h-1.5">
                <div
                  className="bg-[var(--color-accent-blue)] h-1.5 rounded-full"
                  style={{ width: `${metrics.tradingDaysWithActivity.percentage90}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--color-text-primary)] w-12 text-right">
                {metrics.tradingDaysWithActivity.percentage90.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Last 250 days</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-[var(--color-bg-tertiary)] rounded-full h-1.5">
                <div
                  className="bg-[var(--color-accent-blue)] h-1.5 rounded-full"
                  style={{ width: `${metrics.tradingDaysWithActivity.percentage250}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--color-text-primary)] w-12 text-right">
                {metrics.tradingDaysWithActivity.percentage250.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--color-warning)]" />
            Liquidity Warnings
          </h3>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${getSeverityColor(warning.severity)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold mb-1">
                      {warning.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs opacity-90">{warning.message}</div>
                  </div>
                  <div className="text-xs font-mono opacity-70">
                    {warning.value.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trading Restrictions */}
      {metrics.tradingRestrictions.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Trading Restrictions</h3>
          <ul className="space-y-2">
            {metrics.tradingRestrictions.map((restriction, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                <AlertTriangle size={12} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
                <span>{restriction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
