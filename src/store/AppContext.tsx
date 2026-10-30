// ============================================================
// Application State Management with Persistence
// ============================================================
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { StockDataset, WatchlistItem, AppSettings, ResearchReport, AnomalyEvent } from '../types';
import {
  saveDatasets, loadDatasets,
  saveWatchlist, loadWatchlist,
  saveSettings, loadSettings,
  saveReports, loadReports,
  saveAnomalies, loadAnomalies,
} from '../utils/storage';

interface AppState {
  datasets: Map<string, StockDataset>;
  activeSymbol: string | null;
  watchlist: WatchlistItem[];
  reports: ResearchReport[];
  settings: AppSettings;
  anomalies: Map<string, AnomalyEvent[]>;
  storageLoaded: boolean;
}

type Action =
  | { type: 'SET_DATASET'; payload: StockDataset }
  | { type: 'REMOVE_DATASET'; payload: string }
  | { type: 'SET_ACTIVE_SYMBOL'; payload: string | null }
  | { type: 'ADD_TO_WATCHLIST'; payload: WatchlistItem }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'UPDATE_WATCHLIST'; payload: WatchlistItem }
  | { type: 'ADD_REPORT'; payload: ResearchReport }
  | { type: 'REMOVE_REPORT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_ANOMALIES'; payload: { symbol: string; anomalies: AnomalyEvent[] } }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<AppState> };

const defaultSettings: AppSettings = {
  // Profile
  userName: '',
  userEmail: '',
  
  // Preferences
  currency: 'NGN',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  timezone: 'Africa/Lagos',
  numberFormat: 'standard',
  defaultHorizon: 5,
  riskTolerance: 'moderate',
  
  // Appearance
  theme: 'dark',
  compactMode: false,
  
  // Market Preferences
  defaultMarket: 'NGX',
  preferredIndices: ['ASI', 'NGX-30'],
  preferredSectors: [],
  
  // Notifications
  enablePriceAlerts: true,
  enableMarketUpdates: true,
  enableDividendNotifications: true,
  enableAnnouncementNotifications: true,
  enableResearchNotifications: true,
  
  // Data
  dataProvider: null,
  apiKeyConfigured: false,
  autoRefresh: false,
  
  // Privacy
  shareAnonymousData: false,
  enableAnalytics: false,
};

const initialState: AppState = {
  datasets: new Map(),
  activeSymbol: null,
  watchlist: [],
  reports: [],
  settings: defaultSettings,
  anomalies: new Map(),
  storageLoaded: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DATASET': {
      const newDatasets = new Map(state.datasets);
      newDatasets.set(action.payload.info.symbol, action.payload);
      return { ...state, datasets: newDatasets };
    }
    case 'REMOVE_DATASET': {
      const newDatasets = new Map(state.datasets);
      newDatasets.delete(action.payload);
      return {
        ...state,
        datasets: newDatasets,
        activeSymbol: state.activeSymbol === action.payload ? null : state.activeSymbol,
      };
    }
    case 'SET_ACTIVE_SYMBOL':
      return { ...state, activeSymbol: action.payload };
    case 'ADD_TO_WATCHLIST': {
      if (state.watchlist.some(w => w.symbol === action.payload.symbol)) return state;
      return { ...state, watchlist: [...state.watchlist, action.payload] };
    }
    case 'REMOVE_FROM_WATCHLIST':
      return { ...state, watchlist: state.watchlist.filter(w => w.symbol !== action.payload) };
    case 'UPDATE_WATCHLIST':
      return {
        ...state,
        watchlist: state.watchlist.map(w => w.symbol === action.payload.symbol ? action.payload : w),
      };
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'REMOVE_REPORT':
      return { ...state, reports: state.reports.filter(r => r.id !== action.payload) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_ANOMALIES': {
      const newAnomalies = new Map(state.anomalies);
      newAnomalies.set(action.payload.symbol, action.payload.anomalies);
      return { ...state, anomalies: newAnomalies };
    }
    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.payload, storageLoaded: true };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedDatasets = loadDatasets();
    const loadedWatchlist = loadWatchlist();
    const loadedSettings = loadSettings(defaultSettings);
    const loadedReports = loadReports();
    const loadedAnomalies = loadAnomalies();

    dispatch({
      type: 'LOAD_FROM_STORAGE',
      payload: {
        datasets: loadedDatasets,
        watchlist: loadedWatchlist,
        settings: loadedSettings,
        reports: loadedReports,
        anomalies: loadedAnomalies,
      },
    });
  }, []);

  // Persist to localStorage on state changes (after initial load)
  useEffect(() => {
    if (!state.storageLoaded) return;

    saveDatasets(state.datasets);
    saveWatchlist(state.watchlist);
    saveSettings(state.settings);
    saveReports(state.reports);
    saveAnomalies(state.anomalies);
  }, [state.datasets, state.watchlist, state.settings, state.reports, state.anomalies, state.storageLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
}

export function useDataset(symbol: string | null): StockDataset | null {
  const { state } = useAppState();
  if (!symbol) return null;
  return state.datasets.get(symbol) ?? null;
}

export function useAllDatasets(): StockDataset[] {
  const { state } = useAppState();
  return Array.from(state.datasets.values());
}
