// ============================================================
// Dashboard Page
// ============================================================
import React from 'react';
import { useAppState } from '../../store/AppContext';
import { MetricCard, EmptyState, DataImportPrompt, StatusBadge } from '../common';
import { InvestoConnectionStatus } from '../common/InvestoConnectionStatus';
import { MarketMovers } from './MarketMovers';
import { formatPrice, formatPercent, formatDate, formatVolume, getChangeColor } from '../../utils/formatters';
import { Database, TrendingUp, AlertTriangle, FileText, BarChart3, Activity } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onSelectStock?: (symbol: string) => void;
}

export function Dashboard({ onNavigate, onSelectStock }: DashboardProps) {
  const { state } = useAppState();
  const datasets = Array.from(state.datasets.values());

if (datasets.length === 0) {
  return (
    <DataImportPrompt
      onImport={() => onNavigate('data')}
      onBrowseInvesto={() => onNavigate('explore')}
    />
  );
}

  const totalRecords = datasets.reduce((sum, d) => sum + d.info.recordCount, 0);
  const totalAnomalies = Array.from(state.anomalies.values()).reduce((sum, a) => sum + a.length, 0);
  const latestDataset = datasets[datasets.length - 1];

  const handleSelectStock = (symbol: string) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    } else {
      onNavigate('explore');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dashboard</h2>
        <InvestoConnectionStatus />
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Imported Stocks"
          value={datasets.length.toString()}
          icon={<Database size={18} className="text-[var(--color-accent-blue)]" />}
          subtitle={`${totalRecords.toLocaleString()} total records`}
        />
        <MetricCard
          label="Saved Reports"
          value={state.reports.length.toString()}
          icon={<FileText size={18} className="text-[var(--color-forecast)]" />}
          subtitle="Research analyses"
        />
        <MetricCard
          label="Anomaly Alerts"
          value={totalAnomalies.toString()}
          icon={<AlertTriangle size={18} className="text-[var(--color-warning)]" />}
          subtitle="Across all stocks"
        />
        <MetricCard
          label="Watchlist"
          value={state.watchlist.length.toString()}
          icon={<Activity size={18} className="text-[var(--color-positive)]" />}
          subtitle="Tracked instruments"
        />
      </div>

      {/* Market Movers */}
      <MarketMovers onSelectStock={handleSelectStock} />

      {/* Recent Datasets */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Imported Datasets</h3>
          <button 
            onClick={() => onNavigate('data')}
            className="text-xs text-[var(--color-accent-blue)] hover:underline"
          >
            Import More
          </button>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)]">
          {datasets.map(ds => {
            const lastPrice = ds.prices[ds.prices.length - 1];
            const firstPrice = ds.prices[0];
            const totalReturn = lastPrice && firstPrice 
              ? ((lastPrice.close / firstPrice.close) - 1) 
              : 0;
            const anomalyCount = state.anomalies.get(ds.info.symbol)?.length ?? 0;

            return (
              <div 
                key={ds.info.symbol}
                className="p-4 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                onClick={() => onNavigate('analysis')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                      <BarChart3 size={18} className="text-[var(--color-accent-blue)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{ds.info.symbol}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{ds.info.name} · {ds.info.exchange}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)]">
                      {formatPrice(lastPrice?.close ?? 0, ds.info.currency)}
                    </p>
                    <p className={`text-xs font-mono ${getChangeColor(totalReturn)}`}>
                      {formatPercent(totalReturn)} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--color-text-muted)]">
                  <span>{ds.info.recordCount.toLocaleString()} records</span>
                  <span>{formatDate(ds.info.dateRange.start)} — {formatDate(ds.info.dateRange.end)}</span>
                  <span className="capitalize">{ds.quality.overallScore} quality</span>
                  {anomalyCount > 0 && (
                    <span className="text-[var(--color-warning)]">{anomalyCount} anomalies</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      {state.reports.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Reports</h3>
          </div>
          <div className="divide-y divide-[var(--color-border-primary)]">
            {state.reports.slice(0, 5).map(report => (
              <div key={report.id} className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{report.stockSymbol}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Generated {formatDate(report.generatedAt.split('T')[0])}
                    </p>
                  </div>
                  <StatusBadge status={report.forecasts[0]?.status ?? 'experimental'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('explore')}
          className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl hover:border-[var(--color-accent-blue)]/30 transition-colors text-left"
        >
          <TrendingUp size={20} className="text-[var(--color-accent-blue)] mb-2" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Analyse a Stock</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">View historical data and statistics</p>
        </button>
        <button
          onClick={() => onNavigate('forecast')}
          className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl hover:border-[var(--color-forecast)]/30 transition-colors text-left"
        >
          <TrendingUp size={20} className="text-[var(--color-forecast)] mb-2" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Run Forecast</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Generate predictions with uncertainty</p>
        </button>
        <button
          onClick={() => onNavigate('laboratory')}
          className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl hover:border-[var(--color-positive)]/30 transition-colors text-left"
        >
          <BarChart3 size={20} className="text-[var(--color-positive)] mb-2" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Compare Models</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Walk-forward backtesting results</p>
        </button>
      </div>
    </div>
  );
}
