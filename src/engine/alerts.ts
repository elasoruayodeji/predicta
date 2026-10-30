// ============================================================
// Alerts System Engine
// ============================================================

export type AlertType = 'price_above' | 'price_below' | 'volume_spike' | 'percent_change' | 'custom';

export interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  condition: {
    threshold?: number;
    percent?: number;
    message?: string;
  };
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  lastChecked?: string;
}

export interface AlertTrigger {
  alertId: string;
  symbol: string;
  currentValue: number;
  threshold: number;
  message: string;
  triggeredAt: string;
}

const STORAGE_KEY = 'predicta_alerts';

// Load alerts from localStorage
export function loadAlerts(): Alert[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save alerts to localStorage
export function saveAlerts(alerts: Alert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Failed to save alerts:', error);
  }
}

// Create a new alert
export function createAlert(
  symbol: string,
  type: AlertType,
  condition: Alert['condition']
): Alert {
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    symbol,
    type,
    condition,
    active: true,
    triggered: false,
    createdAt: new Date().toISOString(),
  };
}

// Check if an alert should be triggered
export function checkAlert(
  alert: Alert,
  currentPrice: number,
  currentVolume: number,
  previousPrice?: number
): AlertTrigger | null {
  if (!alert.active || alert.triggered) {
    return null;
  }

  const now = new Date().toISOString();

  switch (alert.type) {
    case 'price_above':
      if (alert.condition.threshold && currentPrice >= alert.condition.threshold) {
        return {
          alertId: alert.id,
          symbol: alert.symbol,
          currentValue: currentPrice,
          threshold: alert.condition.threshold,
          message: `${alert.symbol} price is above ₦${alert.condition.threshold.toLocaleString()} (currently ₦${currentPrice.toLocaleString()})`,
          triggeredAt: now,
        };
      }
      break;

    case 'price_below':
      if (alert.condition.threshold && currentPrice <= alert.condition.threshold) {
        return {
          alertId: alert.id,
          symbol: alert.symbol,
          currentValue: currentPrice,
          threshold: alert.condition.threshold,
          message: `${alert.symbol} price is below ₦${alert.condition.threshold.toLocaleString()} (currently ₦${currentPrice.toLocaleString()})`,
          triggeredAt: now,
        };
      }
      break;

    case 'volume_spike':
      if (alert.condition.threshold && currentVolume >= alert.condition.threshold) {
        return {
          alertId: alert.id,
          symbol: alert.symbol,
          currentValue: currentVolume,
          threshold: alert.condition.threshold,
          message: `${alert.symbol} volume spike detected (${currentVolume.toLocaleString()} shares)`,
          triggeredAt: now,
        };
      }
      break;

    case 'percent_change':
      if (previousPrice && alert.condition.percent) {
        const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
        if (Math.abs(changePercent) >= alert.condition.percent) {
          const direction = changePercent > 0 ? 'up' : 'down';
          return {
            alertId: alert.id,
            symbol: alert.symbol,
            currentValue: changePercent,
            threshold: alert.condition.percent,
            message: `${alert.symbol} moved ${direction} ${Math.abs(changePercent).toFixed(2)}% (threshold: ${alert.condition.percent}%)`,
            triggeredAt: now,
          };
        }
      }
      break;

    case 'custom':
      // Custom alerts are manually triggered
      break;
  }

  return null;
}

// Check all alerts for a given stock
export function checkAllAlerts(
  alerts: Alert[],
  symbol: string,
  currentPrice: number,
  currentVolume: number,
  previousPrice?: number
): AlertTrigger[] {
  const triggers: AlertTrigger[] = [];

  alerts.forEach(alert => {
    if (alert.symbol === symbol) {
      const trigger = checkAlert(alert, currentPrice, currentVolume, previousPrice);
      if (trigger) {
        triggers.push(trigger);
      }
    }
  });

  return triggers;
}

// Mark alert as triggered
export function markAlertTriggered(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map(alert => {
    if (alert.id === alertId) {
      return {
        ...alert,
        triggered: true,
        triggeredAt: new Date().toISOString(),
      };
    }
    return alert;
  });
}

// Delete an alert
export function deleteAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.filter(alert => alert.id !== alertId);
}

// Toggle alert active state
export function toggleAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map(alert => {
    if (alert.id === alertId) {
      return {
        ...alert,
        active: !alert.active,
      };
    }
    return alert;
  });
}

// Get alerts for a specific symbol
export function getAlertsForSymbol(alerts: Alert[], symbol: string): Alert[] {
  return alerts.filter(alert => alert.symbol === symbol);
}

// Get triggered alerts
export function getTriggeredAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter(alert => alert.triggered);
}

// Get active alerts
export function getActiveAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter(alert => alert.active && !alert.triggered);
}

// Reset triggered alert
export function resetAlert(alerts: Alert[], alertId: string): Alert[] {
  return alerts.map(alert => {
    if (alert.id === alertId) {
      return {
        ...alert,
        triggered: false,
        triggeredAt: undefined,
      };
    }
    return alert;
  });
}

// Format alert type for display
export function formatAlertType(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    'price_above': 'Price Above',
    'price_below': 'Price Below',
    'volume_spike': 'Volume Spike',
    'percent_change': 'Percent Change',
    'custom': 'Custom',
  };
  return labels[type] || type;
}

// Format alert condition for display
export function formatAlertCondition(alert: Alert): string {
  switch (alert.type) {
    case 'price_above':
      return `≥ ₦${alert.condition.threshold?.toLocaleString()}`;
    case 'price_below':
      return `≤ ₦${alert.condition.threshold?.toLocaleString()}`;
    case 'volume_spike':
      return `≥ ${alert.condition.threshold?.toLocaleString()} shares`;
    case 'percent_change':
      return `±${alert.condition.percent}%`;
    case 'custom':
      return alert.condition.message || 'Custom condition';
    default:
      return '';
  }
}
