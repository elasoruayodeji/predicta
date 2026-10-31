// ============================================================
// Premium Dashboard - Financial Intelligence Workspace
// ============================================================
import React, { useMemo, useState, useEffect } from 'react';
import { useAppState } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { MetricCard, EmptyState, StatusBadge } from '../common';
import { InvestoConnectionStatus } from '../common/InvestoConnectionStatus';
import { MarketMovers } from './MarketMovers';
import { formatPrice, formatPercent, formatDate, formatVolume, getChangeColor } from '../../utils/formatters';
import { calculateHistoricalStatistics } from '../../engine/statistics';
import { fetchInvestoIndices } from '../../services/investoClient';
import { 
  Database, TrendingUp, AlertTriangle, FileText, BarChart3, Activity,
  Eye, Clock, Star, Plus, ArrowRight, Bell, Calendar, Zap, Target,
  PieChart as PieChartIcon, TrendingDown, Award, Globe, Loader2
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onSelectStock?: (symbol: string) => void;
}

export function Dashboard({ onNavigate, onSelectStock }: DashboardProps) {
  const { state } = useAppState();
  const { user } = useAuth();
  const datasets = Array.from(state.datasets.values());
  const userName = state.settings.userName || 'Investor';

  // Calculate portfolio metrics if transactions exist
  const portfolioData = useMemo(() => {
    // Load transactions from user-scoped storage
    const userId = user?.id;
    const storageKey = userId ? `predicta_portfolio_transactions_${userId}` : 'predicta_portfolio_transactions';
    const transactions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (transactions.length === 0) return null;

    // Calculate total portfolio value from holdings
    let totalValue = 0;
    let totalCost = 0;
    const holdings: { symbol: string; value: number; weight: number }[] = [];

    // Group by symbol and calculate
    const bySymbol = new Map<string, any[]>();
    transactions.forEach((tx: any) => {
      if (!bySymbol.has(tx.symbol)) bySymbol.set(tx.symbol, []);
      bySymbol.get(tx.symbol)!.push(tx);
    });

    bySymbol.forEach((txs, symbol) => {
      const dataset = datasets.find(d => d.info.symbol === symbol);
      if (!dataset || dataset.prices.length === 0) return;

      const currentPrice = dataset.prices[dataset.prices.length - 1].close;
      let quantity = 0;
      let cost = 0;

      txs.forEach((tx: any) => {
        if (tx.type === 'buy') {
          quantity += tx.quantity;
          cost += tx.quantity * tx.price;
        } else if (tx.type === 'sell') {
          quantity -= tx.quantity;
          cost -= tx.quantity * (cost / (quantity + tx.quantity));
        }
      });

      if (quantity > 0) {
        const value = quantity * currentPrice;
        totalValue += value;
        totalCost += cost;
        holdings.push({ symbol, value, weight: 0 });
      }
    });

    // Calculate weights
    holdings.forEach(h => h.weight = (h.value / totalValue) * 100);

    const dailyChange = totalValue - totalCost;
    const dailyChangePercent = totalCost > 0 ? (dailyChange / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      dailyChange,
      dailyChangePercent,
      holdings: holdings.sort((a, b) => b.weight - a.weight),
      holdingsCount: holdings.length,
    };
  }, [datasets, user]);

  // Get market indices from Investo API
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [indicesError, setIndicesError] = useState<string | null>(null);

  useEffect(() => {
    const loadIndices = async () => {
      try {
        setIndicesLoading(true);
        const result = await fetchInvestoIndices();
        if (result.ok) {
          // Map API response to display format
          const indices = result.data.map((idx: any) => ({
            name: idx.name || idx.code,
            value: idx.level || idx.value || 0,
            change: idx.change || 0,
            changePercent: idx.change_percent || 0,
          }));
          setMarketIndices(indices);
          setIndicesError(null);
        } else {
          setIndicesError(result.error?.message || 'Failed to load market indices');
          setMarketIndices([]);
        }
      } catch (error) {
        setIndicesError('Failed to connect to market data service');
        setMarketIndices([]);
      } finally {
        setIndicesLoading(false);
      }
    };

    loadIndices();
  }, []);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: { type: string; symbol: string; action: string; time: string }[] = [];
    
    // Add recent reports
    state.reports.slice(0, 3).forEach(report => {
      activities.push({
        type: 'report',
        symbol: report.stockSymbol,
        action: 'Research report generated',
        time: report.generatedAt,
      });
    });

    // Add recent imports
    datasets.slice(0, 3).forEach(ds => {
      activities.push({
        type: 'import',
        symbol: ds.info.symbol,
        action: 'Data imported',
        time: ds.info.importedAt,
      });
    });

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [state.reports, datasets]);

  // Watchlist preview
  const watchlistPreview = useMemo(() => {
    return state.watchlist.slice(0, 5).map(item => {
      const dataset = datasets.find(d => d.info.symbol === item.symbol);
      if (!dataset || dataset.prices.length === 0) return null;

      const lastPrice = dataset.prices[dataset.prices.length - 1].close;
      const prevPrice = dataset.prices.length > 1 ? dataset.prices[dataset.prices.length - 2].close : lastPrice;
      const change = lastPrice - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

      return {
        symbol: item.symbol,
        name: item.name,
        price: lastPrice,
        change,
        changePercent,
        sparkline: dataset.prices.slice(-30).map(p => ({ value: p.close })),
      };
    }).filter((w): w is NonNullable<typeof w> => w !== null);
  }, [state.watchlist, datasets]);

  if (datasets.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome to PREDICTA</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Your NGX financial intelligence workspace</p>
          </div>
          <InvestoConnectionStatus />
        </div>
        <EmptyState
          icon={<Database size={48} />}
          title="Get Started with PREDICTA"
          description="Import stock data to begin analyzing the Nigerian Exchange. You can import live market data or upload CSV files."
          action={
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('data')}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue-dim)] transition-colors"
              >
                Import Data
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                Browse Stocks
              </button>
            </div>
          }
        />
      </div>
    );
  }

  const totalRecords = datasets.reduce((sum, d) => sum + d.info.recordCount, 0);
  const totalAnomalies = Array.from(state.anomalies.values()).reduce((sum, a) => sum + a.length, 0);

  const handleSelectStock = (symbol: string) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    } else {
      onNavigate('explore');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back, {userName}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Here's your market intelligence overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <InvestoConnectionStatus />
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {indicesLoading ? (
          <div className="col-span-3 flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--color-accent-blue)]" />
            <span className="ml-2 text-sm text-[var(--color-text-muted)]">Loading market indices...</span>
          </div>
        ) : indicesError ? (
          <div className="col-span-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--color-negative)]">
              <AlertTriangle size={16} />
              <span className="text-sm">{indicesError}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Market indices data is currently unavailable. Please check your connection or try again later.
            </p>
          </div>
        ) : marketIndices.length === 0 ? (
          <div className="col-span-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-muted)]">No market indices data available</p>
          </div>
        ) : (
          marketIndices.map((index, idx) => (
            <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{index.name}</p>
                  <p className="text-xl font-bold text-[var(--color-text-primary)] font-mono mt-1">
                    {index.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <Globe size={20} className="text-[var(--color-accent-blue)]" />
              </div>
              <div className="flex items-center gap-2">
                {index.change >= 0 ? (
                  <TrendingUp size={14} className="text-[var(--color-positive)]" />
                ) : (
                  <TrendingDown size={14} className="text-[var(--color-negative)]" />
                )}
                <span className={`text-sm font-mono font-semibold ${getChangeColor(index.change)}`}>
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}{(index.changePercent * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Portfolio Overview (if exists) */}
      {portfolioData && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon size={18} className="text-[var(--color-accent-blue)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Portfolio Overview</h3>
            </div>
            <button
              onClick={() => onNavigate('portfolio')}
              className="text-xs text-[var(--color-accent-blue)] hover:underline flex items-center gap-1"
            >
              View Details <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Total Value"
                  value={formatPrice(portfolioData.totalValue, state.settings.currency)}
                  icon={<Award size={16} className="text-[var(--color-accent-blue)]" />}
                />
                <MetricCard
                  label="Daily P&L"
                  value={formatPrice(portfolioData.dailyChange, state.settings.currency)}
                  change={portfolioData.dailyChangePercent / 100}
                  variant={portfolioData.dailyChange >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="Holdings"
                  value={portfolioData.holdingsCount.toString()}
                  icon={<Activity size={16} className="text-[var(--color-positive)]" />}
                />
                <MetricCard
                  label="Total Return"
                  value={formatPercent(portfolioData.dailyChangePercent / 100)}
                  variant={portfolioData.dailyChangePercent >= 0 ? 'positive' : 'negative'}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Top Holdings</p>
              <div className="space-y-2">
                {portfolioData.holdings.slice(0, 3).map((holding, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text-primary)]">{holding.symbol}</span>
                    <span className="text-[var(--color-text-muted)] font-mono">{holding.weight.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Watchlist & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Watchlist Preview */}
          {watchlistPreview.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
              <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[var(--color-warning)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Watchlist</h3>
                </div>
                <button
                  onClick={() => onNavigate('watchlist')}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-[var(--color-border-primary)]">
                {watchlistPreview.map((stock, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                    onClick={() => handleSelectStock(stock.symbol)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--color-text-primary)]">{stock.symbol}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{stock.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stock.sparkline}>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={stock.change >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                            {formatPrice(stock.price, state.settings.currency)}
                          </p>
                          <p className={`text-xs font-mono ${getChangeColor(stock.changePercent)}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Movers */}
          <MarketMovers onSelectStock={handleSelectStock} />
        </div>

        {/* Right Column - Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
              <div className="p-4 border-b border-[var(--color-border-primary)]">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-accent-blue)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Activity</h3>
                </div>
              </div>
              <div className="divide-y divide-[var(--color-border-primary)]">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="p-3 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-start gap-2">
                      {activity.type === 'report' ? (
                        <FileText size={14} className="text-[var(--color-forecast)] mt-0.5" />
                      ) : (
                        <Database size={14} className="text-[var(--color-accent-blue)] mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-text-primary)]">
                          <span className="font-semibold">{activity.symbol}</span>
                          {' '}{activity.action}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {formatDate(activity.time.split('T')[0])}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[var(--color-warning)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('explore')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Plus size={14} className="text-[var(--color-accent-blue)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Add Stock to Watchlist</span>
              </button>
              <button
                onClick={() => onNavigate('portfolio')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Target size={14} className="text-[var(--color-positive)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Track Portfolio</span>
              </button>
              <button
                onClick={() => onNavigate('forecast')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <TrendingUp size={14} className="text-[var(--color-forecast)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Run Forecast</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <FileText size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Generate Report</span>
              </button>
            </div>
          </div>

          {/* Data Freshness */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-[var(--color-accent-blue)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Data Status</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Last Updated</span>
                <span className="text-[var(--color-text-primary)] font-mono">
                  {datasets.length > 0 ? formatDate(datasets[datasets.length - 1].info.importedAt.split('T')[0]) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Data Source</span>
                <span className="text-[var(--color-text-primary)]">
                  {datasets.length > 0 ? datasets[0].info.dataSource : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Total Records</span>
                <span className="text-[var(--color-text-primary)] font-mono">{totalRecords.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
