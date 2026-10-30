// ============================================================
// Settings Page
// ============================================================
import React, { useEffect, useState } from 'react';
import { useAppState } from '../../store/AppContext';
import { Disclaimer } from '../common';
import { checkInvestoHealth } from '../../services/investoClient';
import { Settings as SettingsIcon, Shield, Database, Globe, Key, Loader2, CheckCircle, XCircle } from 'lucide-react';

function InvestoStatus() {
  const [status, setStatus] = useState<'checking' | 'configured' | 'not_configured' | 'error'>('checking');

  useEffect(() => {
    checkInvestoHealth().then(health => {
      if (health.ok && health.investoConfigured) {
        setStatus('configured');
      } else if (health.ok && !health.investoConfigured) {
        setStatus('not_configured');
      } else {
        setStatus('error');
      }
    }).catch(() => setStatus('error'));
  }, []);

  if (status === 'checking') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] font-bold flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" />
        CHECKING
      </span>
    );
  }

  if (status === 'configured') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold flex items-center gap-1">
        <CheckCircle size={10} />
        CONFIGURED
      </span>
    );
  }

  if (status === 'not_configured') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-bold flex items-center gap-1">
        <XCircle size={10} />
        NOT CONFIGURED
      </span>
    );
  }

  return (
    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-negative-dim)] text-[var(--color-negative)] font-bold flex items-center gap-1">
      <XCircle size={10} />
      SERVER OFFLINE
    </span>
  );
}

export function SettingsPage() {
  const { state, dispatch } = useAppState();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* General Settings */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon size={16} className="text-[var(--color-accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">General Settings</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Display Currency</label>
            <select
              value={state.settings.currency}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { currency: e.target.value } })}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Default Forecast Horizon</label>
            <select
              value={state.settings.defaultHorizon}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultHorizon: Number(e.target.value) } })}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value={1}>1 Session</option>
              <option value={5}>5 Sessions</option>
              <option value={20}>20 Sessions</option>
              <option value={60}>60 Sessions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Provider */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-[var(--color-accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Data Provider Configuration</h3>
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">CSV Import</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Import data from CSV files. Always available.</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold">ACTIVE</span>
            </div>
          </div>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Synthetic Demo Data</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Randomly generated sample data removed from UI. CSV import and Investo API only.</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] font-bold">REMOVED</span>
            </div>
          </div>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Investo Data API (NGX)</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Real Nigerian Exchange data via secure server proxy. API key stored server-side only.
                </p>
              </div>
              <InvestoStatus />
            </div>
          </div>
          <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
            <p className="text-[11px] text-[var(--color-text-secondary)] font-semibold mb-1">How to configure Investo:</p>
            <ol className="text-[11px] text-[var(--color-text-muted)] space-y-1 list-decimal list-inside">
              <li>Get a free API key at <a href="https://investo.ng/developers/keys" target="_blank" rel="noopener" className="text-[var(--color-accent-blue)] hover:underline">investo.ng/developers/keys</a></li>
              <li>Copy <code className="px-1 py-0.5 bg-[var(--color-bg-secondary)] rounded text-[10px]">.env.example</code> to <code className="px-1 py-0.5 bg-[var(--color-bg-secondary)] rounded text-[10px]">.env</code></li>
              <li>Add your key: <code className="px-1 py-0.5 bg-[var(--color-bg-secondary)] rounded text-[10px]">INVESTO_API_KEY=inv_...</code></li>
              <li>Start the server: <code className="px-1 py-0.5 bg-[var(--color-bg-secondary)] rounded text-[10px]">node server/index.js</code></li>
            </ol>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
              Free tier: 1,000 requests/day · End-of-day data · Attribution required: "Data: Investo — investo.ng"
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[var(--color-accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Security & Privacy</h3>
        </div>
        <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
          <p>• All data processing occurs locally in your browser</p>
          <p>• No data is sent to external servers</p>
          <p>• API keys (when configured) are stored in browser local storage only</p>
          <p>• No analytics or tracking scripts are included</p>
          <p>• Imported datasets remain on your device</p>
        </div>
      </div>

      {/* About */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-[var(--color-accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">About PREDICTA</h3>
        </div>
        <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
          <p><strong className="text-[var(--color-text-primary)]">Version:</strong> 0.1.0 MVP</p>
          <p><strong className="text-[var(--color-text-primary)]">Category:</strong> Quantitative Financial Research Platform</p>
          <p><strong className="text-[var(--color-text-primary)]">Models:</strong> Persistence, Historical Average, Linear Regression, Ridge Regression, Gradient Boosting</p>
          <p><strong className="text-[var(--color-text-primary)]">Evaluation:</strong> Walk-forward backtesting with chronological train/test separation</p>
          <p><strong className="text-[var(--color-text-primary)]">Architecture:</strong> React + TypeScript frontend with client-side computation engine</p>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
