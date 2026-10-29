// ============================================================
// Formatting Utilities
// ============================================================

export function formatPrice(value: number, currency: string = 'NGN'): string {
  if (isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(decimals) + 'B';
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(decimals) + 'M';
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(decimals) + 'K';
  return value.toFixed(decimals);
}

export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentPlain(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatVolume(value: number): string {
  if (isNaN(value) || value === 0) return '—';
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toFixed(0);
}

export function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-[var(--color-positive)]';
  if (value < 0) return 'text-[var(--color-negative)]';
  return 'text-[var(--color-text-secondary)]';
}

export function getChangeBgColor(value: number): string {
  if (value > 0) return 'bg-[var(--color-positive-dim)]';
  if (value < 0) return 'bg-[var(--color-negative-dim)]';
  return 'bg-[var(--color-bg-tertiary)]';
}

export function getQualityColor(score: string): string {
  switch (score) {
    case 'excellent': return 'text-[var(--color-positive)]';
    case 'good': return 'text-[var(--color-accent-blue)]';
    case 'fair': return 'text-[var(--color-warning)]';
    case 'poor': return 'text-[var(--color-negative)]';
    default: return 'text-[var(--color-text-secondary)]';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-[var(--color-negative)] bg-[var(--color-negative-dim)]';
    case 'high': return 'text-[var(--color-warning)] bg-[var(--color-warning-dim)]';
    case 'medium': return 'text-[var(--color-accent-blue)] bg-[var(--color-accent-blue-glow)]';
    case 'low': return 'text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)]';
    default: return 'text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)]';
  }
}
