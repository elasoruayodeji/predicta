-- ============================================================
-- PREDICTA Database Schema
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to create the schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Preferences
  currency TEXT DEFAULT 'NGN',
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  time_format TEXT DEFAULT '24h',
  timezone TEXT DEFAULT 'Africa/Lagos',
  number_format TEXT DEFAULT 'standard',
  default_horizon INTEGER DEFAULT 5,
  risk_tolerance TEXT DEFAULT 'moderate',
  
  -- Appearance
  theme TEXT DEFAULT 'dark',
  compact_mode BOOLEAN DEFAULT false,
  
  -- Market Preferences
  default_market TEXT DEFAULT 'NGX',
  preferred_indices TEXT[] DEFAULT ARRAY['ASI', 'NGX-30'],
  preferred_sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Notifications
  enable_price_alerts BOOLEAN DEFAULT true,
  enable_market_updates BOOLEAN DEFAULT true,
  enable_dividend_notifications BOOLEAN DEFAULT true,
  enable_announcement_notifications BOOLEAN DEFAULT true,
  enable_research_notifications BOOLEAN DEFAULT true,
  
  -- Privacy
  share_anonymous_data BOOLEAN DEFAULT false,
  enable_analytics BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WATCHLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  exchange TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol)
);

-- ============================================================
-- PORTFOLIO ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portfolio_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  currency TEXT DEFAULT 'NGN',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PORTFOLIO TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.portfolio_accounts(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend', 'bonus', 'rights')),
  transaction_date DATE NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL CHECK (quantity > 0),
  price_per_share DECIMAL(15, 4) NOT NULL CHECK (price_per_share >= 0),
  fees DECIMAL(15, 4) DEFAULT 0 CHECK (fees >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.portfolio_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON public.portfolio_transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.portfolio_transactions(transaction_date);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'volume_spike', 'percent_change', 'custom')),
  condition_value DECIMAL(15, 4),
  condition_percent DECIMAL(5, 2),
  condition_message TEXT,
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;

-- ============================================================
-- ALERT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_value DECIMAL(15, 4),
  threshold_value DECIMAL(15, 4),
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON public.alert_history(alert_id);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('dividend_declaration', 'dividend_qualification', 'dividend_payment', 'agm', 'earnings', 'corporate_action')),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  amount DECIMAL(15, 4),
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_user ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_symbol ON public.calendar_events(symbol);

-- ============================================================
-- INVESTMENT JOURNAL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('buy', 'sell', 'thesis', 'review', 'lesson')),
  entry_date DATE NOT NULL,
  
  -- For buy/sell
  quantity DECIMAL(15, 4),
  price DECIMAL(15, 4),
  thesis TEXT,
  target_price DECIMAL(15, 4),
  stop_loss DECIMAL(15, 4),
  time_horizon TEXT CHECK (time_horizon IN ('short', 'medium', 'long')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  
  -- For thesis/review/lesson
  content TEXT,
  
  -- Outcome tracking
  actual_return DECIMAL(10, 4),
  expected_return DECIMAL(10, 4),
  accuracy TEXT CHECK (accuracy IN ('accurate', 'partially_accurate', 'inaccurate')),
  lessons TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_symbol ON public.journal_entries(symbol);
CREATE INDEX IF NOT EXISTS idx_journal_date ON public.journal_entries(entry_date);

-- ============================================================
-- SAVED RESEARCH
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_research (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  symbol TEXT,
  research_type TEXT NOT NULL CHECK (research_type IN ('analysis', 'forecast', 'valuation', 'report')),
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_user ON public.saved_research(user_id);
CREATE INDEX IF NOT EXISTS idx_research_symbol ON public.saved_research(symbol);

-- ============================================================
-- SCREENER PRESETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.screener_presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  sort_key TEXT,
  sort_direction TEXT DEFAULT 'desc',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presets_user ON public.screener_presets(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screener_presets ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Settings: Users can view and update their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Watchlists: Users can manage their own watchlists
CREATE POLICY "Users can view own watchlists" ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists" ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON public.watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist Items: Users can manage items in their own watchlists
CREATE POLICY "Users can view own watchlist items" ON public.watchlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own watchlist items" ON public.watchlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own watchlist items" ON public.watchlist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own watchlist items" ON public.watchlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE watchlists.id = watchlist_items.watchlist_id
      AND watchlists.user_id = auth.uid()
    )
  );

-- Portfolio Accounts: Users can manage their own accounts
CREATE POLICY "Users can view own portfolio accounts" ON public.portfolio_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio accounts" ON public.portfolio_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio accounts" ON public.portfolio_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio accounts" ON public.portfolio_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Transactions: Users can manage transactions in their own accounts
CREATE POLICY "Users can view own transactions" ON public.portfolio_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_accounts
      WHERE portfolio_accounts.id = portfolio_transactions.account_id
      AND portfolio_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions" ON public.portfolio_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.portfolio_accounts
      WHERE portfolio_accounts.id = portfolio_transactions.account_id
      AND portfolio_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own transactions" ON public.portfolio_transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_accounts
      WHERE portfolio_accounts.id = portfolio_transactions.account_id
      AND portfolio_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own transactions" ON public.portfolio_transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_accounts
      WHERE portfolio_accounts.id = portfolio_transactions.account_id
      AND portfolio_accounts.user_id = auth.uid()
    )
  );

-- Alerts: Users can manage their own alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Alert History: Users can view history of their own alerts
CREATE POLICY "Users can view own alert history" ON public.alert_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = alert_history.alert_id
      AND alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own alert history" ON public.alert_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = alert_history.alert_id
      AND alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alert history" ON public.alert_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.alerts
      WHERE alerts.id = alert_history.alert_id
      AND alerts.user_id = auth.uid()
    )
  );

-- Calendar Events: Users can manage their own events
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Journal Entries: Users can manage their own entries
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Saved Research: Users can manage their own research
CREATE POLICY "Users can view own research" ON public.saved_research
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own research" ON public.saved_research
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research" ON public.saved_research
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own research" ON public.saved_research
  FOR DELETE USING (auth.uid() = user_id);

-- Screener Presets: Users can manage their own presets
CREATE POLICY "Users can view own presets" ON public.screener_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON public.screener_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON public.screener_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON public.screener_presets
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_accounts_updated_at BEFORE UPDATE ON public.portfolio_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_transactions_updated_at BEFORE UPDATE ON public.portfolio_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_research_updated_at BEFORE UPDATE ON public.saved_research
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screener_presets_updated_at BEFORE UPDATE ON public.screener_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile and settings on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default watchlist
  INSERT INTO public.watchlists (user_id, name, is_default)
  VALUES (NEW.id, 'My Watchlist', true);
  
  -- Create default portfolio account
  INSERT INTO public.portfolio_accounts (user_id, name, is_default)
  VALUES (NEW.id, 'My Portfolio', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
