// ============================================================
// Investo Connection Status Indicator
// ============================================================
// Shows the current status of the market data connection.
// Used on dashboard and settings pages.
// ============================================================

import React, { useState, useEffect } from 'react';
import { checkInvestoHealth } from '../../services/investoClient';
import { Cloud, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export function InvestoConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'not_configured' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      const health = await checkInvestoHealth();
      if (health.ok && health.investoConfigured) {
        setStatus('connected');
      } else if (health.ok && !health.investoConfigured) {
        setStatus('not_configured');
      } else {
        setStatus('error');
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setStatus('error');
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  const statusConfig = {
    checking: {
      icon: <Loader2 size={14} className="animate-spin" />,
      color: 'text-[var(--color-text-muted)]',
      bgColor: 'bg-[var(--color-bg-tertiary)]',
      label: 'Checking connection...',
    },
    connected: {
      icon: <CheckCircle size={14} />,
      color: 'text-[var(--color-positive)]',
      bgColor: 'bg-[var(--color-positive-dim)]',
      label: 'Market data connected',
    },
    not_configured: {
      icon: <AlertCircle size={14} />,
      color: 'text-[var(--color-warning)]',
      bgColor: 'bg-[var(--color-warning-dim)]',
      label: 'API Key Not Configured',
    },
    error: {
      icon: <XCircle size={14} />,
      color: 'text-[var(--color-negative)]',
      bgColor: 'bg-[var(--color-negative-dim)]',
      label: 'Connection Failed',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
      <span className={config.color}>{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      {lastChecked && status !== 'checking' && (
        <span className="text-[10px] text-[var(--color-text-muted)]">
          · {lastChecked}
        </span>
      )}
    </div>
  );
}
