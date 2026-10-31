// ============================================================
// PREDICTA — Main Application
// ============================================================
import React, { useState } from 'react';
import { AppProvider, useAppState } from './store/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './components/auth/AuthPage';
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
import { MarketSignals } from './components/signals/MarketSignals';
import { AlertsPage } from './components/alerts/AlertsPage';
import { InvestmentCalendar } from './components/calendar/InvestmentCalendar';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { dispatch } = useAppState();
  const { user, loading, isConfigured } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[var(--color-accent-blue)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">Loading...</span>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated (but only if Supabase is configured)
  if (!user && isConfigured) {
    return <AuthPage />;
  }

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
      case 'signals':
        return <MarketSignals onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'alerts':
        return <AlertsPage onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'calendar':
        return <InvestmentCalendar onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
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
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
