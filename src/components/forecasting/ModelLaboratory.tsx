// ============================================================
// Model Laboratory - Walk-Forward Comparison
// ============================================================
import React, { useState } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { runModelComparison } from '../../engine/forecasting';
import { MODEL_DEFINITIONS } from '../../engine/models';
import { Button, StatusBadge, EmptyState, LoadingState, Disclaimer, MetricCard } from '../common';
import { formatPercentPlain, formatDuration } from '../../utils/formatters';
import { ModelComparison, ForecastHorizon, ModelType } from '../../types';
import { FlaskConical, Play, BarChart3 } from 'lucide-react';

interface ModelLaboratoryProps {
  onNavigate: (page: string) => void;
}

export function ModelLaboratory({ onNavigate }: ModelLaboratoryProps) {
  const { state } = useAppState();
  const datasets = useAllDatasets();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [horizon, setHorizon] = useState<ForecastHorizon>(5);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical size={32} />}
        title="No Data Available"
        description="Import stock data before running model comparisons."
        action={<Button onClick={() => onNavigate('data')}>Import Data</Button>}
      />
    );
  }

  const handleRunComparison = () => {
    if (!selectedSymbol) return;
    const dataset = state.datasets.get(selectedSymbol);
    if (!dataset) return;

    setIsRunning(true);
    setTimeout(() => {
      try {
        const result = runModelComparison(dataset.prices, horizon);
        setComparison(result);
      } catch (err) {
        console.error('Comparison error:', err);
      }
      setIsRunning(false);
    }, 100);
  };

  const bestModel = comparison?.models.reduce((best, m) => {
    if (m.status === 'insufficient_data') return best;
    if (!best || m.metrics.mae < best.metrics.mae) return m;
    return best;
  }, null as typeof comparison.models[0] | null);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Model Comparison Laboratory</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Compare forecasting models using walk-forward backtesting. Each model is trained on past data and evaluated on genuinely unseen future observations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Stock</label>
            <select
              value={selectedSymbol}
              onChange={(e) => { setSelectedSymbol(e.target.value); setComparison(null); }}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>{ds.info.symbol} — {ds.info.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Forecast Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value) as ForecastHorizon)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value={1}>1 Session</option>
              <option value={5}>5 Sessions</option>
              <option value={20}>20 Sessions</option>
              <option value={60}>60 Sessions</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleRunComparison} disabled={!selectedSymbol || isRunning}>
              <Play size={14} />
              {isRunning ? 'Running...' : 'Run Comparison'}
            </Button>
          </div>
        </div>
      </div>

      {isRunning && <LoadingState message="Running walk-forward backtest across all models..." />}

      {/* Results */}
      {comparison && !isRunning && (
        <div className="space-y-4">
          {/* Summary */}
          {comparison.evaluationPeriod.start && (
            <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-3 text-xs text-[var(--color-text-muted)]">
              Evaluation period: {comparison.evaluationPeriod.start} — {comparison.evaluationPeriod.end} · Baseline: Historical Average Return
            </div>
          )}

          {/* Model Comparison Table */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Model Performance Comparison</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-primary)]">
                    <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Model</th>
                    <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Status</th>
                    <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">MAE</th>
                    <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">RMSE</th>
                    <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Dir. Accuracy</th>
                    <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">vs Baseline</th>
                    <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Interval Cov.</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.models.map(model => {
                    const isBest = bestModel?.modelId === model.modelId;
                    return (
                      <tr key={model.modelId} className={`border-b border-[var(--color-border-primary)] ${isBest ? 'bg-[var(--color-positive-dim)]' : ''}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-text-primary)]">{model.modelName}</span>
                            {isBest && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold">BEST</span>}
                          </div>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                            {MODEL_DEFINITIONS.find(m => m.id === model.modelId)?.category}
                          </p>
                        </td>
                        <td className="p-3"><StatusBadge status={model.status} /></td>
                        <td className="p-3 text-right font-mono text-[var(--color-text-primary)]">{(model.metrics.mae * 100).toFixed(3)}%</td>
                        <td className="p-3 text-right font-mono text-[var(--color-text-primary)]">{(model.metrics.rmse * 100).toFixed(3)}%</td>
                        <td className="p-3 text-right font-mono text-[var(--color-text-primary)]">{(model.metrics.directionalAccuracy * 100).toFixed(1)}%</td>
                        <td className={`p-3 text-right font-mono ${model.metrics.baselineImprovement >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                          {model.metrics.baselineImprovement >= 0 ? '+' : ''}{model.metrics.baselineImprovement.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right font-mono text-[var(--color-text-primary)]">{model.metrics.predictionIntervalCoverage.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Interpretation</h4>
            <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              {bestModel ? (
                <>
                  <p>
                    The <strong className="text-[var(--color-text-primary)]">{bestModel.modelName}</strong> model achieved the lowest MAE of {(bestModel.metrics.mae * 100).toFixed(3)}% 
                    on out-of-sample data.
                  </p>
                  {bestModel.metrics.baselineImprovement > 0 ? (
                    <p>
                      It outperformed the historical average baseline by {bestModel.metrics.baselineImprovement.toFixed(1)}%, 
                      suggesting the features provide some predictive information for this stock over this period.
                    </p>
                  ) : (
                    <p className="text-[var(--color-warning)]">
                      No model outperformed the simple historical average baseline. This is a valid finding — 
                      it suggests that for this stock and period, sophisticated models do not add measurable value over a naive approach.
                    </p>
                  )}
                  {bestModel.metrics.directionalAccuracy < 0.55 && (
                    <p className="text-[var(--color-warning)]">
                      Directional accuracy is below 55%, indicating limited ability to consistently predict the direction of price movements.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[var(--color-warning)]">Insufficient data to determine a best model. Try importing a dataset with more historical records.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
