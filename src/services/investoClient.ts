// ============================================================
// Investo API Client (Frontend)
// ============================================================
// Talks to the local proxy server at /api/investo/*.
// The proxy holds the API key server-side — this client never sees it.
// ============================================================

export interface InvestoStock {
  symbol: string;
  name: string;
  sector: string;
  market: string;
  price: number;
  previous_close: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  shares_outstanding: number;
  trade_date: string;
  has_fundamentals: boolean;
  has_verdict: boolean;
}

export interface InvestoPriceBar {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number;
}

export interface InvestoIndex {
  code: string;
  slug: string;
  name: string;
  description: string;
  level: number;
  change_percent: number;
  week_change_percent: number;
  month_change_percent: number;
  year_change_percent: number;
  inception_change_percent: number;
  series_points: number;
  as_of: string;
}

export interface InvestoSignal {
  id: string;
  symbol: string;
  type: string;
  headline: string;
  detail: string;
  magnitude: number;
  direction: 'up' | 'down';
  materiality: number;
  detected_at: string;
  share_url: string;
}

export interface InvestoResponse<T> {
  ok: true;
  data: T;
  meta: {
    generated_at?: string;
    attribution: string;
    count?: number;
    symbol?: string;
    first?: string;
    last?: string;
    source?: string;
    next_cursor?: string;
    proxied_at: string;
  };
}

export interface InvestoError {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type InvestoResult<T> = InvestoResponse<T> | InvestoError;

// Cache for client-side deduplication (avoid re-fetching same data within TTL)
const clientCache = new Map<string, { data: any; cachedAt: number }>();
const CLIENT_CACHE_TTL = 60 * 1000; // 1 minute client-side cache

async function fetchFromProxy<T>(path: string, forceRefresh = false): Promise<InvestoResult<T>> {
  const cacheKey = path;
  
  // Check client cache
  if (!forceRefresh) {
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CLIENT_CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(path, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const data = await res.json();
    
    // Cache successful responses
    if (data.ok) {
      clientCache.set(cacheKey, { data, cachedAt: Date.now() });
    }
    
    return data;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'network_error',
        message: 'Could not connect to the PREDICTA server. Is it running?',
      },
    };
  }
}

// -------------------------------------------------------------
// Public API
// -------------------------------------------------------------

export async function fetchInvestoStocks(forceRefresh = false): Promise<InvestoResult<InvestoStock[]>> {
  return fetchFromProxy<InvestoStock[]>('/api/investo/stocks', forceRefresh);
}

export async function fetchInvestoPrices(
  symbol: string,
  options: { from?: string; to?: string; interval?: string } = {},
  forceRefresh = false
): Promise<InvestoResult<InvestoPriceBar[]>> {
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.interval) params.set('interval', options.interval);
  
  const qs = params.toString();
  const path = `/api/investo/prices/${encodeURIComponent(symbol)}${qs ? '?' + qs : ''}`;
  return fetchFromProxy<InvestoPriceBar[]>(path, forceRefresh);
}

export async function fetchInvestoIndices(forceRefresh = false): Promise<InvestoResult<InvestoIndex[]>> {
  return fetchFromProxy<InvestoIndex[]>('/api/investo/indices', forceRefresh);
}

export async function fetchInvestoSignals(
  options: { type?: string; symbol?: string; since?: string; limit?: number } = {},
  forceRefresh = false
): Promise<InvestoResult<InvestoSignal[]>> {
  const params = new URLSearchParams();
  if (options.type) params.set('type', options.type);
  if (options.symbol) params.set('symbol', options.symbol);
  if (options.since) params.set('since', options.since);
  if (options.limit) params.set('limit', String(options.limit));
  
  const qs = params.toString();
  const path = `/api/investo/signals${qs ? '?' + qs : ''}`;
  return fetchFromProxy<InvestoSignal[]>(path, forceRefresh);
}

export async function checkInvestoHealth(): Promise<{ ok: boolean; investoConfigured: boolean; serverTime: string }> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch {
    return { ok: false, investoConfigured: false, serverTime: new Date().toISOString() };
  }
}

// Clear client cache (useful after manual refresh)
export function clearInvestoClientCache() {
  clientCache.clear();
}
