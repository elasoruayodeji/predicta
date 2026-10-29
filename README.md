# PREDICTA — AI-Powered Stock Forecasting Platform

A quantitative financial research platform for the Nigerian Exchange (NGX) with AI-powered forecasting, anomaly detection, and model evaluation.

![PREDICTA](https://img.shields.io/badge/version-0.2.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-3178c6)
![License](https://img.shields.io/badge/license-Private-red)

## 🎯 Overview

PREDICTA is a sophisticated stock market research platform that combines:
- **Real-time NGX market data** via Investo API
- **AI-powered forecasting** with multiple ML models
- **Walk-forward backtesting** for model validation
- **Anomaly detection** for unusual market behavior
- **Advanced stock screener** with custom filters
- **Market movers dashboard** showing top gainers/losers

## ✨ Features

### Core Functionality
- 📊 **Stock Explorer** — Browse 146 NGX equities with real-time data
- 🔍 **Advanced Screener** — Filter by volatility, returns, data quality, anomalies
- 📈 **Market Movers** — Top gainers, losers, most active, highest volatility
- 🤖 **Forecasting Engine** — 5 ML models (Persistence, Historical Avg, Linear/Ridge Regression, Gradient Boosting)
- 🧪 **Model Laboratory** — Walk-forward backtesting with chronological evaluation
- 🚨 **Anomaly Detection** — Statistical detection of unusual price/volume patterns
- 📋 **Research Reports** — Exportable analysis with data provenance
- ⭐ **Watchlist** — Track your favorite stocks

### Data Sources
- 🟢 **Real NGX Data** — Investo API (146 equities, 2016-2026)
- 🔵 **CSV Import** — Upload your own historical data
- 🟡 **Synthetic Demo** — Random data for testing (clearly labeled)

### Technical Highlights
- ✅ **No data leakage** — Chronological train/test separation
- ✅ **Honest uncertainty** — Approximate prediction intervals clearly labeled
- ✅ **Data provenance** — Clear source attribution for all data
- ✅ **Secure API integration** — Server-side proxy protects API keys
- ✅ **Persistent storage** — localStorage for datasets, watchlists, settings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) Investo API key for real NGX data

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/elasoruayodeji/predicta.git
   cd predicta
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   ```bash
   cp .env.example .env
   # Edit .env and add your Investo API key if you have one
   ```

4. **Start the application**
   
   **Option A: With Investo API (Real Data)**
   ```bash
   node server/index.js
   ```
   Then open http://localhost:3000
   
   **Option B: Development Mode (No API)**
   ```bash
   npm run dev
   ```
   Then open http://localhost:5173

### First Steps

1. **Load sample data** — Click "Load Demo Data" in Stock Explorer
2. **Explore the dashboard** — See market movers and your imported stocks
3. **Try the screener** — Filter stocks by volatility, returns, etc.
4. **Run a forecast** — Select a stock and generate predictions
5. **Compare models** — Use Model Lab to see which performs best

## 🏗️ Architecture

```
PREDICTA
├── Frontend (React + TypeScript + Vite)
│   ├── Components (Dashboard, Screener, Forecast, etc.)
│   ├── Engine (Statistics, Models, Evaluation, Anomaly Detection)
│   ├── Store (React Context + localStorage persistence)
│   └── Services (Investo API client)
│
├── Backend (Node.js + Express)
│   └── Proxy Server (Secure API key management, caching)
│
└── Data Layer
    ├── Investo API (Real NGX market data)
    ├── CSV Import (User-provided data)
    └── Synthetic Demo (Random test data)
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `server/index.js` | Express proxy for Investo API (keeps keys secure) |
| `src/engine/*` | Core forecasting and analysis engine |
| `src/components/*` | React UI components |
| `src/services/investoClient.ts` | Frontend API client |
| `src/test/*` | Comprehensive test suite |

## 📊 Data Flow

```
User Action
    ↓
React Component
    ↓
Engine (Statistics/Models/Evaluation)
    ↓
Data Source (Investo API / CSV / Synthetic)
    ↓
Results → UI → User
```

### Forecasting Pipeline
1. **Data Ingestion** — Load prices from Investo/CSV/Synthetic
2. **Validation** — Check for duplicates, invalid prices, gaps
3. **Feature Engineering** — Calculate returns, volatility, momentum
4. **Model Training** — Train on historical data (no future leakage)
5. **Walk-Forward Evaluation** — Test on unseen data chronologically
6. **Forecast Generation** — Predict future returns with uncertainty
7. **Visualization** — Display results with clear limitations

## 🔒 Security

- ✅ **API keys never in browser** — Server-side proxy only
- ✅ **Environment variables** — `.env` file gitignored
- ✅ **Input validation** — Symbols, dates, query params validated
- ✅ **Error sanitization** — No sensitive data in error messages
- ✅ **CORS protection** — Security headers on all responses

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test coverage includes:
- Statistical calculations (returns, volatility, drawdown)
- Feature engineering (no data leakage)
- Model training and evaluation
- Walk-forward backtesting
- CSV parsing and validation
- Anomaly detection
- Investo adapter

## 📚 Documentation

- **[INVESTO_INTEGRATION.md](./INVESTO_INTEGRATION.md)** — Complete Investo API setup guide
- **[INVESTO_SUMMARY.md](./INVESTO_SUMMARY.md)** — Quick reference for Investo integration
- **[TRADINGVIEW_RESEARCH.md](./TRADINGVIEW_RESEARCH.md)** — Feature research and planning
- **[TRADINGVIEW_IMPLEMENTATION.md](./TRADINGVIEW_IMPLEMENTATION.md)** — Implementation details
- **[PHASE2_AUDIT_REPORT.md](./PHASE2_AUDIT_REPORT.md)** — Testing and verification report

## 🛠️ Development

### Project Structure
```
src/
├── components/          # React components
│   ├── anomalies/       # Anomaly detection UI
│   ├── common/          # Shared UI components
│   ├── dashboard/       # Dashboard and market movers
│   ├── data/            # Data import UI
│   ├── forecasting/     # Forecast workspace and model lab
│   ├── layout/          # App shell and navigation
│   ├── reports/         # Research reports
│   ├── screener/        # Stock screener
│   ├── settings/        # Settings page
│   ├── stocks/          # Stock explorer and detail
│   └── watchlist/       # Watchlist management
├── engine/              # Core analysis engine
│   ├── anomaly.ts       # Anomaly detection
│   ├── dataValidation.ts # Data quality checks
│   ├── evaluation.ts    # Walk-forward backtesting
│   ├── features.ts      # Feature engineering
│   ├── forecasting.ts   # Forecast orchestration
│   ├── investoAdapter.ts # Investo data mapping
│   ├── models.ts        # ML models
│   └── statistics.ts    # Financial statistics
├── services/            # External services
│   └── investoClient.ts # Investo API client
├── store/               # State management
│   └── AppContext.tsx   # React context + localStorage
├── test/                # Test suite
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

### Available Scripts

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run typecheck    # Run TypeScript type checking
npm test             # Run test suite
node server/index.js # Start proxy server (http://localhost:3000)
```

## 📈 Roadmap

### Phase 1 (Complete ✅)
- [x] Core forecasting engine
- [x] CSV import and validation
- [x] Statistical analysis
- [x] Model comparison
- [x] Anomaly detection
- [x] Research reports

### Phase 2 (Complete ✅)
- [x] Automated test suite
- [x] Data persistence (localStorage)
- [x] Honest prediction intervals
- [x] Synthetic data labeling
- [x] Edge case handling

### Phase 3 (Complete ✅)
- [x] Market movers dashboard
- [x] Advanced stock screener
- [x] Saved filter presets
- [x] Sparkline charts
- [x] CSV export

### Phase 4 (Complete ✅)
- [x] Investo API integration
- [x] Secure server proxy
- [x] Real NGX market data
- [x] Data source labeling
- [x] Attribution compliance

### Future Enhancements
- [ ] Python/FastAPI backend for production
- [ ] Candlestick charts (Lightweight Charts)
- [ ] Additional technical indicators (RSI, MACD)
- [ ] Multiple watchlists with drag-and-drop
- [ ] Fundamental data integration
- [ ] Real-time data feeds (paid API)

## ⚠️ Important Disclaimers

- **Not investment advice** — PREDICTA is for research and educational purposes only
- **Forecasts are estimates** — All predictions include uncertainty and may be wrong
- **Historical performance ≠ future results** — Past data does not guarantee future outcomes
- **Synthetic data is not real** — Demo data is randomly generated, not actual market prices
- **Do your own research** — Always verify data and consult professionals before investing

## 📄 License

Private project — All rights reserved.

## 🤝 Contributing

This is a personal project. For questions or collaboration, please open an issue on GitHub.

## 📞 Support

- **Investo API**: https://investo.ng/developers
- **Documentation**: See docs folder
- **Issues**: https://github.com/elasoruayodeji/predicta/issues

## 🙏 Acknowledgments

- **Investo** — For providing NGX market data API
- **TradingView** — For UI/UX inspiration
- **React & Vite** — For the amazing development experience
- **Recharts** — For beautiful, flexible charts

---

**Built with ❤️ for quantitative finance research**

*Last updated: 2026*
