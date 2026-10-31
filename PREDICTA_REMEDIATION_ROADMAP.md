# PREDICTA Remediation Roadmap

**Audit Date:** 2026  
**Roadmap Period:** Immediate → Long-term  
**Priority Levels:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)

---

## Executive Summary

This roadmap addresses findings from the comprehensive PREDICTA audit. Items are prioritized by severity, impact, and effort required.

**Total Items:** 15  
**P0 (Critical):** 0  
**P1 (High):** 2  
**P2 (Medium):** 4  
**P3 (Low):** 9  

**Estimated Effort:**
- P1 items: 2-3 days
- P2 items: 1-2 weeks
- P3 items: 1-2 months

---

## P1 - High Priority (Immediate)

### P1.1: Verify Live Market Data Integration

**Finding ID:** H1  
**Severity:** HIGH  
**Status:** NOT VERIFIED  
**Estimated Effort:** 1 day

**Problem:**
Investo API integration is implemented but not verified with live data. Cannot confirm data accuracy, completeness, or reliability.

**Impact:**
- All market data features unverified
- Potential data accuracy issues
- User trust at risk

**Action Items:**
1. Obtain valid Investo API key
2. Test all API endpoints:
   - `/stocks` - Verify 146 equities returned
   - `/prices/:symbol` - Verify historical data
   - `/indices` - Verify index data
   - `/signals` - Verify signal data
3. Compare data with NGX official sources
4. Test error scenarios:
   - Invalid symbols
   - Network failures
   - Rate limits
5. Validate caching behavior
6. Document any data quality issues

**Success Criteria:**
- ✅ All endpoints return valid data
- ✅ Data matches NGX official sources
- ✅ Error handling works correctly
- ✅ Caching reduces API calls
- ✅ No data quality issues found

**Testing:**
```bash
# Set API key
export INVESTO_API_KEY=your_key_here

# Start server
npm run dev

# Test endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/investo/stocks
curl http://localhost:3001/api/investo/prices/GTCO?from=2020-01-01
```

**Dependencies:**
- Valid Investo API key
- Access to NGX official data for comparison

**Risk if Not Addressed:**
- Users may receive incorrect market data
- Financial decisions based on wrong information
- Loss of user trust

---

### P1.2: Validate Prediction Models on NGX Data

**Finding ID:** H2  
**Severity:** HIGH  
**Status:** NOT VERIFIED  
**Estimated Effort:** 2 days

**Problem:**
Prediction models trained on synthetic data only. Not validated against real historical NGX data. Cannot confirm real-world accuracy.

**Impact:**
- Prediction accuracy unknown
- Users may rely on unvalidated forecasts
- Potential for poor investment decisions

**Action Items:**
1. Obtain historical NGX data (2016-present)
2. Select representative stocks:
   - Large cap (DANGCEM, GTCO)
   - Mid cap (ZENITHBANK, MTNN)
   - Small cap (selected illiquid stocks)
3. Train models on real data
4. Measure out-of-sample performance:
   - Directional accuracy
   - MAE, RMSE
   - Baseline improvement
5. Compare against naive baselines
6. Document performance metrics
7. Add disclaimers about validation status
8. Consider model retraining if performance poor

**Success Criteria:**
- ✅ Models trained on real NGX data
- ✅ Out-of-sample accuracy measured
- ✅ Performance documented
- ✅ Disclaimers added
- ✅ Users informed of limitations

**Testing:**
```typescript
// Load real NGX data
const ngxDataset = await loadHistoricalData('DANGCEM', '2016-01-01', '2024-12-31');

// Run validation
const results = runModelComparison(ngxDataset, 5);

// Verify
console.log('Directional accuracy:', results.models[2].metrics.directionalAccuracy);
console.log('MAE:', results.models[2].metrics.mae);
console.log('Baseline improvement:', results.models[2].metrics.baselineImprovement);
```

**Dependencies:**
- Historical NGX data (2016-present)
- Data cleaning and validation
- Computational resources for training

**Risk if Not Addressed:**
- Unvalidated predictions may mislead users
- Poor model performance not detected
- Loss of credibility

---

## P2 - Medium Priority (Short-term)

### P2.1: Migrate localStorage Components to Supabase

**Finding ID:** M1  
**Severity:** MEDIUM  
**Status:** PARTIAL  
**Estimated Effort:** 3-5 days

**Problem:**
Watchlist, Portfolio, Alerts, Calendar, Journal, and Screener presets use localStorage instead of Supabase. Data not synced across devices for authenticated users.

**Impact:**
- Data not available on multiple devices
- Data loss if browser cache cleared
- Inconsistent user experience

**Action Items:**
1. Update WatchlistPage to use dataService:
   - Replace localStorage calls with getWatchlists(), addWatchlistItem()
   - Add loading states
   - Add error handling
   - Keep localStorage as offline fallback

2. Update PortfolioTracker:
   - Replace localStorage with getPortfolioAccounts(), addTransaction()
   - Add cloud sync
   - Handle offline mode

3. Update AlertsPage:
   - Replace localStorage with getAlerts(), createAlert()
   - Add cloud sync
   - Handle offline mode

4. Update InvestmentCalendar:
   - Replace localStorage with getCalendarEvents(), createCalendarEvent()
   - Add cloud sync
   - Handle offline mode

5. Update InvestmentJournal:
   - Replace localStorage with getJournalEntries(), createJournalEntry()
   - Add cloud sync
   - Handle offline mode

6. Update StockScreener:
   - Replace localStorage with getScreenerPresets(), createScreenerPreset()
   - Add cloud sync
   - Handle offline mode

7. Test cross-device sync:
   - Sign in on Device A
   - Create data
   - Sign in on Device B
   - Verify data appears

**Success Criteria:**
- ✅ All components use Supabase for authenticated users
- ✅ Data syncs across devices
- ✅ localStorage fallback works for offline mode
- ✅ Loading states implemented
- ✅ Error handling implemented
- ✅ No data loss

**Testing:**
```typescript
// Test cloud sync
1. Sign in on Chrome
2. Add watchlist item
3. Sign in on Firefox with same account
4. Verify watchlist item appears
5. Modify on Firefox
6. Verify change appears on Chrome
```

**Dependencies:**
- dataService.ts functions already implemented
- Supabase tables already created
- RLS policies already in place

**Risk if Not Addressed:**
- Poor user experience
- Data loss risk
- Inconsistent with cloud-first architecture

---

### P2.2: Configure Production Email Delivery

**Finding ID:** M2  
**Severity:** MEDIUM  
**Status:** PARTIAL  
**Estimated Effort:** 1 day

**Problem:**
Email authentication flows implemented but require manual SMTP configuration for production. Supabase uses InBucket for development (logged, not sent).

**Impact:**
- Users cannot verify email addresses in production
- Users cannot reset passwords
- Account recovery impossible

**Action Items:**
1. Choose SMTP provider:
   - SendGrid (recommended, free tier: 100 emails/day)
   - Amazon SES (cheapest at scale)
   - Mailgun (good for developers)
   - Postmark (best deliverability)

2. Set up SMTP provider:
   - Create account
   - Verify domain (predicta.ng)
   - Add DNS records (SPF, DKIM, DMARC)
   - Get SMTP credentials

3. Configure Supabase:
   - Go to Project Settings → SMTP
   - Enable custom SMTP
   - Enter SMTP credentials
   - Test connection

4. Customize email templates:
   - Confirm signup template
   - Reset password template
   - Add PREDICTA branding
   - Add support contact

5. Test email delivery:
   - Sign up with new account
   - Verify email received
   - Click verification link
   - Request password reset
   - Verify reset email received

**Success Criteria:**
- ✅ SMTP provider configured
- ✅ Domain verified with DNS
- ✅ Emails sent from support@predicta.ng
- ✅ Verification emails delivered
- ✅ Password reset emails delivered
- ✅ Templates branded with PREDICTA

**Testing:**
```bash
# Test email delivery
1. Sign up with test@example.com
2. Check inbox for verification email
3. Click verification link
4. Request password reset
5. Check inbox for reset email
6. Click reset link
7. Set new password
```

**Dependencies:**
- Domain ownership (predicta.ng)
- SMTP provider account
- DNS access for verification

**Risk if Not Addressed:**
- Users cannot complete registration
- Users cannot recover accounts
- Poor user experience

---

### P2.3: Add Market Friction Modeling to Backtesting

**Finding ID:** M3  
**Severity:** MEDIUM  
**Status:** PARTIAL  
**Estimated Effort:** 2-3 days

**Problem:**
Backtesting engine does not model transaction costs, slippage, liquidity constraints, or NGX-specific market frictions. Backtests may overestimate real-world performance.

**Impact:**
- Overly optimistic backtest results
- Strategies may fail in live trading
- Users may make incorrect decisions

**Action Items:**
1. Add transaction cost parameters:
   - Brokerage fees (percentage)
   - Stamp duty (fixed or percentage)
   - Other levies

2. Implement slippage model:
   - Price impact function
   - Volume-based slippage
   - Configurable parameters

3. Add liquidity constraints:
   - Maximum % of daily volume
   - Minimum trading frequency
   - Illiquid stock warnings

4. Model NGX price limits:
   - ±10% daily price limit
   - Circuit breaker detection
   - Limit breach handling

5. Add settlement delay:
   - T+2 settlement
   - Cash flow timing
   - Position tracking

6. Update backtesting engine:
   - Modify evaluation.ts
   - Add friction parameters
   - Calculate gross vs net returns
   - Report friction impact

7. Update UI:
   - Add friction parameter inputs
   - Display gross vs net returns
   - Show friction impact analysis

**Success Criteria:**
- ✅ Transaction costs modeled
- ✅ Slippage implemented
- ✅ Liquidity constraints added
- ✅ Price limits modeled
- ✅ Settlement delay handled
- ✅ Gross vs net returns reported
- ✅ UI updated with parameters

**Testing:**
```typescript
// Test with market frictions
const backtest = runBacktest(prices, strategy, {
  transactionCost: 0.005, // 0.5%
  slippage: 0.001, // 0.1%
  maxVolumePercent: 0.1, // 10% of daily volume
  priceLimit: 0.1, // 10% daily limit
  settlementDelay: 2, // T+2
});

// Verify
console.log('Gross return:', backtest.grossReturn);
console.log('Net return:', backtest.netReturn);
console.log('Friction impact:', backtest.grossReturn - backtest.netReturn);
```

**Dependencies:**
- NGX market rules documentation
- Transaction cost data
- Slippage research

**Risk if Not Addressed:**
- Misleading backtest results
- Poor strategy performance
- User dissatisfaction

---

### P2.4: Optimize Bundle Size

**Finding ID:** M4  
**Severity:** MEDIUM  
**Status:** PARTIAL  
**Estimated Effort:** 2-3 days

**Problem:**
Bundle size is 1,319 KB (345 KB gzipped), exceeding the 500 KB warning threshold. No code splitting or lazy loading implemented.

**Impact:**
- Slower initial page load
- Poor performance on slow connections
- Higher bandwidth usage
- Poor mobile experience

**Action Items:**
1. Implement route-based code splitting:
   - Lazy load all page components
   - Split by route
   - Load on demand

2. Optimize component imports:
   - Use dynamic imports for large components
   - Tree-shake unused dependencies
   - Remove unused imports

3. Optimize images and assets:
   - Compress images
   - Use WebP format
   - Lazy load images

4. Analyze bundle:
   - Use rollup-plugin-visualizer
   - Identify large dependencies
   - Consider alternatives

5. Configure Vite:
   - Add manual chunks
   - Optimize chunk splitting
   - Configure build options

6. Test performance:
   - Measure load time
   - Test on slow connections
   - Verify mobile performance

**Success Criteria:**
- ✅ Bundle size < 500 KB
- ✅ Initial load time < 3 seconds
- ✅ All routes lazy loaded
- ✅ No performance regression
- ✅ Mobile performance acceptable

**Testing:**
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Measure performance
# Open in browser with slow 3G connection
# Measure Time to Interactive (TTI)
```

**Dependencies:**
- Vite configuration
- Bundle analysis tools
- Performance monitoring

**Risk if Not Addressed:**
- Poor user experience
- High bounce rate
- Poor mobile performance

---

## P3 - Low Priority (Long-term)

### P3.1: Add NGX-Specific Features

**Finding ID:** L1  
**Severity:** LOW  
**Status:** PARTIAL  
**Estimated Effort:** 3-5 days

**Problem:**
Missing NGX-specific features: price limit detection, suspension tracking, delisting detection.

**Impact:**
- Incomplete market coverage
- Missing important market events
- Reduced usefulness for NGX investors

**Action Items:**
1. Add price limit detection:
   - Detect ±10% daily limit breaches
   - Flag limit-up and limit-down stocks
   - Display in stock detail

2. Add suspension tracking:
   - Detect suspended stocks
   - Display suspension status
   - Show suspension reason (if available)

3. Add delisting detection:
   - Detect delisted stocks
   - Display delisting status
   - Show delisting date

4. Update UI:
   - Add status badges
   - Add warnings
   - Update stock detail page

**Success Criteria:**
- ✅ Price limits detected
- ✅ Suspensions tracked
- ✅ Delistings detected
- ✅ UI updated

**Dependencies:**
- NGX data source with suspension/delisting info
- Market rules documentation

---

### P3.2: Add Advanced Risk Metrics

**Finding ID:** L2  
**Severity:** LOW  
**Status:** PARTIAL  
**Estimated Effort:** 3-5 days

**Problem:**
Missing advanced risk metrics: VaR, CVaR, stress testing, scenario analysis.

**Impact:**
- Limited risk analysis
- Professional users underserved
- Incomplete risk picture

**Action Items:**
1. Implement Value at Risk (VaR):
   - Historical VaR
   - Parametric VaR
   - Configurable confidence level

2. Implement Conditional VaR (CVaR):
   - Expected shortfall
   - Tail risk measurement

3. Add stress testing:
   - Market crash scenarios
   - Sector-specific shocks
   - Custom scenarios

4. Add scenario analysis:
   - Interest rate changes
   - Currency fluctuations
   - Commodity price changes

5. Update UI:
   - Add risk dashboard
   - Display metrics
   - Add scenario inputs

**Success Criteria:**
- ✅ VaR calculated
- ✅ CVaR calculated
- ✅ Stress testing implemented
- ✅ Scenario analysis added
- ✅ UI updated

**Dependencies:**
- Risk modeling expertise
- Historical data for calibration

---

### P3.3: Add Macroeconomic Data

**Finding ID:** L3  
**Severity:** LOW  
**Status:** NOT IMPLEMENTED  
**Estimated Effort:** 5-7 days

**Problem:**
Missing macroeconomic data: inflation, interest rates, exchange rates, oil prices.

**Impact:**
- Limited market context
- Cannot analyze macro impacts
- Incomplete research platform

**Action Items:**
1. Identify data sources:
   - CBN (Central Bank of Nigeria)
   - NBS (National Bureau of Statistics)
   - FMDQ (financial market data)
   - International sources (oil prices)

2. Build data ingestion:
   - API integrations
   - Manual data entry
   - Data validation

3. Create macro dashboard:
   - Display indicators
   - Historical charts
   - Trend analysis

4. Add analysis tools:
   - Correlation with stocks
   - Impact analysis
   - Scenario modeling

**Success Criteria:**
- ✅ Macro data ingested
- ✅ Dashboard created
- ✅ Analysis tools added
- ✅ Integrated with stock analysis

**Dependencies:**
- Data source APIs
- Data licensing
- Storage for historical data

---

### P3.4: Implement AI Research Assistant

**Finding ID:** L4  
**Severity:** LOW  
**Status:** NOT IMPLEMENTED  
**Estimated Effort:** 2-4 weeks

**Problem:**
No AI research assistant, natural language processing, or document intelligence.

**Impact:**
- Missing modern AI features
- Manual research only
- Competitive disadvantage

**Action Items:**
1. Choose LLM provider:
   - OpenAI API
   - Anthropic Claude
   - Self-hosted model

2. Build research assistant:
   - Natural language interface
   - Context-aware queries
   - Data retrieval integration

3. Add document intelligence:
   - PDF parsing
   - Financial statement extraction
   - Summarization

4. Implement safeguards:
   - Data grounding
   - Citation requirements
   - Hallucination prevention

5. Update UI:
   - Chat interface
   - Document upload
   - Query history

**Success Criteria:**
- ✅ LLM integrated
- ✅ Research assistant functional
- ✅ Document intelligence working
- ✅ Safeguards implemented
- ✅ UI complete

**Dependencies:**
- LLM API access
- Document parsing libraries
- Significant development time

---

### P3.5-P3.9: Additional Low-Priority Features

**Finding IDs:** L5-L9  
**Severity:** LOW  
**Estimated Effort:** 1-2 months total

**Features:**
- L5: Automated financial statement ingestion
- L6: Multiple watchlists
- L7: Real-time alert evaluation
- L8: Advanced chart types
- L9: Additional export formats

**Action Items:**
Implement based on user feedback and priorities.

---

## Implementation Timeline

### Week 1-2: P1 Items
- Day 1-2: P1.1 - Verify live market data
- Day 3-5: P1.2 - Validate prediction models

### Week 3-4: P2 Items (Part 1)
- Day 1-5: P2.1 - Migrate localStorage to Supabase (Watchlist, Portfolio)

### Week 5-6: P2 Items (Part 2)
- Day 1-2: P2.2 - Configure production email
- Day 3-5: P2.1 - Migrate localStorage to Supabase (Alerts, Calendar, Journal, Screener)

### Week 7-8: P2 Items (Part 3)
- Day 1-3: P2.3 - Add market friction modeling
- Day 4-5: P2.4 - Optimize bundle size

### Week 9+: P3 Items
- Implement based on user feedback and priorities

---

## Success Metrics

### P1 Success Metrics
- ✅ Live market data verified and accurate
- ✅ Prediction models validated on NGX data
- ✅ Performance metrics documented
- ✅ User disclaimers added

### P2 Success Metrics
- ✅ All components use cloud storage
- ✅ Cross-device sync working
- ✅ Email delivery functional
- ✅ Backtests include market frictions
- ✅ Bundle size < 500 KB

### P3 Success Metrics
- ✅ Additional features implemented
- ✅ User satisfaction improved
- ✅ Competitive position strengthened

---

## Risk Assessment

### High Risk Items
- **P1.1:** Cannot verify without API access
- **P1.2:** Requires historical NGX data

### Medium Risk Items
- **P2.1:** Complex migration, potential data loss
- **P2.3:** Requires market expertise

### Low Risk Items
- **P2.2:** Straightforward configuration
- **P2.4:** Standard optimization
- **P3 items:** Enhancements, not critical

---

## Resource Requirements

### P1 Items
- 1 developer, 3 days
- Investo API key
- Historical NGX data

### P2 Items
- 1 developer, 2 weeks
- SMTP provider account
- Domain ownership

### P3 Items
- 1-2 developers, 1-2 months
- Various data sources
- LLM API access (for AI features)

---

## Conclusion

This roadmap addresses all audit findings in priority order. P1 items must be completed before production launch. P2 items should be completed within 2 weeks post-launch. P3 items can be implemented based on user feedback.

**Total Estimated Effort:** 2-3 months for all items  
**Critical Path:** P1.1 → P1.2 → P2.1 → P2.2  
**Recommended Start:** Immediately

---

**Roadmap Created:** 2026  
**Next Review:** After P1 completion  
**Owner:** Development Team
