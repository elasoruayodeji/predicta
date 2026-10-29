// ============================================================
// Anomaly Detection Panel
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { detectAnomalies } from '../../engine/anomaly';
import { Button, EmptyState, LoadingState, Disclaimer, MetricCard } from '../common';
import { formatDate, formatVolume, formatPercentPlain, getSeverityColor } from '../../utils/formatters';
import { AnomalyEvent } from '../../types';
import { AlertTriangle, Search, Filter, Eye } from 'lucide-react';

interface AnomalyPanelProps {
  onNavigate: (page: string) => void;
}

export function AnomalyPanel({ onNavigate }: AnomalyPanelProps) {
  const { state, dispatch } = useAppState();
  const datasets = useAllDatasets();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const anomalies = useMemo(() => {
    if (!selectedSymbol) return [];
    const dataset = state.datasets.get(selectedSymbol);
    if (!dataset) return [];
    
    // Check cache first
    const cached = state.anomalies.get(selectedSymbol);
    if (cached) return cached;

    // Run detection
    const detected = detectAnomalies(dataset.prices);
    dispatch({ type: 'SET_ANOMALIES', payload: { symbol: selectedSymbol, anomalies: detected } });
    return detected;
  }, [selectedSymbol, state.datasets, state.anomalies, dispatch]);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
      return true;
    });
  }, [anomalies, filterType, filterSeverity]);

  // Summary stats
  const summary = useMemo(() => {
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
    const byType = { price_spike: 0, price_drop: 0, volume_spike: 0, volatility_spike: 0, pattern_break: 0 };
    anomalies.forEach(a => {
      bySeverity[a.severity]++;
      byType[a.type]++;
    });
    return { bySeverity, byType, total: anomalies.length };
  }, [anomalies]);

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} />}
        title="No Data Available"
        description="Import stock data to detect anomalies."
        action={<Button onClick={() => onNavigate('data')}>Import Data</Button>}
      />
    );
  }

  const typeLabels: Record<string, string> = {
    all: 'All Types',
    price_spike: 'Price Spikes',
    price_drop: 'Price Drops',
    volume_spike: 'Volume Spikes',
    volatility_spike: 'Volatility Spikes',
    pattern_break: 'Pattern Breaks',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Controls */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Anomaly Detection</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Identifies unusual price movements, volume spikes, and volatility changes using statistical thresholds. 
          Anomalies are alerts for further investigation, not proof of manipulation or reliable crash predictions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Stock</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>{ds.info.symbol} — {ds.info.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {selectedSymbol && anomalies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Total Anomalies" value={summary.total.toString()} />
          <MetricCard label="Critical" value={summary.bySeverity.critical.toString()} variant="negative" />
          <MetricCard label="High" value={summary.bySeverity.high.toString()} variant="warning" />
          <MetricCard label="Price Events" value={(summary.byType.price_spike + summary.byType.price_drop).toString()} />
        </div>
      )}

      {/* Anomaly List */}
      {selectedSymbol && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Detected Anomalies ({filteredAnomalies.length})
            </h4>
          </div>
          
          {filteredAnomalies.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
              {anomalies.length === 0 ? 'No anomalies detected in this dataset.' : 'No anomalies match the current filters.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-primary)] max-h-[500px] overflow-y-auto">
              {filteredAnomalies.slice(0, 50).map((anomaly, idx) => (
                <div key={idx} className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] capitalize">
                            {anomaly.type.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{anomaly.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--color-text-muted)]">
                          <span>{formatDate(anomaly.date)}</span>
                          <span>Metric: {anomaly.metric}</span>
                          <span>Score: {anomaly.score.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
