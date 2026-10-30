// ============================================================
// Common UI Components
// ============================================================
import React from 'react';
import { AlertCircle, Database, FileWarning, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPercent, getChangeColor } from '../../utils/formatters';

// ============================================================
// Metric Card
// ============================================================
interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'forecast';
}

export function MetricCard({ label, value, change, subtitle, icon, variant = 'default' }: MetricCardProps) {
  const borderColor = {
    default: 'border-[var(--color-border-primary)]',
    positive: 'border-[var(--color-positive)]/30',
    negative: 'border-[var(--color-negative)]/30',
    warning: 'border-[var(--color-warning)]/30',
    forecast: 'border-[var(--color-forecast)]/30',
  }[variant];

  return (
    <div className={`bg-[var(--color-bg-secondary)] border ${borderColor} rounded-xl p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)] font-mono truncate">{value}</p>
          {change !== undefined && (
            <p className={`text-xs font-medium mt-1 ${getChangeColor(change)}`}>
              {formatPercent(change)}
            </p>
          )}
          {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="ml-3 p-2 rounded-lg bg-[var(--color-bg-tertiary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Loading State
// ============================================================
export function LoadingState({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 size={32} className="animate-spin text-[var(--color-accent-blue)]" />
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {icon && <div className="p-4 rounded-2xl bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <div className="text-sm text-[var(--color-text-secondary)] max-w-md">{description}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ============================================================
// Error State
// ============================================================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="p-3 rounded-xl bg-[var(--color-negative-dim)]">
        <AlertCircle size={24} className="text-[var(--color-negative)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="text-xs text-[var(--color-text-secondary)] max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue-dim)]">
          Retry
        </button>
      )}
    </div>
  );
}

// ============================================================
// Data Import Prompt
// ============================================================
export function DataImportPrompt({ onImport, onBrowse }: { onImport: () => void; onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<Database size={32} />}
      title="No Data Available"
      description={
        <div className="space-y-2">
          <p>Import stock data to begin analysis. You have two options:</p>
          <ul className="text-left space-y-1 text-xs">
            <li>• <strong>Investo API:</strong> Real-time NGX market data (146 equities) — requires server configuration</li>
            <li>• <strong>CSV Import:</strong> Upload your own historical data in OHLCV format</li>
          </ul>
        </div>
      }
      action={
        <div className="flex gap-3">
          <button
            onClick={onImport}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue-dim)] transition-colors"
          >
            Import CSV Data
          </button>
          {onBrowse && (
            <button
              onClick={onBrowse}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Browse Investo API
            </button>
          )}
        </div>
      }
    />
  );
}

// ============================================================
// Status Badge
// ============================================================
interface StatusBadgeProps {
  status: 'valid' | 'experimental' | 'insufficient_data' | 'failed_validation';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    valid: { color: 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]', text: 'Validated' },
    experimental: { color: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]', text: 'Experimental' },
    insufficient_data: { color: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]', text: 'Insufficient Data' },
    failed_validation: { color: 'bg-[var(--color-negative-dim)] text-[var(--color-negative)]', text: 'Failed Validation' },
  };

  const { color, text } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {label ?? text}
    </span>
  );
}

// ============================================================
// Warning Banner
// ============================================================
export function WarningBanner({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="bg-[var(--color-warning-dim)] border border-[var(--color-warning)]/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <FileWarning size={18} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-[var(--color-warning)] mb-1">Important Notices</p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-[var(--color-text-secondary)]">• {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Disclaimer
// ============================================================
export function Disclaimer() {
  return (
    <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4 mt-4">
      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        <strong className="text-[var(--color-text-secondary)]">Disclaimer:</strong> PREDICTA provides quantitative research and analysis tools. 
        All forecasts are statistical estimates based on historical data and do not constitute investment advice. 
        Past performance does not guarantee future results. Users must make their own informed investment decisions. 
        Models may be experimental and have not been validated for live trading.
      </p>
    </div>
  );
}

// ============================================================
// Tab Component
// ============================================================
interface TabProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabProps) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === tab.id
              ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Button
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/50 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue-dim)]',
    secondary: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-hover)]',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
    danger: 'bg-[var(--color-negative-dim)] text-[var(--color-negative)] hover:bg-[var(--color-negative)]/20',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ============================================================
// Change Indicator
// ============================================================
export function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) return <TrendingUp size={14} className="text-[var(--color-positive)]" />;
  if (value < 0) return <TrendingDown size={14} className="text-[var(--color-negative)]" />;
  return <Minus size={14} className="text-[var(--color-text-muted)]" />;
}
