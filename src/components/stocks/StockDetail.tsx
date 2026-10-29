// ============================================================
// Stock Detail / Analysis Page
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../store/AppContext';
import { useDataset } from '../../store/AppContext';
import { calculateHistoricalStatistics, calculateMovingAverages, calculateDrawdownSeries, calculateRollingVolatility } from '../../engine/statistics';
import { MetricCard, Tabs, Button, WarningBanner, Disclaimer, StatusBadge } from '../common';
import { formatPrice, formatPercent, formatPercentPlain, formatDate, formatVolume, getChangeColor } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { ArrowLeft, Star, Download, TrendingUp, BarChart3, Activity, AlertTriangle } from 'lucide-react';

interface StockDetailProps {
  symbol: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export function StockDetail({ symbol, onBack, onNavigate }: StockDetailProps) {
  const { state, dispatch } = useAppState();
  const dataset = useDataset(symbol);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'1Y' | '5Y' | '10Y' | 'ALL'>('ALL');
  const [showMA, setShowMA] = useState(true);

  if (!dataset) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--color-text-secondary)]">Stock not found. Please import data first.</p>
        <Button variant="secondary" onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { info, prices, quality } = dataset;

  // Filter by time range
  const filteredPrices = useMemo(() => {
    if (timeRange === 'ALL') return prices;
    const now = new Date(prices[prices.length - 1].date);
    const years = timeRange === '1Y' ? 1 : timeRange === '5Y' ? 5 : 10;
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - years);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const filtered = prices.filter(p => p.date >= cutoffStr);
    return filtered.length >= 20 ? filtered : prices; // fallback if not enough data
  }, [prices, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    try {
      return calculateHistoricalStatistics(filteredPrices);
    } catch {
      return null;
    }
  }, [filteredPrices]);

  const movingAverages = useMemo(() => {
    return calculateMovingAverages(filteredPrices);
  }, [filteredPrices]);

  const drawdownSeries = useMemo(() => {
    return calculateDrawdownSeries(filteredPrices);
  }, [filteredPrices]);

  const rollingVol = useMemo(() => {
    return calculateRollingVolatility(filteredPrices);
  }, [filteredPrices]);

  const isInWatchlist = state.watchlist.some(w => w.symbol === symbol);

  const toggleWatchlist = () => {
    if (isInWatchlist) {
      dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: symbol });
    } else {
      dispatch({
        type: 'ADD_TO_WATCHLIST',
        payload: {
          symbol: info.symbol,
          name: info.name,
          exchange: info.exchange,
          addedAt: new Date().toISOString(),
          lastPrice: prices[prices.length - 1]?.close,
          lastPriceDate: prices[prices.length - 1]?.date,
          anomalyCount: state.anomalies.get(symbol)?.length ?? 0,
        },
      });
    }
  };

  // Chart data
  const chartData = filteredPrices.map((p, i) => ({
    date: p.date,
    close: p.close,
    volume: p.volume,
    ma20: movingAverages.find(ma => ma.period === 20)?.values.find(v => v.date === p.date)?.value,
    ma50: movingAverages.find(ma => ma.period === 50)?.values.find(v => v.date === p.date)?.value,
  }));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'drawdown', label: 'Drawdown' },
    { id: 'volatility', label: 'Volatility' },
    { id: 'quality', label: 'Data Quality' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{info.symbol}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                {info.exchange}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">{info.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleWatchlist}>
            <Star size={14} className={isInWatchlist ? 'fill-[var(--color-warning)] text-[var(--color-warning)]' : ''} />
            {isInWatchlist ? 'Watchlisted' : 'Add to Watchlist'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => onNavigate('forecast')}>
            <TrendingUp size={14} />
            Forecast
          </Button>
        </div>
      </div>

      {/* Price and Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Last Close"
          value={formatPrice(prices[prices.length - 1]?.close ?? 0, info.currency)}
          subtitle={formatDate(prices[prices.length - 1]?.date)}
        />
        {stats && (
          <>
            <MetricCard
              label="Total Return"
              value={formatPercentPlain(stats.totalReturn)}
              variant={stats.totalReturn >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Annualized Vol"
              value={formatPercentPlain(stats.annualizedVolatility)}
              subtitle="Historical"
            />
            <MetricCard
              label="Max Drawdown"
              value={formatPercentPlain(-stats.maxDrawdown)}
              variant="negative"
              subtitle={formatDate(stats.maxDrawdownDate)}
            />
          </>
        )}
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2">
          {(['1Y', '5Y', '10Y', 'ALL'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              {range}
            </button>
          ))}
          {activeTab === 'overview' && (
            <button
              onClick={() => setShowMA(!showMA)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                showMA ? 'bg-[var(--color-forecast-dim)] text-[var(--color-forecast)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              MA
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Price Chart */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Price History</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v) => formatDate(v).split(',').slice(0, 2).join(',')}
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
                  labelFormatter={(v) => formatDate(v as string)}
                />
                <Area type="monotone" dataKey="close" stroke="var(--color-accent-blue)" fill="var(--color-accent-blue)" fillOpacity={0.05} strokeWidth={2} dot={false} name="Close" />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="ma20" stroke="var(--color-warning)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="20-day MA" />
                    <Line type="monotone" dataKey="ma50" stroke="var(--color-forecast)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="50-day MA" />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Volume</h4>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
                <XAxis dataKey="date" tick={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => formatVolume(v)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [formatVolume(value), 'Volume']}
                  labelFormatter={(v) => formatDate(v as string)}
                />
                <Area type="monotone" dataKey="volume" stroke="var(--color-text-muted)" fill="var(--color-bg-hover)" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard label="Annualized Return" value={formatPercentPlain(stats.annualizedReturn)} variant={stats.annualizedReturn >= 0 ? 'positive' : 'negative'} />
          <MetricCard label="Annualized Volatility" value={formatPercentPlain(stats.annualizedVolatility)} />
          <MetricCard label="Sharpe Ratio" value={stats.sharpeRatio !== null ? stats.sharpeRatio.toFixed(2) : '—'} />
          <MetricCard label="Max Drawdown" value={formatPercentPlain(-stats.maxDrawdown)} variant="negative" subtitle={formatDate(stats.maxDrawdownDate)} />
          <MetricCard label="Best Day" value={formatPercentPlain(stats.bestDay.return)} variant="positive" subtitle={formatDate(stats.bestDay.date)} />
          <MetricCard label="Worst Day" value={formatPercentPlain(stats.worstDay.return)} variant="negative" subtitle={formatDate(stats.worstDay.date)} />
          <MetricCard label="Positive Days" value={`${stats.positiveDays} (${((stats.positiveDays / (stats.positiveDays + stats.negativeDays)) * 100).toFixed(1)}%)`} />
          <MetricCard label="Avg Daily Return" value={formatPercentPlain(stats.avgDailyReturn)} />
          <MetricCard label="Skewness" value={stats.skewness.toFixed(3)} />
          <MetricCard label="Kurtosis" value={stats.kurtosis.toFixed(3)} />
          <MetricCard label="Avg Volume" value={formatVolume(stats.avgVolume)} />
          <MetricCard label="Median Volume" value={formatVolume(stats.medianVolume)} />
        </div>
      )}

      {activeTab === 'drawdown' && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Drawdown from Peak</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={drawdownSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `-${(v * 100).toFixed(0)}%`} reversed />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`-${(value * 100).toFixed(2)}%`, 'Drawdown']}
                labelFormatter={(v) => formatDate(v as string)}
              />
              <Area type="monotone" dataKey="drawdown" stroke="var(--color-negative)" fill="var(--color-negative)" fillOpacity={0.2} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'volatility' && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">20-Day Rolling Volatility (Annualized)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={rollingVol}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-primary)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Volatility']}
                labelFormatter={(v) => formatDate(v as string)}
              />
              <Area type="monotone" dataKey="value" stroke="var(--color-warning)" fill="var(--color-warning)" fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-4">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Data Quality Assessment</h4>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                quality.overallScore === 'excellent' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                quality.overallScore === 'good' ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]' :
                quality.overallScore === 'fair' ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]' :
                'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
              }`}>
                {quality.overallScore}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Total Records</p>
                <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{quality.totalRecords.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Duplicates</p>
                <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{quality.duplicateDates.length}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Invalid Prices</p>
                <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{quality.invalidPrices}</p>
              </div>
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Zero Volume</p>
                <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{quality.zeroVolumeDays}</p>
              </div>
            </div>
          </div>

          {quality.warnings.length > 0 && <WarningBanner warnings={quality.warnings} />}

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Data Source Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Source</span><span className="text-[var(--color-text-primary)]">{info.dataSource}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Imported</span><span className="text-[var(--color-text-primary)]">{formatDate(info.importedAt.split('T')[0])}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Date Range</span><span className="text-[var(--color-text-primary)]">{formatDate(info.dateRange.start)} — {formatDate(info.dateRange.end)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Currency</span><span className="text-[var(--color-text-primary)]">{info.currency}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Exchange</span><span className="text-[var(--color-text-primary)]">{info.exchange}</span></div>
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
