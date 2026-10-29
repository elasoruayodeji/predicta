# PREDICTA — Investo API Integration Guide

## Overview

PREDICTA now supports **real Nigerian Exchange (NGX) market data** via the Investo Data API. This integration provides:

- ✅ Access to 146 listed NGX equities
- ✅ Historical daily OHLCV data from 2016 onwards
- ✅ Secure server-side API key storage (never exposed to browser)
- ✅ Clear data source labeling (REAL DATA vs CSV vs SYNTHETIC)
- ✅ End-of-day data with proper attribution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React App)                                         │
│  - Fetches from /api/investo/*                               │
│  - Never sees API key                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Node.js Proxy Server (server/index.js)                      │
│  - Reads INVESTO_API_KEY from environment                    │
│  - Proxies requests to https://investo.ng/api/v1/*           │
│  - Applies brief caching (5-15 min)                          │
│  - Sanitizes errors (never exposes key or raw errors)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Investo API (https://investo.ng/api/v1)                     │
│  - Real NGX market data                                      │
│  - End-of-day prices                                         │
│  - 1,000 requests/day (free tier)                            │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Get an Investo API Key

1. Visit [https://investo.ng/developers/keys](https://investo.ng/developers/keys)
2. Request a free API key (1,000 requests/day for personal projects)
3. You'll receive a key like: `inv_abc123...`

### 2. Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```bash
   INVESTO_API_KEY=inv_YOUR_KEY_HERE
   ```

3. **Important**: The `.env` file is gitignored and never committed.

### 3. Start the Server

Instead of `npm run dev`, use the proxy server:

```bash
node server/index.js
```

You should see:
```
  PREDICTA server
  ─────────────────────────────────────
  Local:     http://localhost:3000
  Investo:   ✓ configured
  Static:    /path/to/dist
```

### 4. Open the Application

Visit [http://localhost:3000](http://localhost:3000)

The Stock Explorer will now show:
- **Real NGX Market Data** section at the top (with green "LIVE" badge)
- Browse 146 listed equities
- Click "Import" to load full price history for any stock
- Data is clearly labeled as "REAL DATA" (green badge)

## Usage

### Browsing Stocks

1. Go to **Stock Explorer** (sidebar → Stock Explorer)
2. The Investo browser shows all 146 NGX equities
3. Search by symbol, name, or sector
4. Click **Import** on any stock to load its full price history

### Data Sources

PREDICTA now supports three data sources, clearly labeled:

| Badge | Source | Description |
|-------|--------|-------------|
| 🟢 **REAL DATA** | Investo API | Real NGX market data (end-of-day) |
| 🔵 **CSV** | CSV Upload | User-imported CSV files |
| 🟡 **SYNTHETIC** | Demo Mode | Randomly generated sample data |

### Checking Connection Status

Go to **Settings** → **Data Provider Configuration** to see:
- ✅ **CONFIGURED** — Investo API key is set and working
- ⚠️ **NOT CONFIGURED** — API key is missing (set INVESTO_API_KEY)
- ❌ **SERVER OFFLINE** — Proxy server is not running

## API Endpoints

The proxy server exposes these endpoints:

| Endpoint | Description | Cache TTL |
|----------|-------------|-----------|
| `GET /api/health` | Server health check | None |
| `GET /api/investo/stocks` | All 146 NGX equities | 15 min |
| `GET /api/investo/prices/:symbol` | Historical OHLCV for a symbol | 5 min |
| `GET /api/investo/indices` | NGX indices (ASI, etc.) | 15 min |
| `GET /api/investo/signals` | Market signals (big movers, etc.) | 2 min |

### Query Parameters

For `/api/investo/prices/:symbol`:
- `from` — Start date (YYYY-MM-DD), e.g., `2016-01-01`
- `to` — End date (YYYY-MM-DD), e.g., `2026-12-31`
- `interval` — Set to `latest` for most recent close only

Example:
```
GET /api/investo/prices/GTCO?from=2020-01-01&to=2026-12-31
```

## Error Handling

The proxy server handles all Investo API errors and returns safe, client-friendly messages:

| Investo Error | Client Message |
|---------------|----------------|
| `missing_api_key` / `invalid_api_key` | "Investo API authentication failed. The server API key may be invalid." |
| `revoked_api_key` | "Investo API key has been revoked." |
| `unknown_symbol` | "The requested symbol or resource was not found on Investo." |
| `rate_limited` | "Investo API rate limit exceeded. Try again later (quota resets at midnight UTC)." |
| Network timeout | "Investo API did not respond in time." |
| Network error | "Could not reach the Investo API. Check your network connection." |

**Security**: The API key is never exposed in error messages or responses.

## Rate Limits

- **Free tier**: 1,000 requests per day
- **Reset**: Midnight UTC
- **Proxy caching**: Reduces actual API calls (5-15 min cache)

### Monitoring Usage

Check the Investo dashboard at [https://investo.ng/developers](https://investo.ng/developers) to monitor your quota.

## Data Attribution

**Required by Investo's free-tier terms:**

All pages displaying Investo data show:
```
Data: Investo — investo.ng
```

This attribution appears in:
- Stock Explorer (Investo browser footer)
- Stock Detail (data source section)
- Dashboard (when showing Investo-sourced stocks)

## Licensing & Terms

### What You Can Do (Free Tier)
- ✅ Use data for personal research and evaluation
- ✅ Display data in your own application (with attribution)
- ✅ Transient caching (5-15 minutes)
- ✅ Derived analysis (your forecasts, your charts)

### What You Cannot Do (Free Tier)
- ❌ Resell or redistribute raw market data
- ❌ Build a competing market data service
- ❌ Bulk-mirror the entire dataset
- ❌ Share your API key with others

### Commercial Use
For commercial use or redistribution, contact Investo about paid tiers:
- **Startup**: $500/month (25,000 requests/day)
- **Growth**: $1,500/month (100,000 requests/day)
- **Institutional**: Custom pricing

See [Investo API Terms](https://investo.ng/api-terms) for full details.

## Troubleshooting

### "Investo API Not Configured"

**Problem**: Stock Explorer shows "Investo API Not Configured"

**Solution**:
1. Check that `.env` exists and contains `INVESTO_API_KEY=inv_...`
2. Restart the server: `node server/index.js`
3. Verify the server output shows "Investo: ✓ configured"

### "Server Unavailable"

**Problem**: Stock Explorer shows "Server Unavailable"

**Solution**:
1. Make sure you're running `node server/index.js` (not `npm run dev`)
2. Check that the server is listening on port 3000
3. Visit `http://localhost:3000/api/health` — should return JSON

### "Rate limit exceeded"

**Problem**: You see "Investo API rate limit exceeded"

**Solution**:
1. Wait until midnight UTC (quota resets daily)
2. Reduce requests — the proxy caches responses for 5-15 minutes
3. Consider upgrading to a paid tier if you need more requests

### Import fails with "Insufficient price data"

**Problem**: Clicking "Import" on a stock shows "Insufficient price data"

**Solution**:
- Some newly listed stocks may have less than 10 trading days
- PREDICTA requires at least 10 records for analysis
- Try a different, more established stock

## Security

### API Key Protection

- ✅ Stored in server environment only (never in browser)
- ✅ Never included in built assets
- ✅ Never logged or exposed in error messages
- ✅ Transmitted only in `Authorization` header to Investo

### CORS & Headers

The proxy server sets security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Input Validation

- Stock symbols validated against regex: `^[A-Z0-9][A-Z0-9.\-]{0,19}$`
- Date parameters validated: `YYYY-MM-DD` format
- Query parameters whitelisted (only known-safe params passed through)

## Development

### Running in Development Mode

For hot-reload during development, you can run both:

**Terminal 1** — Vite dev server (for React hot-reload):
```bash
npm run dev
```

**Terminal 2** — Proxy server:
```bash
node server/index.js
```

Then configure Vite to proxy API requests. Add to `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

### Testing

Run the adapter tests:
```bash
npm test -- src/test/investoAdapter.test.ts
```

## Files Added/Modified

### New Files
- `server/index.js` — Express proxy server (~250 lines)
- `src/services/investoClient.ts` — Frontend API client
- `src/engine/investoAdapter.ts` — Maps Investo → PREDICTA types
- `src/components/stocks/InvestoBrowser.tsx` — Investo UI component
- `src/test/investoAdapter.test.ts` — Adapter tests
- `.env.example` — Environment template
- `.env` — Local environment (gitignored)

### Modified Files
- `src/components/stocks/StockExplorer.tsx` — Added Investo browser
- `src/components/settings/SettingsPage.tsx` — Added Investo status
- `package.json` — Added `express` dependency

## Support

- **Investo API docs**: [https://investo.ng/developers](https://investo.ng/developers)
- **API terms**: [https://investo.ng/api-terms](https://investo.ng/api-terms)
- **Get API key**: [https://investo.ng/developers/keys](https://investo.ng/developers/keys)
- **Data coverage**: [https://investo.ng/coverage](https://investo.ng/coverage)

---

**Last updated**: 2026
**PREDICTA version**: 0.2.0 (with Investo integration)
