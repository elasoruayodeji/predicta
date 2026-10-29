// ============================================================
// Investo Data Browser
// ============================================================
// Lets users browse and import real NGX stock data from Investo API.
// Clearly labeled as REAL INVESTO DATA — never confused with CSV or synthetic.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../store/AppContext';
import { 
  fetchInvestoStocks, 
  fetchInvestoPrices, 
  checkInvestoHealth,
  type InvestoStock 
} from '../../services/investoClient';
import { investoToDataset, formatInvestoTimestamp, getInvestoAttribution } from '../../engine/investoAdapter';
import { Button } from '../common';
import { formatPrice, formatPercent, formatVolume, getChangeColor } from '../../utils/formatters';
import { 
  Cloud, Search, Download, CheckCircle, XCircle, AlertCircle, 
  Loader2, RefreshCw, Info 
} from 'lucide-react';

interface InvestoBrowserProps {
  onImportSuccess: () => void;
}

export function InvestoBrowser({ onImportSuccess }: InvestoBrowserProps) {
  const { dispatch } = useAppState();
  const [serverStatus, setServerStatus] = useState<'checking' | 'configured' | 'not_configured' | 'error'>('checking');
  const [stocks, setStocks] = useState<InvestoStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [attribution, setAttribution] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Check server health on mount
  useEffect(() => {
    checkInvestoHealth().then(health => {
      if (health.ok && health.investoConfigured) {
        setServerStatus('configured');
        loadStockList();
      } else if (health.ok && !health.investoConfigured) {
        setServerStatus('not_configured');
      } else {
        setServerStatus('error');
      }
    }).catch(() => {
      setServerStatus('error');
    });
  }, []);

  const loadStockList = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const result = await fetchInvestoStocks();
    setIsLoading(false);

    if (result.ok) {
      setStocks(result.data);
      setAttribution(getInvestoAttribution(result.meta));
      setLastUpdated(formatInvestoTimestamp(result.meta.generated_at));
    } else {
      setStatusMessage({ type: 'error', text: result.error.message });
    }
  };

  const handleImportStock = async (stock: InvestoStock) => {
    setLoadingSymbol(stock.symbol);
    setStatusMessage(null);

    // Fetch full price history (from 2016 or earliest available)
    const result = await fetchInvestoPrices(stock.symbol, { from: '2016-01-01' });

    if (result.ok) {
      const dataset = investoToDataset(stock, result.data, new Date().toISOString());
      
      if (dataset.prices.length < 10) {
        setStatusMessage({ 
          type: 'error', 
          text: `${stock.symbol}: Insufficient price data (${dataset.prices.length} records). Need at least 10.` 
        });
        setLoadingSymbol(null);
        return;
      }

      dispatch({ type: 'SET_DATASET', payload: dataset });
      setStatusMessage({ 
        type: 'success', 
        text: `Imported ${dataset.prices.length} records for ${stock.symbol} from Investo API` 
      });
      onImportSuccess();
    } else {
      setStatusMessage({ type: 'error', text: `${stock.symbol}: ${result.error.message}` });
    }

    setLoadingSymbol(null);
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Server not configured
  if (serverStatus === 'not_configured') {
    return (
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Cloud size={20} className="text-[var(--color-text-muted)] mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              Investo API Not Configured
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              The PREDICTA server is running, but the Investo API key is not configured. 
              To enable real NGX market data, set the <code className="px-1 py-0.5 bg-[var(--color-bg-tertiary)] rounded text-[10px]">INVESTO_API_KEY</code> environment variable and restart the server.
            </p>
            <div className="text-[11px] text-[var(--color-text-muted)] space-y-1">
              <p>• Get a free key at: <a href="https://investo.ng/developers/keys" target="_blank" rel="noopener" className="text-[var(--color-accent-blue)] hover:underline">investo.ng/developers/keys</a></p>
              <p>• Free tier: 1,000 requests/day for personal projects</p>
              <p>• CSV import and synthetic demo mode work without Investo</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Server error or checking
  if (serverStatus === 'checking' || serverStatus === 'error') {
    return (
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
        <div className="flex items-center gap-3">
          {serverStatus === 'checking' ? (
            <Loader2 size={20} className="animate-spin text-[var(--color-accent-blue)]" />
          ) : (
            <AlertCircle size={20} className="text-[var(--color-negative)]" />
          )}
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {serverStatus === 'checking' ? 'Checking server...' : 'Server Unavailable'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {serverStatus === 'checking' 
                ? 'Verifying Investo API connection...' 
                : 'Could not connect to the PREDICTA server. Is it running?'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Configured — show browser
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-positive-dim)]">
            <Cloud size={18} className="text-[var(--color-positive)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Real NGX Market Data
              </h3>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold uppercase">
                Live
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {stocks.length} listed equities · End-of-day data · {attribution && `Data: ${attribution}`}
            </p>
            {lastUpdated && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={loadStockList} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`mb-4 flex items-start gap-2 p-3 rounded-lg border ${
          statusMessage.type === 'success' 
            ? 'bg-[var(--color-positive-dim)] border-[var(--color-positive)]/20' 
            : statusMessage.type === 'error'
            ? 'bg-[var(--color-negative-dim)] border-[var(--color-negative)]/20'
            : 'bg-[var(--color-accent-blue-glow)] border-[var(--color-accent-blue)]/20'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle size={16} className="text-[var(--color-positive)] mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <XCircle size={16} className="text-[var(--color-negative)] mt-0.5" />
          ) : (
            <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          )}
          <p className={`text-xs ${
            statusMessage.type === 'success' ? 'text-[var(--color-positive)]' :
            statusMessage.type === 'error' ? 'text-[var(--color-negative)]' :
            'text-[var(--color-accent-blue)]'
          }`}>
            {statusMessage.text}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search by symbol, name, or sector..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
        />
      </div>

      {/* Stock list */}
      {isLoading && stocks.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[var(--color-accent-blue)]" />
          <span className="ml-2 text-sm text-[var(--color-text-secondary)]">Loading stock list...</span>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
          {searchQuery ? 'No stocks match your search.' : 'No stocks available.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredStocks.slice(0, 50).map(stock => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{stock.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                    {stock.market}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{stock.name}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--color-text-muted)]">
                  <span>{stock.sector}</span>
                  <span>Vol: {formatVolume(stock.volume)}</span>
                  <span>MCap: {formatVolume(stock.market_cap)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                    {formatPrice(stock.price, 'NGN')}
                  </p>
                  <p className={`text-xs font-mono ${getChangeColor(stock.change_percent / 100)}`}>
                    {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleImportStock(stock)}
                  disabled={loadingSymbol !== null}
                >
                  {loadingSymbol === stock.symbol ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Import
                </Button>
              </div>
            </div>
          ))}
          {filteredStocks.length > 50 && (
            <p className="text-center text-xs text-[var(--color-text-muted)] py-2">
              Showing 50 of {filteredStocks.length} stocks. Use search to filter.
            </p>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
        <p className="text-[10px] text-[var(--color-text-muted)]">
          <strong className="text-[var(--color-text-secondary)]">Note:</strong> This is end-of-day data, not real-time. 
          Prices reflect the last completed trading session. High/low values may be null where the upstream feed did not carry them.
          {attribution && <> Data: {attribution}.</>}
        </p>
      </div>
    </div>
  );
}
