// ============================================================
// Investo Connection Status Indicator
// ============================================================
// Shows the current status of the market data connection.
// Used on dashboard and settings pages.
// ============================================================

import React, { useState, useEffect } from 'react';
import { checkInvestoHealth, fetchInvestoIndices } from '../../services/investoClient';
import { Cloud, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function InvestoConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'not_configured' | 'error' | 'no_data'>('checking');
  const [lastChecked, setLastChecked] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus('checking');
    try {
      // First check server health
      const health = await checkInvestoHealth();
      if (!health.ok) {
        setStatus('error');
        setLastChecked(new Date().toLocaleTimeString());
        return;
      }

      if (!health.investoConfigured) {
        setStatus('not_configured');
        setLastChecked(new Date().toLocaleTimeString());
        return;
      }

      // Then verify actual market data availability
      const indicesResult = await fetchInvestoIndices();
      if (indicesResult.ok && indicesResult.data && indicesResult.data.length > 0) {
        setStatus('connected');
      } else {
        setStatus('no_data');
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setStatus('error');
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkStatus();
    setIsRefreshing(false);
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
    no_data: {
      icon: <AlertCircle size={14} />,
      color: 'text-[var(--color-warning)]',
      bgColor: 'bg-[var(--color-warning-dim)]',
      label: 'No Market Data Available',
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
      {status !== 'checking' && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-1 p-1 rounded hover:bg-black/10 transition-colors disabled:opacity-50"
          title="Refresh connection status"
        >
          <RefreshCw size={12} className={`${config.color} ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
