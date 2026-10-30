// ============================================================
// Investment Journal Component
// ============================================================
import React, { useState, useMemo } from 'react';
import { useAppState } from '../../store/AppContext';
import { 
  JournalEntry, 
  createJournalEntry, 
  calculateJournalStats,
  filterJournalEntries,
  sortJournalEntries,
  exportJournalToCSV
} from '../../engine/journal';
import { Button, EmptyState, MetricCard } from '../common';
import { formatPercent, formatDate } from '../../utils/formatters';
import { 
  BookOpen, Plus, Download, Filter, TrendingUp, TrendingDown, 
  Target, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';

interface InvestmentJournalProps {
  onNavigate: (page: string) => void;
}

export function InvestmentJournal({ onNavigate }: InvestmentJournalProps) {
  const { state } = useAppState();
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('predicta_investment_journal');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSymbol, setFilterSymbol] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'symbol' | 'type' | 'return'>('date');

  // Save entries to localStorage
  const saveEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('predicta_investment_journal', JSON.stringify(newEntries));
  };

  // Calculate stats
  const stats = useMemo(() => {
    return calculateJournalStats(entries);
  }, [entries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }
    
    if (filterSymbol) {
      filtered = filtered.filter(e => e.symbol === filterSymbol);
    }
    
    return sortJournalEntries(filtered, sortBy, 'desc');
  }, [entries, filterType, filterSymbol, sortBy]);

  // Get unique symbols for filter
  const symbols = useMemo(() => {
    const set = new Set(entries.map(e => e.symbol));
    return Array.from(set).sort();
  }, [entries]);

  // Handle export
  const handleExport = () => {
    const csv = exportJournalToCSV(entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment_journal_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle add entry
  const handleAddEntry = (entry: JournalEntry) => {
    saveEntries([entry, ...entries]);
    setShowAddModal(false);
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen size={32} />}
        title="No Journal Entries"
        description="Start documenting your investment decisions, theses, and lessons learned."
        action={
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add First Entry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Entries"
          value={stats.totalEntries.toString()}
          icon={<BookOpen size={18} className="text-[var(--color-accent-blue)]" />}
        />
        <MetricCard
          label="Accuracy Rate"
          value={`${stats.accuracyRate.toFixed(1)}%`}
          icon={<Target size={18} className="text-[var(--color-positive)]" />}
        />
        <MetricCard
          label="Avg Return"
          value={formatPercent(stats.averageReturn / 100)}
          variant={stats.averageReturn >= 0 ? 'positive' : 'negative'}
          icon={stats.averageReturn >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        />
        <MetricCard
          label="Reviewed"
          value={`${stats.reviewedDecisions} / ${stats.buyDecisions + stats.sellDecisions}`}
          subtitle="Decisions reviewed"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Entry
        </Button>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy Decisions</option>
              <option value="sell">Sell Decisions</option>
              <option value="thesis">Theses</option>
              <option value="review">Reviews</option>
              <option value="lesson">Lessons</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Symbol</label>
            <select
              value={filterSymbol}
              onChange={e => setFilterSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
            >
              <option value="">All Symbols</option>
              {symbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
            >
              <option value="date">Date</option>
              <option value="symbol">Symbol</option>
              <option value="type">Type</option>
              <option value="return">Return</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-primary)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Journal Entries ({filteredEntries.length})
          </h3>
        </div>
        <div className="divide-y divide-[var(--color-border-primary)] max-h-[600px] overflow-y-auto">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      entry.type === 'buy' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                      entry.type === 'sell' ? 'bg-[var(--color-negative-dim)] text-[var(--color-negative)]' :
                      entry.type === 'thesis' ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]' :
                      entry.type === 'review' ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]' :
                      'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                    }`}>
                      {entry.type}
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{entry.symbol}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{formatDate(entry.date)}</span>
                    {entry.outcome?.accuracy && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        entry.outcome.accuracy === 'accurate' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                        entry.outcome.accuracy === 'partially_accurate' ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]' :
                        'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
                      }`}>
                        {entry.outcome.accuracy === 'accurate' && <CheckCircle size={10} className="inline mr-1" />}
                        {entry.outcome.accuracy === 'partially_accurate' && <AlertCircle size={10} className="inline mr-1" />}
                        {entry.outcome.accuracy === 'inaccurate' && <XCircle size={10} className="inline mr-1" />}
                        {entry.outcome.accuracy.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  
                  {entry.action && (
                    <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                      <span className="font-mono">{entry.action.quantity} shares @ ₦{entry.action.price.toFixed(2)}</span>
                      {entry.action.targetPrice && (
                        <span className="ml-2">Target: ₦{entry.action.targetPrice.toFixed(2)}</span>
                      )}
                      {entry.action.stopLoss && (
                        <span className="ml-2">Stop: ₦{entry.action.stopLoss.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  
                  {(entry.action?.thesis || entry.content) && (
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      {entry.action?.thesis || entry.content}
                    </p>
                  )}
                  
                  {entry.outcome && (
                    <div className="text-xs space-y-1">
                      {entry.outcome.actualReturn !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-text-muted)]">Actual Return:</span>
                          <span className={`font-mono font-semibold ${getChangeColor(entry.outcome.actualReturn / 100)}`}>
                            {formatPercent(entry.outcome.actualReturn / 100)}
                          </span>
                        </div>
                      )}
                      {entry.outcome.lessons && (
                        <p className="text-[var(--color-text-muted)] italic">
                          Lesson: {entry.outcome.lessons}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEntry}
          symbols={symbols}
        />
      )}
    </div>
  );
}

// Add Entry Modal Component
function AddEntryModal({ 
  onClose, 
  onAdd,
  symbols 
}: { 
  onClose: () => void; 
  onAdd: (entry: JournalEntry) => void;
  symbols: string[];
}) {
  const [type, setType] = useState<JournalEntry['type']>('buy');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [thesis, setThesis] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    const entry = createJournalEntry(
      symbol,
      type,
      content,
      type === 'buy' || type === 'sell' ? {
        quantity: Number(quantity),
        price: Number(price),
        thesis,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
      } : undefined
    );
    
    entry.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    
    onAdd(entry);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Add Journal Entry</h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
              >
                <option value="buy">Buy Decision</option>
                <option value="sell">Sell Decision</option>
                <option value="thesis">Thesis</option>
                <option value="review">Review</option>
                <option value="lesson">Lesson</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., DANGCEM"
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
              />
            </div>
          </div>

          {(type === 'buy' || type === 'sell') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Investment Thesis</label>
                <textarea
                  value={thesis}
                  onChange={e => setThesis(e.target.value)}
                  rows={3}
                  placeholder="Why are you making this investment?"
                  className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Target Price (₦)</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Stop Loss (₦)</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {(type === 'thesis' || type === 'review' || type === 'lesson') && (
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={5}
                placeholder="Your thoughts, analysis, or lessons learned..."
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g., banking, dividend, long-term"
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!symbol}>
            Add Entry
          </Button>
        </div>
      </div>
    </div>
  );
}

function getChangeColor(value: number): string {
  if (value > 0) return 'text-[var(--color-positive)]';
  if (value < 0) return 'text-[var(--color-negative)]';
  return 'text-[var(--color-text-secondary)]';
}
