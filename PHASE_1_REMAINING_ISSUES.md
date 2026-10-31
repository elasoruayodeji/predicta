# Phase 1 Remaining Issues

## Overview

This document lists all remaining issues, incomplete migrations, and items requiring manual configuration or testing after Phase 1 implementation.

---

## Incomplete Component Migrations

### 1. InvestmentCalendar - NOT MIGRATED

**File:** `src/components/calendar/InvestmentCalendar.tsx`  
**Current State:** Uses localStorage via `loadCalendarEvents()` and `saveCalendarEvents()`  
**Required Changes:**
- Add `useAuth` hook
- Import `getCalendarEvents`, `createCalendarEvent`, `updateCalendarEvent`, `deleteCalendarEvent` from dataService
- Add loading state
- Load from Supabase when authenticated
- Sync create/update/delete operations to cloud
- Add "Cloud Synced" indicator

**Estimated Effort:** 2 hours  
**Priority:** Medium

---

### 2. InvestmentJournal - NOT MIGRATED

**File:** `src/components/journal/InvestmentJournal.tsx`  
**Current State:** Uses localStorage via `loadJournalEntries()` and `saveJournalEntries()`  
**Required Changes:**
- Add `useAuth` hook
- Import `getJournalEntries`, `createJournalEntry`, `updateJournalEntry`, `deleteJournalEntry` from dataService
- Add loading state
- Load from Supabase when authenticated
- Sync create/update/delete operations to cloud
- Add "Cloud Synced" indicator

**Estimated Effort:** 2 hours  
**Priority:** Medium

---

### 3. StockScreener Presets - NOT MIGRATED

**File:** `src/components/screener/StockScreener.tsx`  
**Current State:** Uses localStorage for screener presets  
**Required Changes:**
- Add `useAuth` hook
- Import `getScreenerPresets`, `createScreenerPreset`, `deleteScreenerPreset` from dataService
- Add loading state
- Load presets from Supabase when authenticated
- Sync preset save/delete to cloud
- Add "Cloud Synced" indicator

**Estimated Effort:** 1 hour  
**Priority:** Low

---

## Manual Testing Required

### 1. Live Investo API Testing

**Status:** ⚠️ NOT TESTED  
**Reason:** Requires valid Investo API credentials  
**Test Steps:**
1. Set `INVESTO_API_KEY` in `.env`
2. Start server: `node server/index.cjs`
3. Open browser: `http://localhost:3001`
4. Navigate to Stock Explorer
5. Click "Browse Investo API"
6. Verify stock list loads
7. Import a stock (e.g., DANGCEM)
8. Verify historical prices load
9. Check data accuracy against NGX website

**Expected Results:**
- ✅ Stock list displays 146 equities
- ✅ Historical prices load correctly
- ✅ Data matches NGX official sources
- ✅ No errors in console

**Risk if Not Tested:**
- Data accuracy unknown
- Potential user misinformation

---

### 2. Prediction Model Validation on Real NGX Data

**Status:** ⚠️ NOT TESTED  
**Reason:** Requires historical NGX dataset  
**Test Steps:**
1. Obtain historical NGX data (2016-present) for multiple stocks
2. Import data via CSV
3. Run forecasting on each stock
4. Compare predictions against actual outcomes
5. Measure directional accuracy
6. Calculate MAE, RMSE
7. Compare against baseline models

**Expected Results:**
- ✅ Models trained on real data
- ✅ Out-of-sample accuracy measured
- ✅ Performance metrics documented
- ✅ Baseline comparisons completed

**Risk if Not Tested:**
- Model accuracy unknown
- May provide misleading forecasts

---

### 3. Cross-Device Sync Verification

**Status:** ⚠️ NOT TESTED  
**Reason:** Requires multiple devices/browsers  
**Test Steps:**
1. Sign in on Device A (Chrome)
2. Add watchlist item
3. Add portfolio transaction
4. Create alert
5. Sign in on Device B (Firefox) with same account
6. Verify watchlist item appears
7. Verify portfolio transaction appears
8. Verify alert appears
9. Modify data on Device B
10. Refresh Device A
11. Verify changes sync

**Expected Results:**
- ✅ Data syncs across devices
- ✅ Changes propagate correctly
- ✅ No data loss
- ✅ No conflicts

**Risk if Not Tested:**
- Sync may not work as expected
- Data inconsistency possible

---

### 4. Email Delivery Testing

**Status:** ⚠️ NOT TESTED  
**Reason:** Requires SMTP configuration  
**Test Steps:**
1. Configure SMTP in Supabase (SendGrid/Amazon SES)
2. Verify domain with DNS records
3. Sign up with new account
4. Check email inbox for verification email
5. Click verification link
6. Request password reset
7. Check email inbox for reset email
8. Click reset link
9. Set new password
10. Sign in with new password

**Expected Results:**
- ✅ Verification email received
- ✅ Reset email received
- ✅ Emails from support@predicta.ng
- ✅ Links work correctly

**Risk if Not Tested:**
- Users cannot verify emails
- Users cannot reset passwords
- Account recovery impossible

---

### 5. Google OAuth Testing

**Status:** ⚠️ NOT TESTED  
**Reason:** Requires Google Cloud Console setup  
**Test Steps:**
1. Configure Google OAuth in Supabase
2. Set up Google Cloud Console project
3. Create OAuth 2.0 credentials
4. Add redirect URIs
5. Click "Sign in with Google"
6. Complete OAuth flow
7. Verify account created
8. Verify email auto-verified
9. Verify redirect to dashboard

**Expected Results:**
- ✅ Google OAuth works
- ✅ Account created automatically
- ✅ Email verified automatically
- ✅ User redirected to dashboard

**Risk if Not Tested:**
- Google sign-in may not work
- Poor user experience

---

## Configuration Required

### 1. Supabase Email Confirmation

**Status:** ⚠️ NOT CONFIGURED  
**Action Required:**
1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Enable "Confirm email" toggle
3. Save changes

**Impact:**
- New users must verify email before accessing dashboard
- Improves security
- Prevents fake accounts

---

### 2. Supabase Site URL Configuration

**Status:** ⚠️ NOT CONFIGURED  
**Action Required:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`
3. Add Redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/auth/verify-email`
   - `http://localhost:5173/auth/reset-password`
   - Production equivalents

**Impact:**
- Authentication redirects work correctly
- OAuth callbacks work correctly
- Email verification links work correctly

---

### 3. Production SMTP Configuration

**Status:** ⚠️ NOT CONFIGURED  
**Action Required:**
1. Choose SMTP provider (SendGrid recommended)
2. Create account and verify domain
3. Get SMTP credentials
4. Go to Supabase Dashboard → Project Settings → SMTP
5. Enable custom SMTP
6. Enter credentials
7. Test connection
8. Customize email templates

**Impact:**
- Real emails sent to users
- Professional sender address
- Branded email templates

---

### 4. Google OAuth Configuration

**Status:** ⚠️ NOT CONFIGURED  
**Action Required:**
1. Go to Google Cloud Console
2. Create project
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add redirect URIs
6. Copy Client ID and Client Secret
7. Go to Supabase Dashboard → Authentication → Providers → Google
8. Enable Google provider
9. Paste Client ID and Client Secret
10. Save changes

**Impact:**
- Google sign-in works
- Improved user experience
- Faster onboarding

---

### 5. Investo API Key Configuration

**Status:** ⚠️ NOT CONFIGURED  
**Action Required:**
1. Go to https://investo.ng/developers
2. Sign up for API access
3. Get API key
4. Add to `.env` file:
   ```
   INVESTO_API_KEY=your_key_here
   ```
5. Restart server

**Impact:**
- Real market data available
- Live stock prices
- Historical data

---

## Performance Optimization Needed

### 1. Bundle Size Optimization

**Current Status:** ⚠️ Bundle size 1,325 KB (exceeds 500 KB warning)  
**Required Actions:**
1. Implement route-based code splitting
2. Lazy load non-critical components
3. Tree-shake unused dependencies
4. Optimize images and assets

**Implementation:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts', 'lightweight-charts'],
          'ui': ['lucide-react'],
        }
      }
    }
  }
}
```

**Expected Result:**
- Bundle size < 500 KB
- Faster initial load
- Better mobile performance

**Estimated Effort:** 4 hours  
**Priority:** Medium

---

### 2. Market Friction Modeling

**Current Status:** ⚠️ NOT IMPLEMENTED  
**Required Features:**
- Transaction cost modeling (brokerage, stamp duty)
- Slippage simulation
- Liquidity constraints
- NGX price limits (±10% daily)
- T+2 settlement

**Implementation:**
```typescript
// Add to evaluation.ts
interface BacktestConfig {
  transactionCost: number; // percentage
  slippage: number; // percentage
  maxVolumePercent: number; // % of daily volume
  priceLimit: number; // daily limit percentage
  settlementDelay: number; // days
}

function applyFrictions(trade: Trade, config: BacktestConfig): Trade {
  // Apply transaction costs
  trade.cost *= (1 + config.transactionCost);
  
  // Apply slippage
  trade.price *= (1 + config.slippage);
  
  // Check liquidity constraints
  if (trade.volume > dailyVolume * config.maxVolumePercent) {
    trade.volume = dailyVolume * config.maxVolumePercent;
  }
  
  // Check price limits
  if (Math.abs(trade.priceChange) > config.priceLimit) {
    trade.rejected = true;
  }
  
  return trade;
}
```

**Expected Result:**
- Realistic backtest results
- Accurate performance metrics
- Better strategy evaluation

**Estimated Effort:** 1-2 days  
**Priority:** Medium

---

## Missing Features (Low Priority)

### 1. NGX-Specific Features

**Missing:**
- Price limit detection (±10% daily)
- Suspension tracking
- Delisting detection

**Impact:** Low - Nice-to-have for NGX investors  
**Estimated Effort:** 3-5 days  
**Priority:** Low

---

### 2. Advanced Risk Metrics

**Missing:**
- Value at Risk (VaR)
- Conditional VaR (CVaR)
- Stress testing
- Scenario analysis

**Impact:** Low - Advanced features for professional users  
**Estimated Effort:** 3-5 days  
**Priority:** Low

---

### 3. Macroeconomic Data

**Missing:**
- Inflation data
- Interest rates
- Exchange rates
- Oil prices

**Impact:** Low - Contextual information  
**Estimated Effort:** 5-7 days  
**Priority:** Low

---

### 4. AI Research Assistant

**Missing:**
- Natural language query interface
- Document intelligence
- Automated summarization

**Impact:** Low - Future enhancement  
**Estimated Effort:** 2-4 weeks  
**Priority:** Low

---

## Security Audit Items

### 1. RLS Policy Verification

**Status:** ⚠️ NOT VERIFIED  
**Action Required:**
1. Sign in as User A
2. Create watchlist, portfolio, alerts
3. Sign out
4. Sign in as User B
5. Try to access User A's data via direct API calls
6. Verify RLS blocks access

**Test Query:**
```sql
-- Try to access another user's watchlist
SELECT * FROM public.watchlists
WHERE user_id = 'user-a-id';
-- Should return 0 rows
```

**Expected Result:**
- ✅ RLS policies prevent cross-user access
- ✅ No data leaks

---

### 2. API Key Exposure Check

**Status:** ⚠️ NOT VERIFIED  
**Action Required:**
1. Build production bundle
2. Search for API keys in built assets:
   ```bash
   grep -r "INVESTO_API_KEY" dist/
   grep -r "SUPABASE_" dist/
   ```
3. Verify no keys found
4. Check network requests in browser DevTools
5. Verify API keys not in request headers

**Expected Result:**
- ✅ No API keys in frontend code
- ✅ No API keys in network requests
- ✅ Keys only in server-side environment

---

## Documentation Gaps

### 1. User Documentation

**Missing:**
- User guide for new features
- Tutorial videos
- FAQ section
- Troubleshooting guide

**Impact:** Medium - Affects user onboarding  
**Estimated Effort:** 1-2 days  
**Priority:** Medium

---

### 2. API Documentation

**Missing:**
- Investo API usage guide
- Supabase schema documentation
- Data service function reference

**Impact:** Low - Internal documentation  
**Estimated Effort:** 1 day  
**Priority:** Low

---

## Testing Gaps

### 1. Integration Tests

**Missing:**
- End-to-end authentication flow tests
- Cloud sync tests
- API integration tests

**Impact:** Medium - Reduces confidence in changes  
**Estimated Effort:** 2-3 days  
**Priority:** Medium

---

### 2. E2E Tests

**Missing:**
- Playwright or Cypress tests
- User journey tests
- Cross-browser tests

**Impact:** Medium - Manual testing only  
**Estimated Effort:** 3-5 days  
**Priority:** Medium

---

## Summary

### Critical Items (Must Complete Before Launch)

1. ✅ Migrate remaining components to Supabase (3 components, 5 hours)
2. ⚠️ Configure Supabase email confirmation (15 minutes)
3. ⚠️ Configure site URL and redirects (15 minutes)
4. ⚠️ Test with live Investo API (2 hours)
5. ⚠️ Test cross-device sync (1 hour)

**Total Effort:** 8-9 hours

---

### High Priority Items (Should Complete Soon)

1. ⚠️ Configure production SMTP (1 hour)
2. ⚠️ Configure Google OAuth (1 hour)
3. ⚠️ Validate prediction models on real data (2 days)
4. ⚠️ Optimize bundle size (4 hours)
5. ⚠️ Add market friction modeling (1-2 days)

**Total Effort:** 4-6 days

---

### Medium Priority Items (Nice to Have)

1. User documentation (1-2 days)
2. Integration tests (2-3 days)
3. E2E tests (3-5 days)

**Total Effort:** 6-10 days

---

### Low Priority Items (Future Enhancements)

1. NGX-specific features (3-5 days)
2. Advanced risk metrics (3-5 days)
3. Macroeconomic data (5-7 days)
4. AI research assistant (2-4 weeks)

**Total Effort:** 1-2 months

---

## Risk Assessment

### High Risk
- ❌ Live market data not verified
- ❌ Prediction models not validated on real data
- ❌ Email delivery not tested

**Mitigation:** Complete manual testing before launch

---

### Medium Risk
- ⚠️ Cross-device sync not verified
- ⚠️ Google OAuth not tested
- ⚠️ Bundle size impacts performance

**Mitigation:** Test and optimize before launch

---

### Low Risk
- ✅ Security implemented correctly
- ✅ Backward compatibility maintained
- ✅ Error handling in place

**Mitigation:** Monitor after launch

---

## Conclusion

Phase 1 implementation is complete with 4 critical components migrated to Supabase cloud persistence. However, several items require manual configuration and testing before production launch.

**Immediate Actions Required:**
1. Configure Supabase settings (30 minutes)
2. Test with live Investo API (2 hours)
3. Test cross-device sync (1 hour)
4. Migrate remaining 3 components (5 hours)

**Total Time to Production Ready:** 1-2 days

**Status:** ⚠️ READY FOR TESTING AND CONFIGURATION
