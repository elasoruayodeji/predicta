// Vercel serverless function: Investo API proxy
// Catches all /api/investo/* routes and proxies to Investo API

const INVESTOPROXY_TARGET = 'https://investo.ng/api/v1';

// Cache TTLs (in seconds for Vercel edge caching)
const CACHE_TTL = {
  stocks: 900,      // 15 minutes
  indices: 900,     // 15 minutes
  prices: 300,      // 5 minutes
  default: 120      // 2 minutes
};

// Allowed routes
const ALLOWED_ROUTES = [
  { pattern: /^\/stocks$/, upstream: '/stocks', cacheTtl: CACHE_TTL.stocks },
  { pattern: /^\/prices\/([A-Za-z0-9.\-]+)$/, upstream: '/prices/:symbol', cacheTtl: CACHE_TTL.prices },
  { pattern: /^\/indices$/, upstream: '/indices', cacheTtl: CACHE_TTL.indices },
  { pattern: /^\/signals$/, upstream: '/signals', cacheTtl: CACHE_TTL.default }
];

// Allowed query parameters
const ALLOWED_QUERY_KEYS = [
  'from', 'to', 'interval', 'code', 'type', 'limit', 
  'since', 'provenance', 'cursor', 'include', 'basis', 
  'symbol', 'issuer_type', 'bond_type', 'currency', 'outstanding'
];

function classifyRoute(subPath) {
  for (const route of ALLOWED_ROUTES) {
    const match = subPath.match(route.pattern);
    if (match) return { route, match };
  }
  return null;
}

function isValidSymbol(symbol) {
  return /^[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(symbol);
}

function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}(T[\d:]+Z?)?$/.test(dateStr);
}

export default async function handler(req, res) {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Check API key
  const apiKey = process.env.INVESTO_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      error: {
        code: 'investo_not_configured',
        message: 'Investo API key is not configured. Set INVESTO_API_KEY environment variable.'
      }
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: {
        code: 'method_not_allowed',
        message: 'Only GET requests are supported.'
      }
    });
  }

  // Extract path after /api/investo
  const fullPath = req.url || '';
  const subPath = fullPath.replace(/^\/api\/investo/, '') || '/';
  const classified = classifyRoute(subPath);

  if (!classified) {
    return res.status(404).json({
      ok: false,
      error: {
        code: 'unknown_endpoint',
        message: 'This Investo endpoint is not exposed by the proxy.'
      }
    });
  }

  const { route, match } = classified;

  // Build upstream URL
  let upstreamPath = route.upstream;
  if (upstreamPath.includes(':symbol')) {
    const symbol = match[1];
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'invalid_symbol',
          message: 'Stock symbol contains invalid characters.'
        }
      });
    }
    upstreamPath = upstreamPath.replace(':symbol', encodeURIComponent(symbol));
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  for (const key of ALLOWED_QUERY_KEYS) {
    const value = req.query[key];
    if (value !== undefined && value !== null && value !== '') {
      // Validate date parameters
      if ((key === 'from' || key === 'to' || key === 'since') && !isValidDate(String(value))) {
        return res.status(400).json({
          ok: false,
          error: {
            code: 'invalid_date',
            message: `Invalid date format for ${key}. Use YYYY-MM-DD.`
          }
        });
      }
      
      // Validate limit parameter
      if (key === 'limit') {
        const n = parseInt(String(value), 10);
        if (isNaN(n) || n < 1 || n > 100) {
          return res.status(400).json({
            ok: false,
            error: {
              code: 'invalid_limit',
              message: 'limit must be between 1 and 100.'
            }
          });
        }
      }
      
      queryParams.set(key, String(value));
    }
  }

  const qs = queryParams.toString();
  const upstreamUrl = `${INVESTOPROXY_TARGET}${upstreamPath}${qs ? '?' + qs : ''}`;

  try {
    // Call Investo API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'PREDICTA/1.0 (production)'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!upstreamRes.ok) {
      let errorBody = null;
      try {
        errorBody = await upstreamRes.json();
      } catch {
        // Not JSON
      }

      const status = upstreamRes.status;
      const safeErrorMap = {
        401: { code: 'auth_failed', message: 'Investo API authentication failed.' },
        403: { code: 'auth_revoked', message: 'Investo API key has been revoked.' },
        404: { code: 'not_found', message: 'The requested resource was not found on Investo.' },
        429: { code: 'rate_limited', message: 'Investo API rate limit exceeded. Try again later.' }
      };

      const safeError = safeErrorMap[status] || {
        code: 'upstream_error',
        message: `Investo API returned an error (HTTP ${status}).`
      };

      return res.status(status).json({
        ok: false,
        error: safeError
      });
    }

    // Parse JSON response
    let parsed;
    try {
      parsed = await upstreamRes.json();
    } catch {
      return res.status(502).json({
        ok: false,
        error: {
          code: 'invalid_json',
          message: 'Investo returned a non-JSON response.'
        }
      });
    }

    // Validate envelope
    if (!parsed || typeof parsed !== 'object' || parsed.ok !== true) {
      return res.status(502).json({
        ok: false,
        error: {
          code: 'invalid_envelope',
          message: 'Investo response did not match expected envelope.'
        }
      });
    }

    // Build sanitized response
    const sanitized = {
      ok: true,
      data: parsed.data,
      meta: {
        generated_at: parsed.meta?.generated_at,
        attribution: parsed.meta?.attribution || 'Investo — investo.ng',
        count: parsed.meta?.count,
        ...(parsed.meta?.symbol ? { symbol: parsed.meta.symbol } : {}),
        ...(parsed.meta?.first ? { first: parsed.meta.first } : {}),
        ...(parsed.meta?.last ? { last: parsed.meta.last } : {}),
        ...(parsed.meta?.source ? { source: parsed.meta.source } : {}),
        ...(parsed.meta?.next_cursor ? { next_cursor: parsed.meta.next_cursor } : {}),
        proxied_at: new Date().toISOString(),
        cached: false
      }
    };

    // Set cache headers
    res.setHeader('Cache-Control', `s-maxage=${route.cacheTtl}, stale-while-revalidate`);
    
    return res.status(200).json(sanitized);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    
    return res.status(504).json({
      ok: false,
      error: {
        code: isTimeout ? 'upstream_timeout' : 'upstream_unreachable',
        message: isTimeout 
          ? 'Investo API did not respond in time.'
          : 'Could not reach the Investo API.'
      }
    });
  }
}
