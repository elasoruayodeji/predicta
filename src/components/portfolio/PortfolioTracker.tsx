// ============================================================
// Portfolio Tracker Component
// ============================================================
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppState } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPortfolioAccounts, addTransaction, deleteTransaction, createPortfolioAccount } from '../../services/dataService';
import { 
  Transaction, 
  calculateHoldings, 
  calculatePortfolioSummary, 
  parseTransactionCSV,
  generateSampleTransactionCSV 
} from '../../engine/portfolio';
import { formatPrice, formatPercent, getChangeColor } from '../../utils/formatters';
import { Button, EmptyState, MetricCard } from '../common';
import { 
  Upload, Download, Plus, Trash2, TrendingUp, TrendingDown, 
  DollarSign, PieChart, AlertCircle 
} from 'lucide-react';

interface PortfolioProps {
  onNavigate: (page: string) => void;
}

export function PortfolioTracker({ onNavigate }: PortfolioProps) {
  const { state, dispatch } = useAppState();
  const { user, isConfigured } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cloudAccountId, setCloudAccountId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load transactions from cloud or localStorage
  useEffect(() => {
    const loadTransactions = async () => {
      if (user && isConfigured) {
        // Load from cloud
        try {
          const accounts = await getPortfolioAccounts(user.id);
          if (accounts.length > 0) {
            setCloudAccountId(accounts[0].id);
            const cloudTransactions = accounts[0].portfolio_transactions || [];
            // Map cloud transactions to local format
            const mappedTransactions: Transaction[] = cloudTransactions.map((t: any) => ({
              id: t.id,
              symbol: t.symbol,
              type: t.transaction_type,
              date: t.transaction_date,
              quantity: parseFloat(t.quantity),
              price: parseFloat(t.price_per_share),
              fees: parseFloat(t.fees) || 0,
              notes: t.notes || '',
            }));
            setTransactions(mappedTransactions);
          } else {
            // Create default portfolio account if none exists
            try {
              const newAccount = await createPortfolioAccount(user.id, 'My Portfolio', 'NGN');
              setCloudAccountId(newAccount.id);
              
              // Migrate localStorage data to cloud if exists
              const saved = localStorage.getItem('predicta_portfolio_transactions');
              if (saved) {
                const localTransactions = JSON.parse(saved);
                if (localTransactions.length > 0) {
                  // Migrate each transaction
                  for (const tx of localTransactions) {
                    try {
                      await addTransaction(newAccount.id, {
                        symbol: tx.symbol,
                        transaction_type: tx.type,
                        transaction_date: tx.date,
                        quantity: tx.quantity,
                        price_per_share: tx.price,
                        fees: tx.fees || 0,
                        notes: tx.notes || '',
                      });
                    } catch (txError) {
                      console.error('Failed to migrate transaction:', txError);
                    }
                  }
                  // Reload to get migrated transactions
                  const reloadedAccounts = await getPortfolioAccounts(user.id);
                  if (reloadedAccounts.length > 0) {
                    const reloadedTransactions = reloadedAccounts[0].portfolio_transactions || [];
                    const mappedTransactions: Transaction[] = reloadedTransactions.map((t: any) => ({
                      id: t.id,
                      symbol: t.symbol,
                      type: t.transaction_type,
                      date: t.transaction_date,
                      quantity: parseFloat(t.quantity),
                      price: parseFloat(t.price_per_share),
                      fees: parseFloat(t.fees) || 0,
                      notes: t.notes || '',
                    }));
                    setTransactions(mappedTransactions);
                  }
                }
              }
            } catch (createError) {
              console.error('Failed to create default portfolio account:', createError);
            }
          }
        } catch (error) {
          console.error('Failed to load portfolio from cloud:', error);
        }
      } else {
        // Load from localStorage
        const saved = localStorage.getItem('predicta_portfolio_transactions');
        if (saved) {
          setTransactions(JSON.parse(saved));
        }
      }
      setLoading(false);
    };

    loadTransactions();
  }, [user, isConfigured]);

  // Save transactions to localStorage and/or cloud
  const saveTransactions = async (newTransactions: Transaction[], oldTransactions?: Transaction[]) => {
    setTransactions(newTransactions);
    
    // Always save to localStorage as backup
    localStorage.setItem('predicta_portfolio_transactions', JSON.stringify(newTransactions));
    
    // Sync to cloud if authenticated
    if (user && isConfigured && cloudAccountId) {
      try {
        // Find new transactions that need to be synced
        const oldIds = new Set((oldTransactions || []).map(t => t.id));
        const newTransactionsToSync = newTransactions.filter(t => !oldIds.has(t.id));
        
        // Sync each new transaction
        for (const tx of newTransactionsToSync) {
          try {
            const result = await addTransaction(cloudAccountId, {
              symbol: tx.symbol,
              transaction_type: tx.type,
              transaction_date: tx.date,
              quantity: tx.quantity,
              price_per_share: tx.price,
              fees: tx.fees,
              notes: tx.notes || '',
            });
            // Update local transaction with cloud ID
            tx.id = result.id;
          } catch (txError) {
            console.error('Failed to sync transaction to cloud:', txError);
          }
        }
      } catch (error) {
        console.error('Failed to sync transactions to cloud:', error);
      }
    }
  };

  // Get current prices from datasets
  const currentPrices = useMemo(() => {
    const prices = new Map<string, number>();
    for (const dataset of Array.from(state.datasets.values())) {
      if (dataset.prices.length > 0) {
        prices.set(dataset.info.symbol, dataset.prices[dataset.prices.length - 1].close);
      }
    }
    return prices;
  }, [state.datasets]);

  // Calculate holdings
  const holdings = useMemo(() => {
    return calculateHoldings(transactions, currentPrices);
  }, [transactions, currentPrices]);

  // Calculate summary
  const summary = useMemo(() => {
    return calculatePortfolioSummary(holdings, transactions);
  }, [holdings, transactions]);

  // Handle CSV import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { transactions: newTransactions, errors } = parseTransactionCSV(content);
      
      if (errors.length > 0) {
        alert(`Import errors:\n${errors.join('\n')}`);
      }
      
      if (newTransactions.length > 0) {
        saveTransactions([...transactions, ...newTransactions], transactions);
        setShowImportModal(false);
      }
    };
    reader.readAsText(file);
  };

  // Handle sample data
  const handleLoadSample = () => {
    const csv = generateSampleTransactionCSV();
    const { transactions: newTransactions } = parseTransactionCSV(csv);
    saveTransactions([...transactions, ...newTransactions], transactions);
    setShowImportModal(false);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (id: string) => {
    // Delete from cloud if authenticated
    if (user && isConfigured) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Failed to delete transaction from cloud:', error);
        window.alert('Failed to delete transaction. Please try again.');
        return; // Don't update local state if cloud delete failed
      }
    }
    
    // Delete from local state
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    localStorage.setItem('predicta_portfolio_transactions', JSON.stringify(updatedTransactions));
  };

  // Handle export
  const handleExport = () => {
    const headers = ['Symbol', 'Type', 'Date', 'Quantity', 'Price', 'Fees', 'Notes'];
    const rows = transactions.map(t => [
      t.symbol,
      t.type,
      t.date,
      t.quantity,
      t.price,
      t.fees,
      t.notes || '',
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-[var(--color-text-muted)]">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {user && isConfigured && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="px-2 py-1 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)]">
            Synced
          </span>
          <span>Your portfolio is synced across devices</span>
        </div>
      )}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<PieChart size={32} />}
          title="No Portfolio Data"
          description="Import transactions via CSV or add them manually to start tracking your portfolio."
          action={
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setShowImportModal(true)}>
                <Upload size={16} />
                Import CSV
              </Button>
              <Button variant="secondary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add Transaction
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Portfolio Value"
              value={formatPrice(summary.totalValue, 'NGN')}
              icon={<DollarSign size={18} className="text-[var(--color-accent-blue)]" />}
            />
            <MetricCard
              label="Total Return"
              value={formatPercent(summary.totalReturnPercent / 100)}
              change={summary.totalReturnPercent / 100}
              variant={summary.totalReturn >= 0 ? 'positive' : 'negative'}
              icon={summary.totalReturn >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            />
            <MetricCard
              label="Unrealized P&L"
              value={formatPrice(summary.totalUnrealizedPL, 'NGN')}
              variant={summary.totalUnrealizedPL >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Dividend Income"
              value={formatPrice(summary.totalDividendIncome, 'NGN')}
              variant="positive"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Transaction
            </Button>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload size={16} />
              Import CSV
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} />
              Export CSV
            </Button>
          </div>

          {/* Holdings Table */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Holdings ({holdings.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)]">
                  <tr>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Symbol</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Quantity</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Avg Cost</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Current Price</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Market Value</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Unrealized P&L</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Return %</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Weight %</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Dividends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-primary)]">
                  {holdings.map(holding => (
                    <tr key={holding.symbol} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td className="p-2 font-bold text-[var(--color-text-primary)]">{holding.symbol}</td>
                      <td className="p-2 text-right font-mono">{holding.quantity.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono">{formatPrice(holding.averageCost, 'NGN')}</td>
                      <td className="p-2 text-right font-mono">{formatPrice(holding.currentPrice, 'NGN')}</td>
                      <td className="p-2 text-right font-mono font-semibold">{formatPrice(holding.currentValue, 'NGN')}</td>
                      <td className={`p-2 text-right font-mono ${getChangeColor(holding.unrealizedPL)}`}>
                        {formatPrice(holding.unrealizedPL, 'NGN')}
                      </td>
                      <td className={`p-2 text-right font-mono ${getChangeColor(holding.unrealizedPLPercent / 100)}`}>
                        {holding.unrealizedPLPercent >= 0 ? '+' : ''}{holding.unrealizedPLPercent.toFixed(2)}%
                      </td>
                      <td className="p-2 text-right font-mono">{holding.weight.toFixed(1)}%</td>
                      <td className="p-2 text-right font-mono text-[var(--color-positive)]">
                        {formatPrice(holding.dividendIncome, 'NGN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Transaction History ({transactions.length})
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-primary)] sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Date</th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Symbol</th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Type</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Quantity</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Price</th>
                    <th className="p-2 text-right text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Fees</th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Notes</th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-primary)]">
                  {[...transactions].reverse().map(tx => (
                    <tr key={tx.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td className="p-2 font-mono text-[var(--color-text-secondary)]">{tx.date}</td>
                      <td className="p-2 font-bold text-[var(--color-text-primary)]">{tx.symbol}</td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          tx.type === 'buy' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                          tx.type === 'sell' ? 'bg-[var(--color-negative-dim)] text-[var(--color-negative)]' :
                          tx.type === 'dividend' ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]' :
                          'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono">{tx.quantity.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono">{formatPrice(tx.price, 'NGN')}</td>
                      <td className="p-2 text-right font-mono text-[var(--color-text-muted)]">{formatPrice(tx.fees, 'NGN')}</td>
                      <td className="p-2 text-[var(--color-text-muted)] truncate max-w-[200px]">{tx.notes || '—'}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1 rounded hover:bg-[var(--color-negative-dim)] text-[var(--color-text-muted)] hover:text-[var(--color-negative)] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-md">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Import Transactions</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  Upload a CSV file with columns: Symbol, Type, Date, Quantity, Price, Fees, Notes
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="portfolio-csv-upload"
                />
                <label htmlFor="portfolio-csv-upload">
                  <Button variant="primary" className="cursor-pointer w-full">
                    <Upload size={16} />
                    Choose CSV File
                  </Button>
                </label>
              </div>
              <div className="border-t border-[var(--color-border-primary)] pt-3">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">Or load sample data for testing</p>
                <Button variant="secondary" onClick={handleLoadSample} className="w-full">
                  Load Sample Portfolio (Demo Data)
                </Button>
                <p className="text-[10px] text-[var(--color-warning)] mt-2">
                  ⚠️ Sample data is for testing only — not real market prices
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal (placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-md">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Add Transaction</h4>
            <p className="text-xs text-[var(--color-text-muted)]">
              Manual transaction entry coming soon. For now, please use CSV import.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
