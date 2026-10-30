// ============================================================
// PREDICTA — Main Application
// ============================================================
import React, { useState } from 'react';
import { AppProvider, useAppState } from './store/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { StockExplorer } from './components/stocks/StockExplorer';
import { StockDetail } from './components/stocks/StockDetail';
import { ForecastWorkspace } from './components/forecasting/ForecastWorkspace';
import { ModelLaboratory } from './components/forecasting/ModelLaboratory';
import { AnomalyPanel } from './components/anomalies/AnomalyPanel';
import { ReportsPage } from './components/reports/ReportsPage';
import { WatchlistPage } from './components/watchlist/WatchlistPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { DataImportPage } from './components/data/DataImportPage';
import { StockScreener } from './components/screener/StockScreener';
import { PortfolioTracker } from './components/portfolio/PortfolioTracker';
import { ValuationWorkbench } from './components/valuation/ValuationWorkbench';
import { InvestmentJournal } from './components/journal/InvestmentJournal';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { dispatch } = useAppState();

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol });
    setCurrentPage('analysis');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'analysis') {
      setSelectedStock(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'explore':
        return <StockExplorer onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'analysis':
        if (selectedStock) {
          return <StockDetail symbol={selectedStock} onBack={() => handleNavigate('explore')} onNavigate={handleNavigate} />;
        }
        return <StockExplorer onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'forecast':
        return <ForecastWorkspace onNavigate={handleNavigate} />;
      case 'laboratory':
        return <ModelLaboratory onNavigate={handleNavigate} />;
      case 'anomalies':
        return <AnomalyPanel onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage onNavigate={handleNavigate} />;
      case 'watchlist':
        return <WatchlistPage onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'screener':
        return <StockScreener onSelectStock={handleSelectStock} onNavigate={handleNavigate} />;
      case 'portfolio':
        return <PortfolioTracker onNavigate={handleNavigate} />;
      case 'valuation':
        return <ValuationWorkbench />;
      case 'journal':
        return <InvestmentJournal onNavigate={handleNavigate} />;
      case 'data':
        return <DataImportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
    }
  };

  return (
    <AppShell currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
