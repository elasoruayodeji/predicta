// ============================================================
// Watchlist Page
// ============================================================
import React from 'react';
import { useAppState } from '../../store/AppContext';
import { EmptyState, Button } from '../common';
import { formatPrice, formatPercent, formatDate, getChangeColor } from '../../utils/formatters';
import { Star, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

interface WatchlistPageProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function WatchlistPage({ onNavigate, onSelectStock }: WatchlistPageProps) {
  const { state, dispatch } = useAppState();

  if (state.watchlist.length === 0) {
    return (
      <EmptyState
        icon={<Star size={32} />}
        title="Watchlist is Empty"
        description="Add stocks to your watchlist from the Stock Explorer or Analysis page to track them here."
        action={<Button onClick={() => onNavigate('explore')}>Browse Stocks</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
        <div className="p-4 border-b border-[var(--color-border-primary)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Your Watchlist ({state.watchlist.length})
          </h3>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)]">
          {state.watchlist.map(item => (
            <div 
              key={item.symbol} 
              className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              onClick={() => onSelectStock(item.symbol)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                    <Star size={16} className="text-[var(--color-warning)] fill-[var(--color-warning)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.symbol}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{item.name} · {item.exchange}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {item.lastPrice && (
                      <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                        {formatPrice(item.lastPrice)}
                      </p>
                    )}
                    {item.lastPriceDate && (
                      <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(item.lastPriceDate)}</p>
                    )}
                  </div>
                  {item.anomalyCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-warning-dim)]">
                      <AlertTriangle size={12} className="text-[var(--color-warning)]" />
                      <span className="text-[10px] font-bold text-[var(--color-warning)]">{item.anomalyCount}</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: item.symbol }); }}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-negative-dim)] text-[var(--color-text-muted)] hover:text-[var(--color-negative)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
