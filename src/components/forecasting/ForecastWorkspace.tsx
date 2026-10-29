// ============================================================
// Forecasting Workspace
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { runForecast } from '../../engine/forecasting';
import { MODEL_DEFINITIONS } from '../../engine/models';
import { MetricCard, Button, StatusBadge, WarningBanner, Disclaimer, LoadingState, EmptyState } from '../common';
import { formatPrice, formatPercent, formatPercentPlain, formatDate, formatDuration } from '../../utils/formatters';
import { ForecastResult, ForecastHorizon, ModelType } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Play, AlertTriangle, TrendingUp, Clock, Target } from 'lucide-react';

interface ForecastWorkspaceProps {
  onNavigate: (page: string) => void;
}

export function ForecastWorkspace({ onNavigate }: ForecastWorkspaceProps) {
  const { state } = useAppState();
  const datasets = useAllDatasets();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelType>('ridge_regression');
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>(5);
  const [trainingWindow, setTrainingWindow] = useState<number>(0); // 0 = all data
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={32} />}
        title="No Data Available"
        description="Import stock data before running forecasts."
        action={<Button onClick={() => onNavigate('data')}>Import Data</Button>}
      />
    );
  }

  const handleRunForecast = () => {
    if (!selectedSymbol) return;
    const dataset = state.datasets.get(selectedSymbol);
    if (!dataset) return;

    setIsRunning(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const result = runForecast(
          dataset.prices,
          selectedHorizon,
          selectedModel,
          trainingWindow > 0 ? trainingWindow : undefined
        );
        setForecast(result);
      } catch (err) {
        console.error('Forecast error:', err);
      }
      setIsRunning(false);
    }, 100);
  };

  // Generate chart data showing historical prices + forecast region
  const chartData = useMemo(() => {
    if (!forecast || !selectedSymbol) return [];
    const dataset = state.datasets.get(selectedSymbol);
    if (!dataset) return [];

    const prices = dataset.prices;
    const lastN = Math.min(60, prices.length);
    const recentPrices = prices.slice(-lastN);
    
    const data: { date: string; actual?: number; forecast?: number; upper?: number; lower?: number }[] = recentPrices.map((p) => ({
      date: p.date,
      actual: p.close,
    }));

    // Add forecast points
    const lastPrice = forecast.lastObservedPrice;
    const lastDate = forecast.lastObservedDate;
    
    // Add the forecast start point
    data.push({
      date: lastDate,
      actual: lastPrice,
      forecast: lastPrice,
      upper: lastPrice,
      lower: lastPrice,
    });

    // Generate interpolated forecast path
    for (let i = 1; i <= Math.min(selectedHorizon, 20); i++) {
      const progress = i / selectedHorizon;
      const estReturn = forecast.estimatedReturn * progress;
      const estPrice = lastPrice * (1 + estReturn);
      const uncertainty = (forecast.upperBound - forecast.lowerBound) / 2 * Math.sqrt(progress);
      
      data.push({
        date: `+${i}d`,
        actual: undefined,
        forecast: estPrice,
        upper: estPrice + uncertainty,
        lower: estPrice - uncertainty,
      });
    }

    return data;
  }, [forecast, selectedSymbol, selectedHorizon, state.datasets]);

  const horizons: { value: ForecastHorizon; label: string }[] = [
    { value: 1, label: '1 Session' },
    { value: 5, label: '5 Sessions' },
    { value: 20, label: '20 Sessions' },
    { value: 60, label: '60 Sessions' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Configuration Panel */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Forecast Configuration</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Selection */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Stock</label>
            <select
              value={selectedSymbol}
              onChange={(e) => { setSelectedSymbol(e.target.value); setForecast(null); }}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>
                  {ds.info.symbol} — {ds.info.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value as ModelType); setForecast(null); }}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              {MODEL_DEFINITIONS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Horizon Selection */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Forecast Horizon</label>
            <select
              value={selectedHorizon}
              onChange={(e) => { setSelectedHorizon(Number(e.target.value) as ForecastHorizon); setForecast(null); }}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              {horizons.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {/* Training Window */}
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Training Window</label>
            <select
              value={trainingWindow}
              onChange={(e) => setTrainingWindow(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value={0}>All available data</option>
              <option value={252}>~1 year (252 days)</option>
              <option value={504}>~2 years (504 days)</option>
              <option value={1008}>~4 years (1008 days)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button 
            onClick={handleRunForecast} 
            disabled={!selectedSymbol || isRunning}
          >
            <Play size={14} />
            {isRunning ? 'Running...' : 'Run Forecast'}
          </Button>
          {forecast && (
            <StatusBadge status={forecast.status} />
          )}
        </div>
      </div>

      {/* Results */}
      {isRunning && <LoadingState message="Computing forecast..." />}

      {forecast && !isRunning && (
        <div className="space-y-4">
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Estimated Return"
              value={formatPercentPlain(forecast.estimatedReturn)}
              variant={forecast.estimatedReturn >= 0 ? 'positive' : 'negative'}
              icon={<Target size={18} className={forecast.estimatedReturn >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'} />}
            />
            <MetricCard
              label="Estimated Price"
              value={formatPrice(forecast.estimatedPrice)}
              subtitle={`${selectedHorizon}-session ahead`}
            />
            <MetricCard
              label="Approximate Interval"
              value={`${formatPrice(forecast.lowerBound)} — ${formatPrice(forecast.upperBound)}`}
              subtitle="±1.96σ (assumes normality)"
              variant="forecast"
            />
            <MetricCard
              label="Directional Accuracy"
              value={`${(forecast.metrics.directionalAccuracy * 100).toFixed(1)}%`}
              subtitle="On validation data"
            />
          </div>

          {/* Interval Limitations Note */}
          <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg p-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text-secondary)]">Note:</strong> {forecast.intervalNote}
            </p>
          </div>

          {/* Forecast Chart */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              Price History & Forecast
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => v.toFixed(0)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--color-text-muted)' }}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="var(--color-forecast)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-bg-secondary)" fillOpacity={1} />
                <Line type="monotone" dataKey="actual" stroke="var(--color-accent-blue)" strokeWidth={2} dot={false} name="Actual Price" />
                <Line type="monotone" dataKey="forecast" stroke="var(--color-forecast)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[var(--color-accent-blue)]"></span> Historical</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[var(--color-forecast)] border-dashed"></span> Forecast</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[var(--color-forecast)] opacity-20 rounded-sm"></span> Uncertainty band</span>
            </div>
          </div>

          {/* Model Details */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Model Evaluation</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">MAE</p>
                <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{(forecast.metrics.mae * 100).toFixed(3)}%</p>
              </div>
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">RMSE</p>
                <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{(forecast.metrics.rmse * 100).toFixed(3)}%</p>
              </div>
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">Dir. Accuracy</p>
                <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{(forecast.metrics.directionalAccuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">vs Baseline</p>
                <p className={`text-sm font-mono font-bold ${forecast.metrics.baselineImprovement >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                  {forecast.metrics.baselineImprovement >= 0 ? '+' : ''}{forecast.metrics.baselineImprovement.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">Interval Cov.</p>
                <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{forecast.metrics.predictionIntervalCoverage.toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)]">Train Time</p>
                <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{formatDuration(forecast.metrics.trainingTimeMs)}</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {forecast.warnings.length > 0 && <WarningBanner warnings={forecast.warnings} />}

          {/* Metadata */}
          <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><span className="text-[var(--color-text-muted)]">Model:</span> <span className="text-[var(--color-text-primary)]">{forecast.modelName}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Horizon:</span> <span className="text-[var(--color-text-primary)]">{forecast.horizon} sessions</span></div>
              <div><span className="text-[var(--color-text-muted)]">Last Price:</span> <span className="text-[var(--color-text-primary)] font-mono">{formatPrice(forecast.lastObservedPrice)}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Last Date:</span> <span className="text-[var(--color-text-primary)]">{formatDate(forecast.lastObservedDate)}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Training:</span> <span className="text-[var(--color-text-primary)]">{formatDate(forecast.trainingPeriod.start)} — {formatDate(forecast.trainingPeriod.end)}</span></div>
              <div><span className="text-[var(--color-text-muted)]">Generated:</span> <span className="text-[var(--color-text-primary)]">{formatDate(forecast.forecastDate)}</span></div>
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
