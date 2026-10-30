// ============================================================
// PREDICTA — Investo API Proxy Server
// ============================================================

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const INVESTO_API_URL = 'https://investo.ng/api/v1';
const API_KEY = process.env.INVESTO_API_KEY?.trim();
const HAS_KEY = Boolean(API_KEY);

const DIST_PATH = path.join(__dirname, '..', 'dist');
const CACHE_MAX_ENTRIES = 200;

const CACHE_TTL = {
  stocks: 15 * 60 * 1000,
  indices: 15 * 60 * 1000,
  prices: 5 * 60 * 1000,
  default: 2 * 60 * 1000,
};

const cache = new Map();

// ------------------------------------------------------------
// Security headers
// ------------------------------------------------------------

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ------------------------------------------------------------
// Health check
// ------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    investoConfigured: HAS_KEY,
    serverTime: new Date().toISOString(),
  });
});

// ------------------------------------------------------------
// Allowed Investo endpoints
// ------------------------------------------------------------

function classifyRoute(subPath) {
  let match;

  if (subPath === '/stocks') {
    return {
      upstreamPath: '/stocks',
      cacheTtl: CACHE_TTL.stocks,
    };
  }

  if (subPath === '/indices') {
    return {
      upstreamPath: '/indices',
      cacheTtl: CACHE_TTL.indices,
    };
  }

  if (subPath === '/signals') {
    return {
      upstreamPath: '/signals',
      cacheTtl: CACHE_TTL.default,
    };
  }

  match = subPath.match(/^\/prices\/([A-Za-z0-9.-]+)$/);

  if (match) {
    const symbol = match[1];

    if (!/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(symbol)) {
      return null;
    }

    return {
      upstreamPath: `/prices/${encodeURIComponent(symbol)}`,
      cacheTtl: CACHE_TTL.prices,
    };
  }

  return null;
}

// ------------------------------------------------------------
// In-memory cache
// ------------------------------------------------------------

function getCached(key, ttl) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() - entry.cachedAt >= ttl) {
    cache.delete(key);
    return null;
  }

  return entry.body;
}

function setCached(key, body) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    body,
    cachedAt: Date.now(),
  });
}

// ------------------------------------------------------------
// Safe query parameters
// ------------------------------------------------------------

const ALLOWED_QUERY_KEYS = [
  'from',
  'to',
  'interval',
  'code',
  'type',
  'limit',
  'since',
  'provenance',
  'cursor',
  'include',
  'basis',
  'symbol',
  'issuer_type',
  'bond_type',
  'currency',
  'outstanding',
];

function buildQueryParams(query) {
  const params = new URLSearchParams();

  for (const key of ALLOWED_QUERY_KEYS) {
    const value = query[key];

    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Reject repeated parameters and object-like query values.
    if (typeof value !== 'string') {
      return {
        error: {
          code: 'invalid_parameter',
          message: `Invalid value for query parameter: ${key}.`,
        },
      };
    }

    if (
      ['from', 'to', 'since'].includes(key) &&
      !/^\d{4}-\d{2}-\d{2}(T[\d:]+Z?)?$/.test(value)
    ) {
      return {
        error: {
          code: 'invalid_date',
          message: `Invalid date format for ${key}. Use YYYY-MM-DD.`,
        },
      };
    }

    if (key === 'limit') {
      if (!/^\d+$/.test(value)) {
        return {
          error: {
            code: 'invalid_limit',
            message: 'limit must be a whole number between 1 and 100.',
          },
        };
      }

      const limit = Number(value);

      if (limit < 1 || limit > 100) {
        return {
          error: {
            code: 'invalid_limit',
            message: 'limit must be between 1 and 100.',
          },
        };
      }
    }

    params.set(key, value);
  }

  return { params };
}

// ------------------------------------------------------------
// Investo API proxy
// ------------------------------------------------------------

app.use('/api/investo', async (req, res) => {
  // Only read-only requests are supported.
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      ok: false,
      error: {
        code: 'method_not_allowed',
        message: 'Only GET requests are supported.',
      },
    });
  }

  if (!HAS_KEY) {
    return res.status(503).json({
      ok: false,
      error: {
        code: 'investo_not_configured',
        message: 'Investo API is not configured on the server.',
      },
    });
  }

  // Express removes the mounted /api/investo prefix from req.path.
  const subPath = req.path || '/';
  const route = classifyRoute(subPath);

  if (!route) {
    return res.status(404).json({
      ok: false,
      error: {
        code: 'unknown_endpoint',
        message: 'This Investo endpoint is not available through PREDICTA.',
      },
    });
  }

  const queryResult = buildQueryParams(req.query);

  if (queryResult.error) {
    return res.status(400).json({
      ok: false,
      error: queryResult.error,
    });
  }

  const queryString = queryResult.params.toString();

  const upstreamUrl =
    `${INVESTO_API_URL}${route.upstreamPath}` +
    (queryString ? `?${queryString}` : '');

  const cached = getCached(upstreamUrl, route.cacheTtl);

  if (cached !== null) {
    return res.json(cached);
  }

  let upstreamResponse;

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      upstreamResponse = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: 'application/json',
          'User-Agent': 'PREDICTA/1.0',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const timedOut = error.name === 'AbortError';

    return res.status(timedOut ? 504 : 502).json({
      ok: false,
      error: {
        code: timedOut ? 'upstream_timeout' : 'upstream_unreachable',
        message: timedOut
          ? 'Investo API did not respond in time.'
          : 'Could not connect to Investo API.',
      },
    });
  }

  // Never forward raw upstream error bodies to the browser.
  if (!upstreamResponse.ok) {
    const status = upstreamResponse.status;

    const safeErrors = {
      401: {
        code: 'auth_failed',
        message: 'Investo API authentication failed. Check the server API key.',
      },
      403: {
        code: 'access_denied',
        message: 'Investo API access was denied.',
      },
      404: {
        code: 'not_found',
        message: 'The requested Investo resource was not found.',
      },
      429: {
        code: 'rate_limited',
        message: 'Investo API rate limit reached. Try again later.',
      },
    };

    const safeError = safeErrors[status] || {
      code: 'upstream_error',
      message: `Investo API returned HTTP ${status}.`,
    };

    return res.status(status >= 400 && status < 500 ? status : 502).json({
      ok: false,
      error: safeError,
    });
  }

  let parsed;

  try {
    parsed = await upstreamResponse.json();
  } catch {
    return res.status(502).json({
      ok: false,
      error: {
        code: 'invalid_json',
        message: 'Investo returned an invalid JSON response.',
      },
    });
  }

  // Confirm the documented response envelope before using it.
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    parsed.ok !== true ||
    !Object.prototype.hasOwnProperty.call(parsed, 'data')
  ) {
    return res.status(502).json({
      ok: false,
      error: {
        code: 'invalid_envelope',
        message: 'Investo returned an unexpected response format.',
      },
    });
  }

  const upstreamMeta =
    parsed.meta && typeof parsed.meta === 'object'
      ? parsed.meta
      : {};

  const safeMeta = {
    attribution: upstreamMeta.attribution || 'Investo — investo.ng',
    proxied_at: new Date().toISOString(),
  };

  for (const key of [
    'generated_at',
    'count',
    'symbol',
    'first',
    'last',
    'source',
    'next_cursor',
  ]) {
    if (
      upstreamMeta[key] !== undefined &&
      ['string', 'number', 'boolean'].includes(typeof upstreamMeta[key])
    ) {
      safeMeta[key] = upstreamMeta[key];
    }
  }

  const result = {
    ok: true,
    data: parsed.data,
    meta: safeMeta,
  };

  setCached(upstreamUrl, result);

  return res.json(result);
});

// ------------------------------------------------------------
// Built frontend
// ------------------------------------------------------------

app.use(express.static(DIST_PATH, {
  maxAge: '1h',
  etag: true,
}));

// Express 5-compatible SPA fallback.
// Do not intercept unknown API routes.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (req.method !== 'GET') {
    return next();
  }

  res.sendFile(
    path.join(DIST_PATH, 'index.html'),
    (error) => {
      if (error) next(error);
    }
  );
});

// ------------------------------------------------------------
// Safe error handling
// ------------------------------------------------------------

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('PREDICTA server error:', error.message);

  res.status(500).json({
    ok: false,
    error: {
      code: 'internal_server_error',
      message: 'An unexpected server error occurred.',
    },
  });
});

// ------------------------------------------------------------
// Start server
// ------------------------------------------------------------

app.listen(PORT, () => {
  console.log('');
  console.log('PREDICTA server');
  console.log('-------------------------------');
  console.log(`Local server: http://localhost:${PORT}`);
  console.log(`Investo key:  ${HAS_KEY ? 'configured' : 'NOT CONFIGURED'}`);
  console.log(`Frontend:     ${DIST_PATH}`);
  console.log('');
});