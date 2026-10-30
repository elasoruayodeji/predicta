// ============================================================
// Market Signals Page
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../../store/AppContext';
import { fetchInvestoSignals, type InvestoSignal } from '../../services/investoClient';
import { Button, EmptyState, MetricCard } from '../common';
import { formatDate, formatPercent } from '../../utils/formatters';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Activity, Volume2, 
  Zap, Filter, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight,
  Info, CheckCircle, Clock
} from 'lucide-react';

interface MarketSignalsProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function MarketSignals({ onNavigate, onSelectStock }: MarketSignalsProps) {
  const { state } = useAppState();
  const [signals, setSignals] = useState<InvestoSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterMateriality, setFilterMateriality] = useState<string>('all');

  // Load signals from Investo API
  useEffect(() => {
    loadSignals();
  }, []);

  const loadSignals = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchInvestoSignals();
      
      if (result.ok) {
        setSignals(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to load market signals');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter signals
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      if (filterType !== 'all' && signal.type !== filterType) return false;
      if (filterDirection !== 'all' && signal.direction !== filterDirection) return false;
      
      if (filterMateriality !== 'all') {
        const materiality = signal.materiality;
        if (filterMateriality === 'high' && materiality < 0.7) return false;
        if (filterMateriality === 'medium' && (materiality < 0.4 || materiality >= 0.7)) return false;
        if (filterMateriality === 'low' && materiality >= 0.4) return false;
      }
      
      return true;
    });
  }, [signals, filterType, filterDirection, filterMateriality]);

  // Group signals by type
  const signalsByType = useMemo(() => {
    const grouped: Record<string, InvestoSignal[]> = {};
    filteredSignals.forEach(signal => {
      if (!grouped[signal.type]) {
        grouped[signal.type] = [];
      }
      grouped[signal.type].push(signal);
    });
    return grouped;
  }, [filteredSignals]);

  // Summary stats
  const stats = useMemo(() => {
    const bullish = signals.filter(s => s.direction === 'up').length;
    const bearish = signals.filter(s => s.direction === 'down').length;
    const highMateriality = signals.filter(s => s.materiality >= 0.7).length;
    
    return {
      total: signals.length,
      bullish,
      bearish,
      highMateriality,
    };
  }, [signals]);

  // Signal type labels
  const signalTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    'volume_spike': { 
      label: 'Volume Spike', 
      icon: <Volume2 size={16} />, 
      color: 'text-[var(--color-accent-blue)]' 
    },
    'price_breakout': { 
      label: 'Price Breakout', 
      icon: <TrendingUp size={16} />, 
      color: 'text-[var(--color-positive)]' 
    },
    'price_breakdown': { 
      label: 'Price Breakdown', 
      icon: <TrendingDown size={16} />, 
      color: 'text-[var(--color-negative)]' 
    },
    'momentum': { 
      label: 'Momentum Shift', 
      icon: <Zap size={16} />, 
      color: 'text-[var(--color-warning)]' 
    },
    'volatility': { 
      label: 'Volatility Alert', 
      icon: <Activity size={16} />, 
      color: 'text-[var(--color-forecast)]' 
    },
    'dividend': { 
      label: 'Dividend Event', 
      icon: <CheckCircle size={16} />, 
      color: 'text-[var(--color-positive)]' 
    },
    'earnings': { 
      label: 'Earnings Event', 
      icon: <Clock size={16} />, 
      color: 'text-[var(--color-accent-blue)]' 
    },
  };

  const getSignalTypeInfo = (type: string) => {
    return signalTypeLabels[type] || { 
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      icon: <AlertTriangle size={16} />, 
      color: 'text-[var(--color-text-muted)]' 
    };
  };

  if (error && signals.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <EmptyState
          icon={<AlertTriangle size={32} />}
          title="Market Signals Unavailable"
          description={
            <div className="space-y-2">
              <p>{error}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Market signals require the Investo API to be configured. 
                Check your server configuration and API key.
              </p>
            </div>
          }
          action={
            <div className="flex gap-3">
              <Button variant="primary" onClick={loadSignals}>
                <RefreshCw size={16} />
                Retry
              </Button>
              <Button variant="secondary" onClick={() => onNavigate('settings')}>
                Check Settings
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Market Signals</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Real-time market events and unusual activity across the Nigerian Exchange
          </p>
        </div>
        <Button variant="secondary" onClick={loadSignals} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Signals"
          value={stats.total.toString()}
          icon={<Activity size={18} className="text-[var(--color-accent-blue)]" />}
          subtitle="Active market events"
        />
        <MetricCard
          label="Bullish Signals"
          value={stats.bullish.toString()}
          icon={<ArrowUpRight size={18} className="text-[var(--color-positive)]" />}
          variant="positive"
          subtitle="Upward momentum"
        />
        <MetricCard
          label="Bearish Signals"
          value={stats.bearish.toString()}
          icon={<ArrowDownRight size={18} className="text-[var(--color-negative)]" />}
          variant="negative"
          subtitle="Downward pressure"
        />
        <MetricCard
          label="High Impact"
          value={stats.highMateriality.toString()}
          icon={<Zap size={18} className="text-[var(--color-warning)]" />}
          variant="warning"
          subtitle="Materiality ≥ 70%"
        />
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Signal Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Types</option>
              {Object.keys(signalTypeLabels).map(type => (
                <option key={type} value={type}>
                  {signalTypeLabels[type].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Direction</label>
            <select
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Directions</option>
              <option value="up">Bullish (Up)</option>
              <option value="down">Bearish (Down)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Materiality</label>
            <select
              value={filterMateriality}
              onChange={(e) => setFilterMateriality(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Levels</option>
              <option value="high">High (≥70%)</option>
              <option value="medium">Medium (40-70%)</option>
              <option value="low">Low (&lt;40%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && signals.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent-blue)]" />
          <span className="ml-3 text-sm text-[var(--color-text-secondary)]">Loading market signals...</span>
        </div>
      )}

      {/* Signals by Type */}
      {!isLoading && filteredSignals.length > 0 && (
        <div className="space-y-6">
          {Object.entries(signalsByType).map(([type, typeSignals]) => {
            const typeInfo = getSignalTypeInfo(type);
            
            return (
              <div key={type} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
                <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={typeInfo.color}>{typeInfo.icon}</span>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {typeInfo.label}
                    </h3>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ({typeSignals.length})
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-[var(--color-border-primary)]">
                  {typeSignals.map(signal => (
                    <div
                      key={signal.id}
                      className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                      onClick={() => onSelectStock(signal.symbol)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-[var(--color-text-primary)]">
                              {signal.symbol}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              signal.direction === 'up' 
                                ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]'
                                : 'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
                            }`}>
                              {signal.direction === 'up' ? '↑ BULLISH' : '↓ BEARISH'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              signal.materiality >= 0.7
                                ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]'
                                : signal.materiality >= 0.4
                                ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]'
                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                            }`}>
                              {(signal.materiality * 100).toFixed(0)}% IMPACT
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                            {signal.headline}
                          </h4>
                          
                          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                            {signal.detail}
                          </p>
                          
                          <div className="flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatDate(signal.detected_at.split('T')[0])}
                            </span>
                            <span className="flex items-center gap-1">
                              <Info size={10} />
                              Magnitude: {signal.magnitude.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {signal.direction === 'up' ? (
                            <ArrowUpRight size={24} className="text-[var(--color-positive)]" />
                          ) : (
                            <ArrowDownRight size={24} className="text-[var(--color-negative)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSignals.length === 0 && signals.length > 0 && (
        <EmptyState
          icon={<Filter size={32} />}
          title="No Signals Match Filters"
          description="Try adjusting your filters to see more market signals."
          action={
            <Button variant="secondary" onClick={() => {
              setFilterType('all');
              setFilterDirection('all');
              setFilterMateriality('all');
            }}>
              Clear Filters
            </Button>
          }
        />
      )}

      {/* No Signals at All */}
      {!isLoading && signals.length === 0 && !error && (
        <EmptyState
          icon={<Activity size={32} />}
          title="No Market Signals"
          description="No market signals are currently available. This could mean:"
          action={
            <div className="text-left text-xs text-[var(--color-text-muted)] space-y-2 mt-4">
              <p>• The market is currently closed</p>
              <p>• No unusual activity has been detected</p>
              <p>• Signal detection is still processing</p>
              <p className="mt-4">
                <Button variant="secondary" onClick={loadSignals}>
                  <RefreshCw size={16} />
                  Check Again
                </Button>
              </p>
            </div>
          }
        />
      )}

      {/* Disclaimer */}
      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">Disclaimer:</strong> Market signals are statistical detections of unusual activity, 
          not investment recommendations. Signals may be false positives or require further investigation. 
          Always conduct your own research before making investment decisions. 
          Signal materiality indicates statistical significance, not guaranteed price movement.
        </p>
      </div>
    </div>
  );
}
