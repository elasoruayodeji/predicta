// ============================================================
// PREDICTA — Main Application
// ============================================================
import React, { useState } from 'react';
import { AppProvider, useAppState } from './store/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
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
import { InvestmentTerminal } from './components/terminal/InvestmentTerminal';
import { StockResearch } from './components/stocks/StockResearch';
import { DataRoom } from './components/dataroom/DataRoom';
import { AskPredicta } from './components/ai/AskPredicta';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { dispatch } = useAppState();
  const { user, loading, isConfigured, isEmailVerified } = useAuth();

  const handleSelectStock = (symbol: string) => {
    setSelectedStock(symbol);
    dispatch({ type: 'SET_ACTIVE_SYMBOL', payload: symbol });
    setCurrentPage('analysis');
  };

  const handleNavigate = (page: string) => {
    // Public routes that don't require authentication
    const publicRoutes = ['landing', 'auth', 'auth/callback', 'auth/verify-email', 'auth/forgot-password', 'auth/reset-password'];
    
    // Protect private routes
    if (!user && isConfigured && !publicRoutes.includes(page)) {
      setCurrentPage('auth');
      return;
    }
    
    // Check email verification for protected routes
    if (user && isConfigured && !isEmailVerified && !publicRoutes.includes(page) && page !== 'auth/verify-email') {
      setCurrentPage('auth/verify-email');
      return;
    }
    
    setCurrentPage(page);
    if (page !== 'analysis') {
      setSelectedStock(null);
    }
  };

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

  // Handle auth-related routes
  if (currentPage.startsWith('auth/')) {
    switch (currentPage) {
      case 'auth/callback':
        return <AuthCallback onNavigate={handleNavigate} />;
      case 'auth/verify-email':
        return <VerifyEmailPage onNavigate={handleNavigate} />;
      case 'auth/forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case 'auth/reset-password':
        return <ResetPasswordPage onNavigate={handleNavigate} />;
    }
  }

  // Show landing/auth pages WITHOUT AppShell (no sidebar)
  if (!user && isConfigured) {
    if (currentPage === 'auth') {
      return <AuthPage 
        initialMode={new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'signin'} 
        onNavigate={handleNavigate}
      />;
    }
    // Default to landing page for unauthenticated users
    return <LandingPage onNavigate={handleNavigate} />;
  }

  // Handle auth-related routes (these also don't need AppShell)
  if (currentPage.startsWith('auth/')) {
    switch (currentPage) {
      case 'auth/callback':
        return <AuthCallback onNavigate={handleNavigate} />;
      case 'auth/verify-email':
        return <VerifyEmailPage onNavigate={handleNavigate} />;
      case 'auth/forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case 'auth/reset-password':
        return <ResetPasswordPage onNavigate={handleNavigate} />;
    }
  }

  // If authenticated but email not verified, show verification page
  if (user && isConfigured && !isEmailVerified && currentPage !== 'auth/verify-email') {
    return <VerifyEmailPage onNavigate={handleNavigate} />;
  }

  // If authenticated and on landing/auth page, redirect to terminal
  if (user && (currentPage === 'landing' || currentPage === 'auth')) {
    setCurrentPage('terminal');
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'terminal':
        return <InvestmentTerminal onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'explore':
        return <StockExplorer onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'analysis':
      case 'research':
        if (selectedStock) {
          return <StockResearch symbol={selectedStock} onBack={() => handleNavigate('explore')} onNavigate={handleNavigate} />;
        }
        return <StockExplorer onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'dataroom':
        return <DataRoom onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
      case 'ask':
        return <AskPredicta onNavigate={handleNavigate} />;
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
        return <InvestmentTerminal onNavigate={handleNavigate} onSelectStock={handleSelectStock} />;
    }
  };

  // Only wrap authenticated pages with AppShell (sidebar navigation)
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
