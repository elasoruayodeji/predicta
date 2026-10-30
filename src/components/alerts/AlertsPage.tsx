// ============================================================
// Alerts Management Page
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAppState, useAllDatasets } from '../../store/AppContext';
import { 
  Alert, 
  AlertType, 
  loadAlerts, 
  saveAlerts, 
  createAlert, 
  deleteAlert, 
  toggleAlert,
  resetAlert,
  formatAlertType,
  formatAlertCondition,
  getActiveAlerts,
  getTriggeredAlerts
} from '../../engine/alerts';
import { Button, EmptyState, MetricCard } from '../common';
import { formatPrice, formatDate } from '../../utils/formatters';
import { 
  Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle,
  TrendingUp, TrendingDown, Activity, Filter, CheckCircle, XCircle,
  RefreshCw
} from 'lucide-react';

interface AlertsPageProps {
  onNavigate: (page: string) => void;
  onSelectStock: (symbol: string) => void;
}

export function AlertsPage({ onNavigate, onSelectStock }: AlertsPageProps) {
  const { state } = useAppState();
  const datasets = useAllDatasets();
  const [alerts, setAlerts] = useState<Alert[]>(() => loadAlerts());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered'>('all');

  // Save alerts whenever they change
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  // Summary stats
  const stats = {
    total: alerts.length,
    active: getActiveAlerts(alerts).length,
    triggered: getTriggeredAlerts(alerts).length,
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'active') return alert.active && !alert.triggered;
    if (filterStatus === 'triggered') return alert.triggered;
    return true;
  });

  // Handle create alert
  const handleCreateAlert = (symbol: string, type: AlertType, condition: Alert['condition']) => {
    const newAlert = createAlert(symbol, type, condition);
    setAlerts([newAlert, ...alerts]);
    setShowCreateModal(false);
  };

  // Handle delete alert
  const handleDeleteAlert = (alertId: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      setAlerts(deleteAlert(alerts, alertId));
    }
  };

  // Handle toggle alert
  const handleToggleAlert = (alertId: string) => {
    setAlerts(toggleAlert(alerts, alertId));
  };

  // Handle reset alert
  const handleResetAlert = (alertId: string) => {
    setAlerts(resetAlert(alerts, alertId));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Alerts</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Monitor price movements, volume spikes, and market events
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Create Alert
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Alerts"
          value={stats.total.toString()}
          icon={<Bell size={18} className="text-[var(--color-accent-blue)]" />}
        />
        <MetricCard
          label="Active Alerts"
          value={stats.active.toString()}
          icon={<CheckCircle size={18} className="text-[var(--color-positive)]" />}
          variant="positive"
        />
        <MetricCard
          label="Triggered"
          value={stats.triggered.toString()}
          icon={<AlertTriangle size={18} className="text-[var(--color-warning)]" />}
          variant="warning"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-[var(--color-text-muted)]" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
        >
          <option value="all">All Alerts</option>
          <option value="active">Active Only</option>
          <option value="triggered">Triggered Only</option>
        </select>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={alerts.length === 0 ? "No Alerts Created" : "No Alerts Match Filter"}
          description={
            alerts.length === 0
              ? "Create your first alert to start monitoring stocks."
              : "Try changing the filter to see more alerts."
          }
          action={
            alerts.length === 0 ? (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Create First Alert
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl">
          <div className="divide-y divide-[var(--color-border-primary)]">
            {filteredAlerts.map(alert => {
              const dataset = datasets.find(d => d.info.symbol === alert.symbol);
              const currentPrice = dataset?.prices[dataset.prices.length - 1]?.close;

              return (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-[var(--color-bg-hover)] transition-colors ${
                    alert.triggered ? 'bg-[var(--color-warning-dim)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="text-sm font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent-blue)]"
                          onClick={() => onSelectStock(alert.symbol)}
                        >
                          {alert.symbol}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          alert.triggered
                            ? 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]'
                            : alert.active
                            ? 'bg-[var(--color-positive-dim)] text-[var(--color-positive)]'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                        }`}>
                          {alert.triggered ? 'TRIGGERED' : alert.active ? 'ACTIVE' : 'PAUSED'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                          {formatAlertType(alert.type)}
                        </span>
                      </div>

                      <div className="text-sm text-[var(--color-text-secondary)] mb-1">
                        {formatAlertCondition(alert)}
                      </div>

                      {currentPrice && (
                        <div className="text-xs text-[var(--color-text-muted)]">
                          Current price: {formatPrice(currentPrice, 'NGN')}
                        </div>
                      )}

                      {alert.triggered && alert.triggeredAt && (
                        <div className="text-xs text-[var(--color-warning)] mt-1">
                          Triggered: {formatDate(alert.triggeredAt.split('T')[0])}
                        </div>
                      )}

                      <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                        Created: {formatDate(alert.createdAt.split('T')[0])}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.triggered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetAlert(alert.id)}
                          title="Reset alert"
                        >
                          <RefreshCw size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAlert(alert.id)}
                        title={alert.active ? 'Pause alert' : 'Activate alert'}
                      >
                        {alert.active ? (
                          <ToggleRight size={14} className="text-[var(--color-positive)]" />
                        ) : (
                          <ToggleLeft size={14} className="text-[var(--color-text-muted)]" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                        title="Delete alert"
                      >
                        <Trash2 size={14} className="text-[var(--color-negative)]" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <CreateAlertModal
          datasets={datasets}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAlert}
        />
      )}

      {/* Disclaimer */}
      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text-secondary)]">Note:</strong> Alerts are checked when you view stock data. 
          For real-time notifications, you would need to integrate with a notification service (email, SMS, push notifications). 
          Alerts are stored locally in your browser and are not synced across devices.
        </p>
      </div>
    </div>
  );
}

// Create Alert Modal Component
function CreateAlertModal({
  datasets,
  onClose,
  onCreate,
}: {
  datasets: any[];
  onClose: () => void;
  onCreate: (symbol: string, type: AlertType, condition: Alert['condition']) => void;
}) {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<AlertType>('price_above');
  const [threshold, setThreshold] = useState('');
  const [percent, setPercent] = useState('');

  const handleSubmit = () => {
    if (!symbol) {
      alert('Please select a stock');
      return;
    }

    let condition: Alert['condition'] = {};

    switch (type) {
      case 'price_above':
      case 'price_below':
      case 'volume_spike':
        if (!threshold) {
          alert('Please enter a threshold value');
          return;
        }
        condition.threshold = Number(threshold);
        break;
      case 'percent_change':
        if (!percent) {
          alert('Please enter a percentage value');
          return;
        }
        condition.percent = Number(percent);
        break;
    }

    onCreate(symbol, type, condition);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-5 w-full max-w-md">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Create Alert</h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Stock</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="">Select a stock...</option>
              {datasets.map(ds => (
                <option key={ds.info.symbol} value={ds.info.symbol}>
                  {ds.info.symbol} — {ds.info.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1">Alert Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            >
              <option value="price_above">Price Above</option>
              <option value="price_below">Price Below</option>
              <option value="volume_spike">Volume Spike</option>
              <option value="percent_change">Percent Change</option>
            </select>
          </div>

          {(type === 'price_above' || type === 'price_below' || type === 'volume_spike') && (
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">
                {type === 'volume_spike' ? 'Volume Threshold (shares)' : 'Price Threshold (₦)'}
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={type === 'volume_spike' ? 'e.g., 1000000' : 'e.g., 50.00'}
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
              />
            </div>
          )}

          {type === 'percent_change' && (
            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1">Percentage Change (%)</label>
              <input
                type="number"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                placeholder="e.g., 5"
                step="0.1"
                className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Triggers when price moves up or down by this percentage
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Create Alert</Button>
        </div>
      </div>
    </div>
  );
}
