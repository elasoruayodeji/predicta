// ============================================================
// Investment Terminal - Main Workspace
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, formatPercent, formatVolume, getChangeColor, formatDate } from '../../utils/formatters';
import { MarketMovers } from '../dashboard/MarketMovers';
import { 
  Search, TrendingUp, TrendingDown, Activity, BarChart3, 
  ArrowUpRight, ArrowDownRight, Clock, Star, Zap, Target
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface InvestmentTerminalProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function InvestmentTerminal({ onNavigate, onSelectStock }: InvestmentTerminalProps) {
  const { state } = useAppState();
  const { user } = useAuth();
  const datasets = Array.from(state.datasets.values());
  const [searchQuery, setSearchQuery] = useState('');

  // Market indices (simulated - in production would come from API)
  const marketIndices = useMemo(() => {
    return [
      { name: 'NGX ASI', value: 68542.31, change: 1.24, changePercent: 0.018 },
      { name: 'NGX 30', value: 4218.76, change: -0.87, changePercent: -0.021 },
      { name: 'Premium Board', value: 12453.92, change: 0.56, changePercent: 0.0045 },
    ];
  }, []);

  // Market breadth
  const marketBreadth = useMemo(() => {
    let advancers = 0;
    let decliners = 0;
    let unchanged = 0;

    datasets.forEach(dataset => {
      if (dataset.prices.length >= 2) {
        const lastPrice = dataset.prices[dataset.prices.length - 1].close;
        const prevPrice = dataset.prices[dataset.prices.length - 2].close;
        const change = ((lastPrice - prevPrice) / prevPrice) * 100;
        
        if (change > 0.1) advancers++;
        else if (change < -0.1) decliners++;
        else unchanged++;
      }
    });

    return { advancers, decliners, unchanged };
  }, [datasets]);

  // Filter stocks by search
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return datasets.slice(0, 10);
    
    return datasets.filter(ds => 
      ds.info.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.info.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [datasets, searchQuery]);

  // Watchlist summary
  const watchlistSummary = useMemo(() => {
    return state.watchlist.slice(0, 5).map(item => {
      const dataset = datasets.find(d => d.info.symbol === item.symbol);
      if (!dataset || dataset.prices.length < 2) return null;

      const lastPrice = dataset.prices[dataset.prices.length - 1].close;
      const prevPrice = dataset.prices[dataset.prices.length - 2].close;
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

  // Portfolio summary
  const portfolioSummary = useMemo(() => {
    const transactions = JSON.parse(localStorage.getItem(`predicta_portfolio_transactions_${user?.id}`) || '[]');
    if (transactions.length === 0) return null;

    let totalValue = 0;
    let totalCost = 0;

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
        totalValue += quantity * currentPrice;
        totalCost += cost;
      }
    });

    const dailyChange = totalValue - totalCost;
    const dailyChangePercent = totalCost > 0 ? (dailyChange / totalCost) * 100 : 0;

    return { totalValue, totalCost, dailyChange, dailyChangePercent };
  }, [datasets, user]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Investment Terminal</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Your professional workspace for Nigerian market intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Clock size={14} />
          <span>Market data as of {new Date().toLocaleDateString('en-NG', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {marketIndices.map((index, idx) => (
          <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{index.name}</p>
                <p className="text-xl font-bold text-[var(--color-text-primary)] font-mono mt-1">
                  {index.value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 size={20} className="text-[var(--color-accent-blue)]" />
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
        ))}
      </div>

      {/* Market Breadth */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Market Breadth</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ArrowUpRight size={16} className="text-[var(--color-positive)]" />
              <span className="text-2xl font-bold text-[var(--color-positive)]">{marketBreadth.advancers}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Advancers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Activity size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-2xl font-bold text-[var(--color-text-muted)]">{marketBreadth.unchanged}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Unchanged</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ArrowDownRight size={16} className="text-[var(--color-negative)]" />
              <span className="text-2xl font-bold text-[var(--color-negative)]">{marketBreadth.decliners}</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">Decliners</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search & Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Global Search */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search size={16} className="text-[var(--color-text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Quick Search</h3>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks by symbol or name..."
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            />
            {filteredStocks.length > 0 && (
              <div className="mt-3 space-y-1">
                {filteredStocks.map(ds => {
                  const lastPrice = ds.prices[ds.prices.length - 1]?.close || 0;
                  const prevPrice = ds.prices[ds.prices.length - 2]?.close || lastPrice;
                  const change = lastPrice - prevPrice;
                  const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

                  return (
                    <div
                      key={ds.info.symbol}
                      onClick={() => onSelectStock(ds.info.symbol)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{ds.info.symbol}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{ds.info.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                          {formatPrice(lastPrice, 'NGN')}
                        </p>
                        <p className={`text-xs font-mono ${getChangeColor(changePercent)}`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Watchlist Summary */}
          {watchlistSummary.length > 0 && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
              <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[var(--color-warning)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Watchlist</h3>
                </div>
                <button
                  onClick={() => onNavigate('watchlist')}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="divide-y divide-[var(--color-border-primary)]">
                {watchlistSummary.map((stock, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="p-3 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
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
                            {formatPrice(stock.price, 'NGN')}
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
          <MarketMovers onSelectStock={onSelectStock} />
        </div>

        {/* Right Column - Portfolio & Quick Actions */}
        <div className="space-y-6">
          {/* Portfolio Summary */}
          {portfolioSummary && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[var(--color-accent-blue)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Portfolio</h3>
                </div>
                <button
                  onClick={() => onNavigate('portfolio')}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline"
                >
                  Details →
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Total Value</span>
                  <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                    {formatPrice(portfolioSummary.totalValue, 'NGN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Daily P&L</span>
                  <span className={`text-sm font-mono font-bold ${getChangeColor(portfolioSummary.dailyChange)}`}>
                    {formatPrice(portfolioSummary.dailyChange, 'NGN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Return</span>
                  <span className={`text-sm font-mono font-bold ${getChangeColor(portfolioSummary.dailyChangePercent / 100)}`}>
                    {portfolioSummary.dailyChangePercent >= 0 ? '+' : ''}{portfolioSummary.dailyChangePercent.toFixed(2)}%
                  </span>
                </div>
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
                onClick={() => onNavigate('screener')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <BarChart3 size={14} className="text-[var(--color-accent-blue)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Stock Screener</span>
              </button>
              <button
                onClick={() => onNavigate('valuation')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Target size={14} className="text-[var(--color-positive)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Valuation Workbench</span>
              </button>
              <button
                onClick={() => onNavigate('signals')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Activity size={14} className="text-[var(--color-warning)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Market Signals</span>
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-left"
              >
                <Search size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-primary)]">Explore Stocks</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent Activity</h3>
            <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <p>No recent activity</p>
              <p className="text-[10px]">Your market activity will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
