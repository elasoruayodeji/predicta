// ============================================================
// PREDICTA Type Definitions
// ============================================================

export interface PriceRecord {
  date: string;          // ISO date string YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  dataSource: string;
  importedAt: string;
  recordCount: number;
  dateRange: { start: string; end: string };
}

export interface DataQualityReport {
  totalRecords: number;
  missingDates: string[];
  duplicateDates: string[];
  invalidPrices: number;
  negativeVolumes: number;
  zeroVolumeDays: number;
  staleDataDays: number;
  gapsLargerThan: { days: number; count: number }[];
  overallScore: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

export interface HistoricalStatistics {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  sharpeRatio: number | null;
  avgDailyReturn: number;
  bestDay: { date: string; return: number };
  worstDay: { date: string; return: number };
  positiveDays: number;
  negativeDays: number;
  avgVolume: number;
  medianVolume: number;
  skewness: number;
  kurtosis: number;
}

export interface MovingAverage {
  period: number;
  label: string;
  values: { date: string; value: number }[];
}

export interface ForecastResult {
  modelId: string;
  modelName: string;
  horizon: number;
  forecastDate: string;
  lastObservedPrice: number;
  lastObservedDate: string;
  estimatedReturn: number;
  estimatedPrice: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
  intervalNote: string; // Honest description of interval limitations
  metrics: ModelMetrics;
  status: 'valid' | 'experimental' | 'insufficient_data' | 'failed_validation';
  warnings: string[];
  trainedAt: string;
  trainingPeriod: { start: string; end: string };
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  directionalAccuracy: number;
  baselineImprovement: number;
  predictionIntervalCoverage: number;
  trainingTimeMs: number;
}

export interface ModelComparison {
  models: {
    modelId: string;
    modelName: string;
    metrics: ModelMetrics;
    status: 'valid' | 'experimental' | 'insufficient_data' | 'failed_validation';
  }[];
  evaluationPeriod: { start: string; end: string };
  baselineModelId: string;
  testDates: string[];
}

export interface AnomalyEvent {
  date: string;
  type: 'price_spike' | 'price_drop' | 'volume_spike' | 'volatility_spike' | 'pattern_break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  metric: string;
  value: number;
  threshold: number;
  reference: string;
  description: string;
}

export interface BacktestResult {
  modelId: string;
  modelName: string;
  folds: BacktestFold[];
  aggregateMetrics: ModelMetrics;
  evaluationWindow: { start: string; end: string };
  trainingWindowDays: number;
}

export interface BacktestFold {
  foldIndex: number;
  trainingStart: string;
  trainingEnd: string;
  testStart: string;
  testEnd: string;
  metrics: ModelMetrics;
}

export interface ResearchReport {
  id: string;
  stockSymbol: string;
  stockName: string;
  generatedAt: string;
  dataSource: string;
  analysisPeriod: { start: string; end: string };
  dataQuality: DataQualityReport;
  statistics: HistoricalStatistics;
  forecasts: ForecastResult[];
  modelComparison: ModelComparison | null;
  anomalies: AnomalyEvent[];
  limitations: string[];
  disclaimer: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  addedAt: string;
  lastPrice?: number;
  lastPriceDate?: string;
  priceChange?: number;
  latestForecast?: ForecastResult;
  anomalyCount: number;
}

export interface AppSettings {
  // Profile
  userName?: string;
  userEmail?: string;
  
  // Preferences
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
  numberFormat: 'standard' | 'compact';
  defaultHorizon: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  
  // Appearance
  theme: 'dark' | 'light' | 'system';
  compactMode: boolean;
  
  // Market Preferences
  defaultMarket: string;
  preferredIndices: string[];
  preferredSectors: string[];
  
  // Notifications
  enablePriceAlerts: boolean;
  enableMarketUpdates: boolean;
  enableDividendNotifications: boolean;
  enableAnnouncementNotifications: boolean;
  enableResearchNotifications: boolean;
  
  // Data
  dataProvider: string | null;
  apiKeyConfigured: boolean;
  autoRefresh: boolean;
  
  // Privacy
  shareAnonymousData: boolean;
  enableAnalytics: boolean;
}

export type ForecastHorizon = 1 | 5 | 20 | 60;

export type ModelType = 
  | 'persistence' 
  | 'historical_average' 
  | 'linear_regression' 
  | 'ridge_regression'
  | 'gradient_boosting';

export interface ModelDefinition {
  id: ModelType;
  name: string;
  description: string;
  category: 'baseline' | 'statistical' | 'machine_learning';
  supportedHorizons: ForecastHorizon[];
  minDataPoints: number;
}

export interface StockDataset {
  info: StockInfo;
  prices: PriceRecord[];
  quality: DataQualityReport;
  corporateActions?: import('../engine/corporateActions').CorporateAction[];
}

// Re-export corporate action types for convenience
export type { CorporateAction, CorporateActionType, DividendDetails, SplitDetails, BonusDetails, RightsDetails } from '../engine/corporateActions';
export type { LiquidityMetrics, LiquidityWarning } from '../engine/liquidity';
