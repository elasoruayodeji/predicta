// ============================================================
// PREDICTA — Investo API Proxy Server
// ============================================================
// A minimal Express server that:
//   1. Serves the built static site from ./dist
//   2. Proxies /api/investo/* to https://investo.ng/api/v1/*
//   3. Holds the API key in process.env.INVESTO_API_KEY (never in browser)
//   4. Applies brief in-memory caching within Investo's "transient caching" allowance
//   5. Never exposes the API key or raw upstream errors to the browser
//
// Run:  INVESTO_API_KEY=inv_... node server/index.js
// Then open http://localhost:3000
// ============================================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const INVESTOPROXY_TARGET = 'https://investo.ng/api/v1';

// -------------------------------------------------------------
// Configuration
// -------------------------------------------------------------
const API_KEY = process.env.INVESTO_API_KEY;
const HAS_KEY = typeof API_KEY === 'string' && API_KEY.length > 0;

// Cache TTLs (milliseconds) — within Investo's "transient caching" allowance.
// Stock list and indices change once per day after market close.
// Prices are end-of-day; 5 min cache is generous but safe for personal use.
const CACHE_TTL = {
  stocks: 15 * 60 * 1000,   // 15 minutes
  indices: 15 * 60 * 1000,  // 15 minutes
  prices: 5 * 60 * 1000,    // 5 minutes
  default: 2 * 60 * 1000,   // 2 minutes
};

// Simple in-memory cache. Key = full upstream URL. Value = { body, cachedAt }
const cache = new Map();
const MAX_CACHE_ENTRIES = 200;

function cacheKeyFor(url) {
  return url;
}

function getCache(key, ttl) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.body;
}

function setCache(key, body) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { body, cachedAt: Date.now() });
}

// -------------------------------------------------------------
// Security headers
// -------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// -------------------------------------------------------------
// Health check — does NOT require an API key
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    investoConfigured: HAS_KEY,
    serverTime: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// Investo proxy — /api/investo/*
// -------------------------------------------------------------
// Supported routes (mirrors the three endpoints the brief requires):
//   GET /api/investo/stocks          -> /api/v1/stocks
//   GET /api/investo/prices/:symbol  -> /api/v1/prices/:symbol
//   GET /api/investo/indices         -> /api/v1/indices
//
// Additional useful endpoints are also proxied:
//   GET /api/investo/signals         -> /api/v1/signals
//
// Any other path returns 404. We intentionally do NOT create a generic
// "proxy anything" route — that would be a wider attack surface.
// -------------------------------------------------------------

const ALLOWED_ROUTES = [
  { method: 'GET', pattern: /^\/stocks$/, upstream: '/stocks', cacheTtl: CACHE_TTL.stocks },
  { method: 'GET', pattern: /^\/prices\/([A-Za-z0-9.\-]+)$/, upstream: '/prices/:symbol', cacheTtl: CACHE_TTL.prices },
  { method: 'GET', pattern: /^\/indices$/, upstream: '/indices', cacheTtl: CACHE_TTL.indices },
  { method: 'GET', pattern: /^\/signals$/, upstream: '/signals', cacheTtl: CACHE_TTL.default },
];

function classifyRoute(subPath) {
  for (const route of ALLOWED_ROUTES) {
    const match = subPath.match(route.pattern);
    if (match) return { route, match };
  }
  return null;
}

function ttlFor(upstreamPath) {
  if (upstreamPath.startsWith('/stocks')) return CACHE_TTL.stocks;
  if (upstreamPath.startsWith('/prices')) return CACHE_TTL.prices;
  if (upstreamPath.startsWith('/indices')) return CACHE_TTL.indices;
  return CACHE_TTL.default;
}

// Validate and sanitize a symbol from the URL. NGX symbols are uppercase
// alphanumeric, occasionally with dots or hyphens. Reject anything else.
function isValidSymbol(symbol) {
  return /^[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(symbol);
}

app.all('/api/investo/*', async (req, res) => {
  // 1. Check API key presence
  if (!HAS_KEY) {
    return res.status(503).json({
      ok: false,
      error: {
        code: 'investo_not_configured',
        message: 'Investo API key is not configured on the server. Set INVESTO_API_KEY environment variable.',
      },
    });
  }

  // 2. Only GET is allowed
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: { code: 'method_not_allowed', message: 'Only GET requests are supported.' },
    });
  }

  // 3. Extract sub-path after /api/investo
  const subPath = req.path.replace(/^\/api\/investo/, '') || '/';
  const classified = classifyRoute(subPath);

  if (!classified) {
    return res.status(404).json({
      ok: false,
      error: { code: 'unknown_endpoint', message: 'This Investo endpoint is not exposed by the proxy.' },
    });
  }

  const { route, match } = classified;

  // 4. Build upstream URL
  let upstreamPath = route.upstream;
  if (upstreamPath.includes(':symbol')) {
    const symbol = match[1];
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        ok: false,
        error: { code: 'invalid_symbol', message: 'Stock symbol contains invalid characters.' },
      });
    }
    upstreamPath = upstreamPath.replace(':symbol', encodeURIComponent(symbol));
  }

  // Pass through safe query parameters (from, to, interval, code, type, limit, since, provenance)
  const ALLOWED_QUERY_KEYS = ['from', 'to', 'interval', 'code', 'type', 'limit', 'since', 'provenance', 'cursor', 'include', 'basis', 'symbol', 'issuer_type', 'bond_type', 'currency', 'outstanding'];
  const queryParams = new URLSearchParams();
  for (const key of ALLOWED_QUERY_KEYS) {
    const value = req.query[key];
    if (value !== undefined && value !== null && value !== '') {
      // Validate date params
      if ((key === 'from' || key === 'to' || key === 'since') && !/^\d{4}-\d{2}-\d{2}(T[\d:]+Z?)?$/.test(String(value))) {
        return res.status(400).json({
          ok: false,
          error: { code: 'invalid_date', message: `Invalid date format for ${key}. Use YYYY-MM-DD.` },
        });
      }
      // Validate numeric params
      if (key === 'limit') {
        const n = parseInt(String(value), 10);
        if (isNaN(n) || n < 1 || n > 100) {
          return res.status(400).json({
            ok: false,
            error: { code: 'invalid_limit', message: 'limit must be between 1 and 100.' },
          });
        }
      }
      queryParams.set(key, String(value));
    }
  }

  const qs = queryParams.toString();
  const upstreamUrl = `${INVESTOPROXY_TARGET}${upstreamPath}${qs ? '?' + qs : ''}`;

  // 5. Check cache
  const cKey = cacheKeyFor(upstreamUrl);
  const ttl = ttlFor(upstreamPath);
  const cached = getCache(cKey, ttl);
  if (cached) {
    return res.json(cached);
  }

  // 6. Call Investo
  let upstreamRes;
  let timeoutId;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'PREDICTA/0.2 (personal research tool)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return res.status(504).json({
      ok: false,
      error: {
        code: isTimeout ? 'upstream_timeout' : 'upstream_unreachable',
        message: isTimeout
          ? 'Investo API did not respond in time.'
          : 'Could not reach the Investo API. Check your network connection.',
      },
    });
  }

  // 7. Handle HTTP errors — map to safe client-facing messages
  if (!upstreamRes.ok) {
    let errorBody = null;
    try {
      errorBody = await upstreamRes.json();
    } catch {
      // Not JSON — ignore
    }

    const upstreamCode = errorBody?.error?.code;
    const status = upstreamRes.status;

    // Map Investo error codes to safe client messages
    const SAFE_ERROR_MAP = {
      401: { code: 'auth_failed', message: 'Investo API authentication failed. The server API key may be invalid.' },
      403: { code: 'auth_revoked', message: 'Investo API key has been revoked.' },
      404: { code: 'not_found', message: 'The requested symbol or resource was not found on Investo.' },
      429: { code: 'rate_limited', message: 'Investo API rate limit exceeded. Try again later (quota resets at midnight UTC).' },
    };

    const safeError = SAFE_ERROR_MAP[status] || {
      code: 'upstream_error',
      message: `Investo API returned an error (HTTP ${status}).`,
    };

    // If Investo gave us a known code, prefer it but keep message safe
    if (upstreamCode === 'missing_api_key' || upstreamCode === 'invalid_api_key') {
      safeError.code = 'auth_failed';
    } else if (upstreamCode === 'revoked_api_key') {
      safeError.code = 'auth_revoked';
    } else if (upstreamCode === 'unknown_symbol') {
      safeError.code = 'not_found';
    } else if (upstreamCode === 'rate_limited') {
      safeError.code = 'rate_limited';
    }

    return res.status(status >= 400 && status < 600 ? status : 502).json({
      ok: false,
      error: safeError,
    });
  }

  // 8. Parse JSON response
  let parsed;
  try {
    parsed = await upstreamRes.json();
  } catch {
    return res.status(502).json({
      ok: false,
      error: { code: 'invalid_json', message: 'Investo returned a non-JSON response.' },
    });
  }

  // 9. Validate envelope
  if (!parsed || typeof parsed !== 'object' || parsed.ok !== true) {
    return res.status(502).json({
      ok: false,
      error: { code: 'invalid_envelope', message: 'Investo response did not match expected envelope.' },
    });
  }

  // 10. Build sanitized response — keep data + meta, strip anything sensitive
  // The Investo envelope is { ok, data, meta }. meta contains generated_at and
  // attribution, which we preserve. We do NOT forward any upstream headers that
  // could leak information.
  const sanitized = {
    ok: true,
    data: parsed.data,
    meta: {
      generated_at: parsed.meta?.generated_at,
      attribution: parsed.meta?.attribution || 'Investo — investo.ng',
      count: parsed.meta?.count,
      // Preserve useful meta fields per endpoint
      ...(parsed.meta?.symbol ? { symbol: parsed.meta.symbol } : {}),
      ...(parsed.meta?.first ? { first: parsed.meta.first } : {}),
      ...(parsed.meta?.last ? { last: parsed.meta.last } : {}),
      ...(parsed.meta?.source ? { source: parsed.meta.source } : {}),
      ...(parsed.meta?.next_cursor ? { next_cursor: parsed.meta.next_cursor } : {}),
      // Mark that this came through the PREDICTA proxy
      proxied_at: new Date().toISOString(),
    },
  };

  // 11. Cache and return
  setCache(cKey, sanitized);
  return res.json(sanitized);
});

// -------------------------------------------------------------
// Static files — serve the built React app
// -------------------------------------------------------------
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: true,
}));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// -------------------------------------------------------------
// Start
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log('');
  console.log('  PREDICTA server');
  console.log('  ─────────────────────────────────────');
  console.log(`  Local:     http://localhost:${PORT}`);
  console.log(`  Investo:   ${HAS_KEY ? '✓ configured' : '✗ NOT configured (set INVESTO_API_KEY)'}`);
  console.log(`  Static:    ${distPath}`);
  console.log('');
  if (!HAS_KEY) {
    console.log('  To enable Investo data, set the environment variable:');
    console.log('    INVESTO_API_KEY=inv_YOUR_KEY node server/index.js');
    console.log('');
    console.log('  CSV import and synthetic demo mode still work without it.');
    console.log('');
  }
});
