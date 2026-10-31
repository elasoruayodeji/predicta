// ============================================================
// Data Room - Company Documents & Financial Statements
// ============================================================
import React, { useState } from 'react';
import { useAppState } from '../../store/AppContext';
import { Button, EmptyState } from '../common';
import { 
  FileText, Search, Filter, Download, Eye, Calendar, 
  TrendingUp, DollarSign, AlertCircle
} from 'lucide-react';

interface DataRoomProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function DataRoom({ onNavigate, onSelectStock }: DataRoomProps) {
  const { state } = useAppState();
  const datasets = Array.from(state.datasets.values());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Simulated document listings (in production, these would come from a document service)
  const documents = datasets.map(ds => ({
    symbol: ds.info.symbol,
    name: ds.info.name,
    documents: [
      {
        type: 'historical_data',
        title: 'Historical Price Data',
        date: ds.info.dateRange.end,
        records: ds.info.recordCount,
        source: ds.info.dataSource,
      },
    ],
  }));

  const filteredDocuments = documents.filter(doc => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!doc.symbol.toLowerCase().includes(query) && 
          !doc.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filterType !== 'all') {
      if (!doc.documents.some(d => d.type === filterType)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Data Room</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Company documents, financial statements, and regulatory filings
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company name or symbol..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Document Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="all">All Types</option>
              <option value="annual_report">Annual Reports</option>
              <option value="quarterly">Quarterly Statements</option>
              <option value="historical_data">Historical Data</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title="No Documents Found"
          description={
            datasets.length === 0
              ? 'Import stock data to view available documents.'
              : 'No documents match your search criteria.'
          }
          action={
            datasets.length === 0 ? (
              <Button variant="primary" onClick={() => onNavigate('data')}>
                Import Data
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc, idx) => (
            <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 
                    className="text-sm font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent-blue)]"
                    onClick={() => onSelectStock(doc.symbol)}
                  >
                    {doc.symbol}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{doc.name}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onSelectStock(doc.symbol)}>
                  <Eye size={14} />
                  View Research
                </Button>
              </div>
              <div className="space-y-2">
                {doc.documents.map((document, docIdx) => (
                  <div key={docIdx} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-[var(--color-accent-blue)]" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">{document.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)] mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {document.date}
                          </span>
                          {document.records && (
                            <span>{document.records.toLocaleString()} records</span>
                          )}
                          <span>Source: {document.source}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Information Notice */}
      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="font-semibold text-[var(--color-text-primary)] mb-1">About Data Room</p>
            <p>
              The Data Room provides access to company documents, financial statements, and regulatory filings. 
              Currently showing historical price data imported via CSV or market data service.
            </p>
            <p className="mt-2">
              Future enhancements will include:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Annual and quarterly financial statements</li>
              <li>Exchange announcements and corporate disclosures</li>
              <li>Document search and filtering</li>
              <li>Structured financial data extraction</li>
              <li>Historical period comparisons</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
