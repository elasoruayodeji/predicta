// ============================================================
// Market Movers Dashboard Component
// Shows top gainers, losers, most active, highest volatility
// ============================================================
import React, { useMemo } from 'react';
import { useAllDatasets } from '../../store/AppContext';
import { calculateReturns } from '../../engine/statistics';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MarketMoversProps {
  onSelectStock: (symbol: string) => void;
}

interface MoverData {
  symbol: string;
  name: string;
  exchange: string;
  lastPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  volume: number;
  volatility: number;
  maxDrawdown: number;
  sparklineData: { value: number }[];
  isSynthetic: boolean;
}

export function MarketMovers({ onSelectStock }: MarketMoversProps) {
  const datasets = useAllDatasets();

  const movers = useMemo(() => {
    if (datasets.length === 0) return [];

    return datasets.map(dataset => {
      const { info, prices } = dataset;
      
      if (prices.length < 2) return null;

      const lastPrice = prices[prices.length - 1].close;
      const prevPrice = prices[prices.length - 2].close;
      const dailyChange = lastPrice - prevPrice;
      const dailyChangePercent = prevPrice > 0 ? (dailyChange / prevPrice) * 100 : 0;
      const volume = prices[prices.length - 1].volume;

      // Calculate returns for volatility
      const returns = calculateReturns(prices);
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized %

      // Calculate max drawdown
      let peak = prices[0].close;
      let maxDrawdown = 0;
      for (const p of prices) {
        if (p.close > peak) peak = p.close;
        const drawdown = (peak - p.close) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      // Sparkline data (last 30 days)
      const sparklineData = prices.slice(-30).map(p => ({ value: p.close }));

      return {
        symbol: info.symbol,
        name: info.name,
        exchange: info.exchange,
        lastPrice,
        dailyChange,
        dailyChangePercent,
        volume,
        volatility,
        maxDrawdown: maxDrawdown * 100,
        sparklineData,
        isSynthetic: info.symbol.includes('SYNTHETIC'),
      };
    }).filter((m): m is MoverData => m !== null);
  }, [datasets]);

  if (movers.length === 0) {
    return null;
  }

  // Sort by different criteria
  const topGainers = [...movers].sort((a, b) => b.dailyChangePercent - a.dailyChangePercent).slice(0, 5);
  const topLosers = [...movers].sort((a, b) => a.dailyChangePercent - b.dailyChangePercent).slice(0, 5);
  const mostActive = [...movers].sort((a, b) => b.volume - a.volume).slice(0, 5);
  const highestVolatility = [...movers].sort((a, b) => b.volatility - a.volatility).slice(0, 5);
  const largestDrawdown = [...movers].sort((a, b) => b.maxDrawdown - a.maxDrawdown).slice(0, 5);

  const renderMoverCard = (mover: MoverData, metric: string, metricValue: string) => (
    <div
      key={mover.symbol}
      onClick={() => onSelectStock(mover.symbol)}
      className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3 hover:border-[var(--color-accent-blue)]/30 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">
              {mover.symbol}
            </span>
            {mover.isSynthetic && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-bold flex-shrink-0">
                SYNTH
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">{mover.name}</p>
        </div>
        <div className="text-right ml-2">
          <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
            {formatPrice(mover.lastPrice, 'USD')}
          </p>
          <p className={`text-[11px] font-mono ${getChangeColor(mover.dailyChangePercent)}`}>
            {formatPercent(mover.dailyChangePercent)}
          </p>
        </div>
      </div>
      
      {/* Sparkline */}
      <div className="h-8 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mover.sparklineData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={mover.dailyChangePercent >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--color-text-muted)]">{metric}</span>
        <span className="font-mono font-semibold text-[var(--color-text-primary)]">{metricValue}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Market Movers</h3>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          Based on imported data · {movers.length} stocks
        </span>
      </div>

      {/* Top Gainers */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-[var(--color-positive)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Top Gainers</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {topGainers.map(m => renderMoverCard(m, 'Daily Change', formatPercent(m.dailyChangePercent)))}
        </div>
      </div>

      {/* Top Losers */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown size={14} className="text-[var(--color-negative)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Top Losers</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {topLosers.map(m => renderMoverCard(m, 'Daily Change', formatPercent(m.dailyChangePercent)))}
        </div>
      </div>

      {/* Most Active */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-[var(--color-accent-blue)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Most Active</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {mostActive.map(m => renderMoverCard(m, 'Volume', formatVolume(m.volume)))}
        </div>
      </div>

      {/* Highest Volatility */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={14} className="text-[var(--color-warning)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Highest Volatility</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {highestVolatility.map(m => renderMoverCard(m, 'Volatility', `${m.volatility.toFixed(1)}%`))}
        </div>
      </div>

      {/* Largest Drawdown */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-[var(--color-negative)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Largest Drawdown</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {largestDrawdown.map(m => renderMoverCard(m, 'Max DD', `-${m.maxDrawdown.toFixed(1)}%`))}
        </div>
      </div>
    </div>
  );
}
