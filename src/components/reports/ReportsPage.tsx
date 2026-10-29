// ============================================================
// Reports Page
// ============================================================
import React, { useState } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { calculateHistoricalStatistics } from '../../engine/statistics';
import { runForecast, runModelComparison } from '../../engine/forecasting';
import { detectAnomalies } from '../../engine/anomaly';
import { Button, EmptyState, StatusBadge, Disclaimer } from '../common';
import { formatPrice, formatPercentPlain, formatDate } from '../../utils/formatters';
import { ResearchReport, ForecastHorizon } from '../../types';
import { FileText, Download, Plus, Trash2 } from 'lucide-react';

interface ReportsPageProps {
  onNavigate: (page: string) => void;
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
  const { state, dispatch } = useAppState();
  const datasets = useAllDatasets();
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    if (!selectedSymbol) return;
    const dataset = state.datasets.get(selectedSymbol);
    if (!dataset) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const stats = calculateHistoricalStatistics(dataset.prices);
        const forecast = runForecast(dataset.prices, 5, 'ridge_regression');
        const comparison = runModelComparison(dataset.prices, 5);
        const anomalies = detectAnomalies(dataset.prices);

        const report: ResearchReport = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          stockSymbol: dataset.info.symbol,
          stockName: dataset.info.name,
          generatedAt: new Date().toISOString(),
          dataSource: dataset.info.dataSource,
          analysisPeriod: dataset.info.dateRange,
          dataQuality: dataset.quality,
          statistics: stats,
          forecasts: [forecast],
          modelComparison: comparison,
          anomalies: anomalies.slice(0, 10),
          limitations: [
            'Forecasts are based on historical patterns and do not account for future events',
            'Models are evaluated on past data — future performance may differ',
            'No fundamental analysis or news sentiment is incorporated',
            'Short evaluation period may not capture all market regimes',
          ],
          disclaimer: 'This report is for research and educational purposes only. It does not constitute investment advice.',
        };

        dispatch({ type: 'ADD_REPORT', payload: report });
      } catch (err) {
        console.error('Report generation error:', err);
      }
      setIsGenerating(false);
    }, 200);
  };

  const handleExportReport = (report: ResearchReport) => {
    const csvRows = [
      'PREDICTA Research Report',
      `Stock,${report.stockSymbol}`,
      `Name,${report.stockName}`,
      `Generated,${report.generatedAt}`,
      `Data Source,${report.dataSource}`,
      `Period,${report.analysisPeriod.start} to ${report.analysisPeriod.end}`,
      '',
      'Historical Statistics',
      `Total Return,${(report.statistics.totalReturn * 100).toFixed(2)}%`,
      `Annualized Return,${(report.statistics.annualizedReturn * 100).toFixed(2)}%`,
      `Annualized Volatility,${(report.statistics.annualizedVolatility * 100).toFixed(2)}%`,
      `Max Drawdown,${(report.statistics.maxDrawdown * 100).toFixed(2)}%`,
      `Sharpe Ratio,${report.statistics.sharpeRatio?.toFixed(2) ?? 'N/A'}`,
      '',
      'Forecast',
      `Model,${report.forecasts[0]?.modelName ?? 'N/A'}`,
      `Horizon,${report.forecasts[0]?.horizon ?? 'N/A'} sessions`,
      `Estimated Return,${report.forecasts[0] ? (report.forecasts[0].estimatedReturn * 100).toFixed(3) + '%' : 'N/A'}`,
      `Estimated Price,${report.forecasts[0] ? report.forecasts[0].estimatedPrice.toFixed(2) : 'N/A'}`,
      `Lower Bound,${report.forecasts[0] ? report.forecasts[0].lowerBound.toFixed(2) : 'N/A'}`,
      `Upper Bound,${report.forecasts[0] ? report.forecasts[0].upperBound.toFixed(2) : 'N/A'}`,
      '',
      'Data Quality',
      `Overall,${report.dataQuality.overallScore}`,
      `Total Records,${report.dataQuality.totalRecords}`,
      `Warnings,${report.dataQuality.warnings.join('; ')}`,
      '',
      'Limitations',
      ...report.limitations.map(l => `• ${l}`),
      '',
      report.disclaimer,
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PREDICTA_Report_${report.stockSymbol}_${report.generatedAt.split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={32} />}
        title="No Data Available"
        description="Import stock data before generating reports."
        action={<Button onClick={() => onNavigate('data')}>Import Data</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Generate Report */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Generate Research Report</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Stock</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>{ds.info.symbol} — {ds.info.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleGenerateReport} disabled={!selectedSymbol || isGenerating}>
            <Plus size={14} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Saved Reports */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
        <div className="p-4 border-b border-[var(--color-border-primary)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Saved Reports ({state.reports.length})</h4>
        </div>
        {state.reports.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            No reports generated yet. Select a stock and generate a report above.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-primary)]">
            {state.reports.map(report => (
              <div key={report.id} className="p-4 hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-[var(--color-text-primary)]">{report.stockSymbol}</h5>
                      <StatusBadge status={report.forecasts[0]?.status ?? 'experimental'} />
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{report.stockName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[var(--color-text-muted)]">
                      <span>Generated: {formatDate(report.generatedAt.split('T')[0])}</span>
                      <span>Period: {formatDate(report.analysisPeriod.start)} — {formatDate(report.analysisPeriod.end)}</span>
                      <span>Return: {formatPercentPlain(report.statistics.totalReturn)}</span>
                      <span>Vol: {formatPercentPlain(report.statistics.annualizedVolatility)}</span>
                      <span>Anomalies: {report.anomalies.length}</span>
                    </div>
                    {report.forecasts[0] && (
                      <div className="mt-2 p-2 bg-[var(--color-bg-tertiary)] rounded-lg text-xs">
                        <span className="text-[var(--color-text-muted)]">Forecast ({report.forecasts[0].horizon}-session): </span>
                        <span className={`font-mono font-bold ${report.forecasts[0].estimatedReturn >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                          {formatPercentPlain(report.forecasts[0].estimatedReturn)}
                        </span>
                        <span className="text-[var(--color-text-muted)] ml-2">→ {formatPrice(report.forecasts[0].estimatedPrice)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleExportReport(report)}>
                      <Download size={12} />
                      Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'REMOVE_REPORT', payload: report.id })}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Disclaimer />
    </div>
  );
}
