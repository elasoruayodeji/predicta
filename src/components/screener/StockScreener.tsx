// ============================================================
// Stock Screener — TradingView-Inspired
// Sortable table with filters, sparklines, and saved presets
// ============================================================
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAllDatasets, useAppState } from '../../store/AppContext';
import { calculateReturns, calculateHistoricalStatistics } from '../../engine/statistics';
import { formatPrice, formatPercent, formatVolume, getChangeColor, formatDate } from '../../utils/formatters';
import { Button, EmptyState } from '../common';
import { 
  Filter, Download, Save, FolderOpen, Trash2, 
  ChevronUp, ChevronDown, Search, X, ArrowUpDown
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ScreenerProps {
  onSelectStock: (symbol: string) => void;
  onNavigate: (page: string) => void;
}

interface ScreenerRow {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  lastPrice: number;
  lastDate: string;
  dailyChange: number;
  dailyChangePercent: number;
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number | null;
  avgVolume: number;
  lastVolume: number;
  recordCount: number;
  dataQuality: string;
  anomalyCount: number;
  isSynthetic: boolean;
  sparklineData: { value: number }[];
  dataSource: string;
  importedAt: string;
}

type SortKey = keyof ScreenerRow;
type SortDirection = 'asc' | 'desc';

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  sortKey: SortKey;
  sortDirection: SortDirection;
  createdAt: string;
}

interface FilterState {
  search: string;
  exchange: string;
  minVolatility: number | '';
  maxVolatility: number | '';
  minReturn: number | '';
  maxReturn: number | '';
  minDataQuality: string;
  hasAnomalies: 'all' | 'yes' | 'no';
  isSynthetic: 'all' | 'yes' | 'no';
}

const STORAGE_KEY = 'predicta_screener_presets';

const defaultFilters: FilterState = {
  search: '',
  exchange: '',
  minVolatility: '',
  maxVolatility: '',
  minReturn: '',
  maxReturn: '',
  minDataQuality: '',
  hasAnomalies: 'all',
  isSynthetic: 'all',
};

export function StockScreener({ onSelectStock, onNavigate }: ScreenerProps) {
  const datasets = useAllDatasets();
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Load presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load presets', e);
    }
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback((newPresets: FilterPreset[]) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (e) {
      console.error('Failed to save presets', e);
    }
  }, []);

  // Get anomaly counts from state
  const { state } = useAppState();

  // Compute screener rows from datasets
  const rows = useMemo(() => {
    if (datasets.length === 0) return [];

    const result: ScreenerRow[] = [];
    
    for (const dataset of datasets) {
      const { info, prices, quality } = dataset;

      if (prices.length < 2) continue;

      const lastPrice = prices[prices.length - 1].close;
      const prevPrice = prices[prices.length - 2].close;
      const firstPrice = prices[0].close;
      const dailyChange = lastPrice - prevPrice;
      const dailyChangePercent = prevPrice > 0 ? (dailyChange / prevPrice) * 100 : 0;
      const totalReturn = firstPrice > 0 ? ((lastPrice / firstPrice) - 1) * 100 : 0;

      let stats;
      try {
        stats = calculateHistoricalStatistics(prices);
      } catch {
        continue;
      }

      const lastVolume = prices[prices.length - 1].volume;
      const sparklineData = prices.slice(-30).map(p => ({ value: p.close }));
      const anomalyCount = state.anomalies.get(info.symbol)?.length ?? 0;

      result.push({
        symbol: info.symbol,
        name: info.name,
        exchange: info.exchange,
        currency: info.currency,
        lastPrice,
        lastDate: prices[prices.length - 1].date,
        dailyChange,
        dailyChangePercent,
        totalReturn,
        annualizedReturn: stats.annualizedReturn * 100,
        annualizedVolatility: stats.annualizedVolatility * 100,
        maxDrawdown: stats.maxDrawdown * 100,
        sharpeRatio: stats.sharpeRatio,
        avgVolume: stats.avgVolume,
        lastVolume,
        recordCount: info.recordCount,
        dataQuality: quality.overallScore,
        anomalyCount,
        isSynthetic: info.symbol.includes('SYNTHETIC'),
        sparklineData,
        dataSource: info.dataSource,
        importedAt: info.importedAt,
      });
    }
    
    return result;
  }, [datasets, state.anomalies]);

  // Get unique exchanges for filter
  const exchanges = useMemo(() => {
    const set = new Set(rows.map(r => r.exchange));
    return Array.from(set).sort();
  }, [rows]);

  // Apply filters
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!row.symbol.toLowerCase().includes(search) && 
            !row.name.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filters.exchange && row.exchange !== filters.exchange) return false;
      if (filters.minVolatility !== '' && row.annualizedVolatility < Number(filters.minVolatility)) return false;
      if (filters.maxVolatility !== '' && row.annualizedVolatility > Number(filters.maxVolatility)) return false;
      if (filters.minReturn !== '' && row.totalReturn < Number(filters.minReturn)) return false;
      if (filters.maxReturn !== '' && row.totalReturn > Number(filters.maxReturn)) return false;
      if (filters.minDataQuality) {
        const qualityOrder = ['excellent', 'good', 'fair', 'poor'];
        const minIdx = qualityOrder.indexOf(filters.minDataQuality);
        const rowIdx = qualityOrder.indexOf(row.dataQuality);
        if (rowIdx > minIdx) return false;
      }
      if (filters.hasAnomalies === 'yes' && row.anomalyCount === 0) return false;
      if (filters.hasAnomalies === 'no' && row.anomalyCount > 0) return false;
      if (filters.isSynthetic === 'yes' && !row.isSynthetic) return false;
      if (filters.isSynthetic === 'no' && row.isSynthetic) return false;
      return true;
    });
  }, [rows, filters]);

  // Sort
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      filters: { ...filters },
      sortKey,
      sortDirection,
      createdAt: new Date().toISOString(),
    };
    savePresets([...presets, preset]);
    setNewPresetName('');
    setShowPresetModal(false);
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setSortKey(preset.sortKey);
    setSortDirection(preset.sortDirection);
  };

  const handleDeletePreset = (id: string) => {
    savePresets(presets.filter(p => p.id !== id));
  };

  const handleExportCSV = () => {
    const headers = [
      'Symbol', 'Name', 'Exchange', 'Last Price', 'Daily Change %',
      'Total Return %', 'Annualized Return %', 'Annualized Volatility %',
      'Max Drawdown %', 'Sharpe Ratio', 'Avg Volume', 'Last Volume',
      'Records', 'Data Quality', 'Anomalies', 'Data Source',
    ];
    const csvRows = sortedRows.map(r => [
      r.symbol, r.name, r.exchange, r.lastPrice.toFixed(2),
      r.dailyChangePercent.toFixed(2), r.totalReturn.toFixed(2),
      r.annualizedReturn.toFixed(2), r.annualizedVolatility.toFixed(2),
      r.maxDrawdown.toFixed(2), r.sharpeRatio?.toFixed(2) ?? '',
      r.avgVolume.toFixed(0), r.lastVolume.toFixed(0),
      r.recordCount, r.dataQuality, r.anomalyCount, r.dataSource,
    ].join(','));

    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicta_screener_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ label, field, className = '' }: { label: string; field: SortKey; className?: string }) => (
    <th
      className={`p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--color-text-primary)] select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortKey === field ? (
          sortDirection === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
        ) : (
          <ArrowUpDown size={10} className="opacity-30" />
        )}
      </div>
    </th>
  );

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={<Filter size={32} />}
        title="No Data to Screen"
        description="Import stock data first to use the screener."
        action={<Button onClick={() => onNavigate('data')}>Import Data</Button>}
      />
    );
  }

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'search' || key === 'exchange' || key === 'minDataQuality') return val !== '' && val !== 'all';
    if (key === 'hasAnomalies' || key === 'isSynthetic') return val !== 'all';
    return val !== '';
  }).length;

  return (
    <div className="space-y-4 max-w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Stock Screener</h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {sortedRows.length} of {rows.length} stocks
        </span>
        <div className="flex-1" />
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-8 pr-3 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50 w-48"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant={showFilters || activeFilterCount > 0 ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Presets */}
        <div className="relative group">
          <Button variant="secondary" size="sm">
            <FolderOpen size={14} />
            Presets
          </Button>
          <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] rounded-lg shadow-xl z-50 hidden group-hover:block">
            <div className="p-2 border-b border-[var(--color-border-primary)]">
              <button
                onClick={() => setShowPresetModal(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--color-accent-blue)] hover:bg-[var(--color-bg-hover)] rounded"
              >
                <Save size={12} />
                Save Current Filters
              </button>
            </div>
            {presets.length === 0 ? (
              <div className="p-3 text-xs text-[var(--color-text-muted)] text-center">
                No saved presets
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {presets.map(preset => (
                  <div key={preset.id} className="flex items-center gap-1 p-1 hover:bg-[var(--color-bg-hover)]">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-negative)]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Export */}
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Filters</h4>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-[10px] text-[var(--color-accent-blue)] hover:underline"
            >
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Exchange</label>
              <select
                value={filters.exchange}
                onChange={e => setFilters(f => ({ ...f, exchange: e.target.value }))}
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              >
                <option value="">All</option>
                {exchanges.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Min Volatility %</label>
              <input
                type="number"
                value={filters.minVolatility}
                onChange={e => setFilters(f => ({ ...f, minVolatility: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder="0"
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Max Volatility %</label>
              <input
                type="number"
                value={filters.maxVolatility}
                onChange={e => setFilters(f => ({ ...f, maxVolatility: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder="100"
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Min Return %</label>
              <input
                type="number"
                value={filters.minReturn}
                onChange={e => setFilters(f => ({ ...f, minReturn: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder="-100"
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Max Return %</label>
              <input
                type="number"
                value={filters.maxReturn}
                onChange={e => setFilters(f => ({ ...f, maxReturn: e.target.value === '' ? '' : Number(e.target.value) }))}
                placeholder="1000"
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Data Quality</label>
              <select
                value={filters.minDataQuality}
                onChange={e => setFilters(f => ({ ...f, minDataQuality: e.target.value }))}
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              >
                <option value="">Any</option>
                <option value="excellent">Excellent or better</option>
                <option value="good">Good or better</option>
                <option value="fair">Fair or better</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Has Anomalies</label>
              <select
                value={filters.hasAnomalies}
                onChange={e => setFilters(f => ({ ...f, hasAnomalies: e.target.value as 'all' | 'yes' | 'no' }))}
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              >
                <option value="all">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-muted)] block mb-1">Data Type</label>
              <select
                value={filters.isSynthetic}
                onChange={e => setFilters(f => ({ ...f, isSynthetic: e.target.value as 'all' | 'yes' | 'no' }))}
                className="w-full px-2 py-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded text-xs text-[var(--color-text-primary)]"
              >
                <option value="all">All Data</option>
                <option value="no">Real Data Only</option>
                <option value="yes">Synthetic Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-sm">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Save Filter Preset</h4>
            <input
              type="text"
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              placeholder="Preset name..."
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] mb-3"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowPresetModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSavePreset} disabled={!newPresetName.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
              <tr>
                <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase w-8">#</th>
                <SortHeader label="Symbol" field="symbol" />
                <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Trend</th>
                <SortHeader label="Last Price" field="lastPrice" className="text-right" />
                <SortHeader label="Daily %" field="dailyChangePercent" className="text-right" />
                <SortHeader label="Total %" field="totalReturn" className="text-right" />
                <SortHeader label="Ann. Return %" field="annualizedReturn" className="text-right" />
                <SortHeader label="Volatility %" field="annualizedVolatility" className="text-right" />
                <SortHeader label="Max DD %" field="maxDrawdown" className="text-right" />
                <SortHeader label="Sharpe" field="sharpeRatio" className="text-right" />
                <SortHeader label="Volume" field="lastVolume" className="text-right" />
                <SortHeader label="Quality" field="dataQuality" />
                <SortHeader label="Anomalies" field="anomalyCount" className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-primary)]">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-[var(--color-text-muted)]">
                    No stocks match the current filters.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, idx) => (
                  <tr
                    key={row.symbol}
                    className="hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                    onClick={() => onSelectStock(row.symbol)}
                  >
                    <td className="p-2 text-[var(--color-text-muted)] font-mono">{idx + 1}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--color-text-primary)]">{row.symbol}</span>
                        {row.isSynthetic && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-bold">
                            SYNTH
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">{row.name}</p>
                    </td>
                    <td className="p-2 w-20">
                      <div className="h-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={row.sparklineData}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={row.dailyChangePercent >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}
                              strokeWidth={1}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono text-[var(--color-text-primary)]">
                      {formatPrice(row.lastPrice, 'USD')}
                    </td>
                    <td className={`p-2 text-right font-mono ${getChangeColor(row.dailyChangePercent)}`}>
                      {row.dailyChangePercent >= 0 ? '+' : ''}{row.dailyChangePercent.toFixed(2)}%
                    </td>
                    <td className={`p-2 text-right font-mono ${getChangeColor(row.totalReturn)}`}>
                      {row.totalReturn >= 0 ? '+' : ''}{row.totalReturn.toFixed(1)}%
                    </td>
                    <td className={`p-2 text-right font-mono ${getChangeColor(row.annualizedReturn)}`}>
                      {row.annualizedReturn >= 0 ? '+' : ''}{row.annualizedReturn.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right font-mono text-[var(--color-text-primary)]">
                      {row.annualizedVolatility.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right font-mono text-[var(--color-negative)]">
                      -{row.maxDrawdown.toFixed(1)}%
                    </td>
                    <td className="p-2 text-right font-mono text-[var(--color-text-primary)]">
                      {row.sharpeRatio !== null ? row.sharpeRatio.toFixed(2) : '—'}
                    </td>
                    <td className="p-2 text-right font-mono text-[var(--color-text-secondary)]">
                      {formatVolume(row.lastVolume)}
                    </td>
                    <td className="p-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        row.dataQuality === 'excellent' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                        row.dataQuality === 'good' ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]' :
                        row.dataQuality === 'fair' ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]' :
                        'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
                      }`}>
                        {row.dataQuality}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {row.anomalyCount > 0 ? (
                        <span className="text-[var(--color-warning)] font-mono">{row.anomalyCount}</span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>
          Showing {sortedRows.length} of {rows.length} imported stocks
          {activeFilterCount > 0 && ` · ${activeFilterCount} filter(s) active`}
        </span>
        <span>Data from CSV imports · Not live market data</span>
      </div>
    </div>
  );
}
