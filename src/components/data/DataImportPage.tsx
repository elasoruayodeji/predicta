// ============================================================
// Data Import Page
// ============================================================
import React, { useRef, useState } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { parseCSV, generateSampleCSV } from '../../utils/csv';
import { validatePriceData, cleanPriceData } from '../../engine/dataValidation';
import { Button, MetricCard } from '../common';
import { formatDate } from '../../utils/formatters';
import { Upload, Database, FileText, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export function DataImportPage() {
  const { state, dispatch } = useAppState();
  const datasets = useAllDatasets();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importedSymbol, setImportedSymbol] = useState('');

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

    const cleaned = cleanPriceData(records);
    if (cleaned.length < 10) {
      setImportStatus('error');
      setImportMessage('After cleaning, insufficient valid records remain.');
      return;
    }

    const quality = validatePriceData(cleaned);
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
    setImportMessage(`Successfully imported ${cleaned.length} records for ${symbol}`);
    setImportWarnings(quality.warnings);
    setImportedSymbol(symbol);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = () => {
    const csv = generateSampleCSV();
    processCSV(csv, 'SYNTHETIC_DEMO');
    // Add synthetic data warning
    setTimeout(() => {
      setImportWarnings(prev => [
        'SYNTHETIC DATA: This is randomly generated demonstration data, NOT real market prices. Do not use for investment decisions. Import real CSV data for actual analysis.',
        ...prev,
      ]);
    }, 0);
  };

  const handleRemoveDataset = (symbol: string) => {
    dispatch({ type: 'REMOVE_DATASET', payload: symbol });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Import Section */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Import Stock Data</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Upload a CSV file with historical stock price data. The file must contain at minimum: Date, Open, High, Low, Close columns. Volume is recommended.
        </p>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-[var(--color-border-secondary)] rounded-xl p-8 text-center hover:border-[var(--color-accent-blue)]/50 transition-colors">
          <Database size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">Drag and drop a CSV file, or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload-main"
          />
          <div className="flex items-center justify-center gap-3">
            <label htmlFor="csv-upload-main">
              <Button variant="primary" className="cursor-pointer">
                <Upload size={16} />
                Choose File
              </Button>
            </label>
            <Button variant="secondary" onClick={handleLoadSample}>
              <FileText size={16} />
              Load Demo Data
            </Button>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-3">
            Max file size: 10MB · Supported formats: CSV, TXT
          </p>
        </div>

        {/* Import Status */}
        {importStatus === 'success' && (
          <div className="mt-4 p-4 rounded-lg bg-[var(--color-positive-dim)] border border-[var(--color-positive)]/20">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-[var(--color-positive)] mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[var(--color-positive)]">{importMessage}</p>
                {importWarnings.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {importWarnings.map((w, i) => (
                      <li key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-start gap-1">
                        <AlertCircle size={10} className="mt-0.5 text-[var(--color-warning)] flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

      {/* Expected Format */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-[var(--color-accent-blue)]" />
          <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Expected CSV Format</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-primary)]">
                <th className="text-left p-2 text-[var(--color-text-muted)]">Column</th>
                <th className="text-left p-2 text-[var(--color-text-muted)]">Required</th>
                <th className="text-left p-2 text-[var(--color-text-muted)]">Format</th>
                <th className="text-left p-2 text-[var(--color-text-muted)]">Example</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-text-secondary)]">
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">Date</td><td className="p-2">Yes</td><td className="p-2">YYYY-MM-DD</td><td className="p-2 font-mono">2024-01-15</td></tr>
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">Open</td><td className="p-2">Yes</td><td className="p-2">Decimal</td><td className="p-2 font-mono">150.25</td></tr>
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">High</td><td className="p-2">Yes</td><td className="p-2">Decimal</td><td className="p-2 font-mono">152.80</td></tr>
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">Low</td><td className="p-2">Yes</td><td className="p-2">Decimal</td><td className="p-2 font-mono">149.50</td></tr>
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">Close</td><td className="p-2">Yes</td><td className="p-2">Decimal</td><td className="p-2 font-mono">151.30</td></tr>
              <tr className="border-b border-[var(--color-border-primary)]"><td className="p-2 font-mono">Volume</td><td className="p-2">Recommended</td><td className="p-2">Integer</td><td className="p-2 font-mono">1250000</td></tr>
              <tr><td className="p-2 font-mono">Adj Close</td><td className="p-2">Optional</td><td className="p-2">Decimal</td><td className="p-2 font-mono">150.80</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Imported Datasets */}
      {datasets.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Imported Datasets ({datasets.length})</h4>
          </div>
          <div className="divide-y divide-[var(--color-border-primary)]">
            {datasets.map(ds => (
              <div key={ds.info.symbol} className="p-4 flex items-center justify-between hover:bg-[var(--color-bg-hover)] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{ds.info.symbol}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      ds.quality.overallScore === 'excellent' ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]' :
                      ds.quality.overallScore === 'good' ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]' :
                      ds.quality.overallScore === 'fair' ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]' :
                      'bg-[var(--color-negative-dim)] text-[var(--color-negative)]'
                    }`}>{ds.quality.overallScore}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    {ds.info.recordCount.toLocaleString()} records · {formatDate(ds.info.dateRange.start)} — {formatDate(ds.info.dateRange.end)} · {ds.info.dataSource}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveDataset(ds.info.symbol)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
