// ============================================================
// Application Shell - Layout, Navigation, Header
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Search, LineChart, FlaskConical, AlertTriangle, 
  FileText, Star, Settings, Menu, X, ChevronRight, Database, TrendingUp, Filter,
  PieChart, Calculator, BookOpen, Zap, Bell, Calendar, LogOut, User, Cloud, CloudOff,
  Sparkles
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'terminal', label: 'Terminal', icon: LayoutDashboard },
  { id: 'explore', label: 'Markets', icon: Search },
  { id: 'screener', label: 'Screener', icon: Filter },
  { id: 'signals', label: 'Signals', icon: Zap },
  { id: 'research', label: 'Stock Research', icon: LineChart },
  { id: 'dataroom', label: 'Data Room', icon: FileText },
  { id: 'ask', label: 'Ask PREDICTA', icon: Sparkles },
  { id: 'watchlist', label: 'Watchlists', icon: Star },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'valuation', label: 'Valuation', icon: Calculator },
  { id: 'forecast', label: 'Forecasting', icon: TrendingUp },
  { id: 'laboratory', label: 'Model Lab', icon: FlaskConical },
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'data', label: 'Data Import', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut, isConfigured } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Clear any user-specific state
    onNavigate('landing');
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)]
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-blue)] flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">PREDICTA</h1>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Quantitative Research</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isActive 
                      ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/20' 
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-primary)]">
          <div className="text-[11px] text-[var(--color-text-muted)]">
            <p>PREDICTA v0.1.0 MVP</p>
            <p className="mt-0.5">Forecasts are estimates, not guarantees.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex items-center px-4 lg:px-6 gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {navItems.find(n => n.id === currentPage)?.label ?? 'PREDICTA'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
              {isConfigured ? (
                <>
                  <Cloud size={14} className="text-[var(--color-positive)]" />
                  <span className="text-xs text-[var(--color-text-secondary)]">Synced</span>
                </>
              ) : (
                <>
                  <CloudOff size={14} className="text-[var(--color-warning)]" />
                  <span className="text-xs text-[var(--color-text-secondary)]">Offline</span>
                </>
              )}
            </div>

            {/* User info and sign out */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
                  <User size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs text-[var(--color-text-secondary)] max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
