// ============================================================
// Stock Explorer - Search and CSV Import
// ============================================================
import React, { useState, useRef } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { parseCSV, generateSampleCSV } from '../../utils/csv';
import { validatePriceData, cleanPriceData } from '../../engine/dataValidation';
import { Button, MetricCard, EmptyState, WarningBanner } from '../common';
import { formatPrice, formatPercent, formatDate, getChangeColor } from '../../utils/formatters';
import { Upload, Search, Database, FileText, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';

interface StockExplorerProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function StockExplorer({ onNavigate, onSelectStock }: StockExplorerProps) {
  const { state, dispatch } = useAppState();
  const datasets = useAllDatasets();
  const [searchQuery, setSearchQuery] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDatasets = datasets.filter(ds => 
    ds.info.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.info.exchange.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setImportStatus('error');
      setImportMessage('File too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processCSV(content, file.name);
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const processCSV = (content: string, filename: string) => {
    const { records, errors } = parseCSV(content);
    
    if (errors.length > 3 && records.length === 0) {
      setImportStatus('error');
      setImportMessage(`Parse errors: ${errors.slice(0, 3).join('; ')}`);
      return;
    }

    if (records.length < 10) {
      setImportStatus('error');
      setImportMessage(`Insufficient data: only ${records.length} valid records found. Need at least 10.`);
      return;
    }

    // Clean data
    const cleaned = cleanPriceData(records);
    if (cleaned.length < 10) {
      setImportStatus('error');
      setImportMessage('After cleaning, insufficient valid records remain.');
      return;
    }

    // Validate
    const quality = validatePriceData(cleaned);
    
    // Extract symbol from filename or use default
    const baseName = filename.replace(/\.[^/.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    const symbol = baseName || 'IMPORT';

    const dataset = {
      info: {
        symbol,
        name: symbol,
        exchange: 'CSV Import',
        currency: state.settings.currency,
        dataSource: 'CSV Upload',
        importedAt: new Date().toISOString(),
        recordCount: cleaned.length,
        dateRange: {
          start: cleaned[0].date,
          end: cleaned[cleaned.length - 1].date,
        },
      },
      prices: cleaned,
      quality,
    };

    dispatch({ type: 'SET_DATASET', payload: dataset });
    setImportStatus('success');
    setImportMessage(`Imported ${cleaned.length} records for ${symbol}`);
    setImportWarnings(quality.warnings);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = () => {
    const csv = generateSampleCSV();
    processCSV(csv, 'SYNTHETIC_DEMO');
    // The processCSV function will set warnings; we add synthetic data notice
    setTimeout(() => {
      setImportWarnings(prev => [
        'SYNTHETIC DATA: This is randomly generated demonstration data, NOT real market prices. Do not use for investment decisions.',
        ...prev,
      ]);
    }, 0);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Import Section */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Import Stock Data</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Upload a CSV file with columns: Date, Open, High, Low, Close, Volume. Adjusted Close is optional.
        </p>

        <div className="flex flex-wrap gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="primary" className="cursor-pointer">
              <Upload size={16} />
              Upload CSV
            </Button>
          </label>
          <Button variant="secondary" onClick={handleLoadSample}>
            <Database size={16} />
            Load Sample Data
          </Button>
        </div>

        {importStatus === 'success' && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-[var(--color-positive-dim)] border border-[var(--color-positive)]/20">
            <CheckCircle size={16} className="text-[var(--color-positive)] mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[var(--color-positive)]">{importMessage}</p>
              {importWarnings.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {importWarnings.map((w, i) => (
                    <li key={i} className="text-[11px] text-[var(--color-text-secondary)]">• {w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[var(--color-negative-dim)] border border-[var(--color-negative)]/20">
            <XCircle size={16} className="text-[var(--color-negative)]" />
            <p className="text-xs text-[var(--color-negative)]">{importMessage}</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search imported stocks by symbol, name, or exchange..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
        />
      </div>

      {/* Stock List */}
      {filteredDatasets.length === 0 ? (
        <EmptyState
          icon={<Database size={32} />}
          title={datasets.length === 0 ? 'No Data Imported' : 'No Results'}
          description={
            datasets.length === 0
              ? 'Import a CSV file or load sample data to begin analysing stocks.'
              : 'No stocks match your search query.'
          }
        />
      ) : (
        <div className="grid gap-3">
          {filteredDatasets.map(ds => {
            const lastPrice = ds.prices[ds.prices.length - 1];
            const prevPrice = ds.prices.length > 1 ? ds.prices[ds.prices.length - 2] : lastPrice;
            const change = lastPrice && prevPrice ? ((lastPrice.close / prevPrice.close) - 1) : 0;
            const totalReturn = ds.prices.length > 1 
              ? ((ds.prices[ds.prices.length - 1].close / ds.prices[0].close) - 1) 
              : 0;

            return (
              <div
                key={ds.info.symbol}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4 hover:border-[var(--color-accent-blue)]/30 transition-all cursor-pointer group"
                onClick={() => onSelectStock(ds.info.symbol)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center group-hover:bg-[var(--color-accent-blue-glow)] transition-colors">
                      <BarChart3 size={18} className="text-[var(--color-accent-blue)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">{ds.info.symbol}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                          {ds.info.exchange}
                        </span>
                        {ds.info.symbol.includes('SYNTHETIC') && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-bold">
                            SYNTHETIC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">{ds.info.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-[var(--color-text-primary)]">
                      {formatPrice(lastPrice?.close ?? 0, ds.info.currency)}
                    </p>
                    <p className={`text-xs font-mono ${getChangeColor(change)}`}>
                      {formatPercent(change)} today
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {ds.info.recordCount.toLocaleString()} records
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {formatDate(ds.info.dateRange.start)} — {formatDate(ds.info.dateRange.end)}
                  </span>
                  <span className={`text-[11px] font-mono ${getChangeColor(totalReturn)}`}>
                    {formatPercent(totalReturn)} total return
                  </span>
                  <span className={`text-[11px] capitalize ${
                    ds.quality.overallScore === 'excellent' ? 'text-[var(--color-positive)]' :
                    ds.quality.overallScore === 'good' ? 'text-[var(--color-accent-blue)]' :
                    ds.quality.overallScore === 'fair' ? 'text-[var(--color-warning)]' :
                    'text-[var(--color-negative)]'
                  }`}>
                    {ds.quality.overallScore} quality
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
