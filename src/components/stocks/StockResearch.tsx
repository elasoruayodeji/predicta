// ============================================================
// Stock Research Page - Comprehensive Individual Stock Analysis
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../store/AppContext';
import { useDataset } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { calculateHistoricalStatistics, calculateMovingAverages, calculateRSI, calculateMACD } from '../../engine/statistics';
import { calculateLiquidityMetrics } from '../../engine/liquidity';
import { formatPrice, formatPercent, formatPercentPlain, formatDate, formatVolume, getChangeColor } from '../../utils/formatters';
import { CandlestickChart } from '../charts/CandlestickChart';
import { LiquidityPanel } from './LiquidityPanel';
import { MetricCard, Tabs, Button, WarningBanner, Disclaimer } from '../common';
import { 
  ArrowLeft, Star, TrendingUp, BarChart3, Activity, AlertTriangle,
  DollarSign, PieChart, FileText, Target, Zap, Clock, CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';

interface StockResearchProps {
  symbol: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export function StockResearch({ symbol, onBack, onNavigate }: StockResearchProps) {
  const { state, dispatch } = useAppState();
  const { user } = useAuth();
  const dataset = useDataset(symbol);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'1Y' | '5Y' | '10Y' | 'ALL'>('ALL');
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

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
    return filtered.length >= 20 ? filtered : prices;
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

  const rsi = useMemo(() => {
    return calculateRSI(filteredPrices);
  }, [filteredPrices]);

  const macd = useMemo(() => {
    return calculateMACD(filteredPrices);
  }, [filteredPrices]);

  const liquidityMetrics = useMemo(() => {
    try {
      return calculateLiquidityMetrics(prices);
    } catch {
      return null;
    }
  }, [prices]);

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
    open: p.open,
    high: p.high,
    low: p.low,
    volume: p.volume,
    ma20: movingAverages.find(ma => ma.period === 20)?.values.find(v => v.date === p.date)?.value,
    ma50: movingAverages.find(ma => ma.period === 50)?.values.find(v => v.date === p.date)?.value,
  }));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'price', label: 'Price Analysis' },
    { id: 'technical', label: 'Technical' },
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'liquidity', label: 'Liquidity' },
    { id: 'research', label: 'Research' },
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
              {info.dataSource === 'Market Data' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold flex items-center gap-1">
                  <CheckCircle size={8} />
                  LIVE DATA
                </span>
              )}
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

      {/* Key Metrics */}
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

          {/* Company Overview */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Company Overview</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[var(--color-text-muted)]">Sector:</span>
                <span className="ml-2 text-[var(--color-text-primary)]">Not available</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Market Cap:</span>
                <span className="ml-2 text-[var(--color-text-primary)]">Not available</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Data Source:</span>
                <span className="ml-2 text-[var(--color-text-primary)]">{info.dataSource}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Last Updated:</span>
                <span className="ml-2 text-[var(--color-text-primary)]">{formatDate(info.importedAt.split('T')[0])}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'price' && (
        <div className="space-y-4">
          <CandlestickChart 
            data={filteredPrices} 
            showVolume={showVolume}
            showMA={showMA}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowMA(!showMA)}>
              {showMA ? 'Hide' : 'Show'} Moving Averages
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowVolume(!showVolume)}>
              {showVolume ? 'Hide' : 'Show'} Volume
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'technical' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard label="Annualized Return" value={formatPercentPlain(stats.annualizedReturn)} variant={stats.annualizedReturn >= 0 ? 'positive' : 'negative'} />
          <MetricCard label="Annualized Volatility" value={formatPercentPlain(stats.annualizedVolatility)} />
          <MetricCard label="Sharpe Ratio" value={stats.sharpeRatio !== null ? stats.sharpeRatio.toFixed(2) : '—'} />
          <MetricCard label="Best Day" value={formatPercentPlain(stats.bestDay.return)} variant="positive" subtitle={formatDate(stats.bestDay.date)} />
          <MetricCard label="Worst Day" value={formatPercentPlain(stats.worstDay.return)} variant="negative" subtitle={formatDate(stats.worstDay.date)} />
          <MetricCard label="Positive Days" value={`${stats.positiveDays} (${((stats.positiveDays / (stats.positiveDays + stats.negativeDays)) * 100).toFixed(1)}%)`} />
        </div>
      )}

      {activeTab === 'fundamentals' && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Financial Fundamentals</h4>
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Financial statements not available</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Fundamental data requires integration with financial statement providers.
              <br />This feature will be available when financial data sources are configured.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Valuation Analysis</h4>
          <div className="text-center py-8">
            <Target size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Valuation requires financial data</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Use the Valuation Workbench to perform DCF, DDM, and multiples-based valuation.
            </p>
            <Button variant="primary" onClick={() => onNavigate('valuation')}>
              Open Valuation Workbench
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'liquidity' && liquidityMetrics && (
        <LiquidityPanel metrics={liquidityMetrics} />
      )}

      {activeTab === 'research' && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Research Assessment</h4>
          <div className="text-center py-8">
            <Zap size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">AI Research Assistant</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Ask PREDICTA for detailed research analysis, investment thesis, and risk assessment.
            </p>
            <Button variant="primary" onClick={() => onNavigate('ask')}>
              Ask PREDICTA
            </Button>
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
