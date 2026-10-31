// ============================================================
// Data Service Layer - Cloud Database Operations
// ============================================================
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// ============================================================
// PROFILES
// ============================================================
export async function getProfile(userId: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================
// USER SETTINGS
// ============================================================
export async function getUserSettings(userId: string) {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserSettings(userId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================
// WATCHLISTS
// ============================================================
export async function getWatchlists(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('watchlists')
    .select(`
      *,
      watchlist_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createWatchlist(userId: string, name: string, description?: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: userId, name, description })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWatchlist(watchlistId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('watchlists')
    .update(updates)
    .eq('id', watchlistId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteWatchlist(watchlistId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('id', watchlistId);
  
  if (error) throw error;
}

export async function addWatchlistItem(watchlistId: string, symbol: string, name?: string, exchange?: string, notes?: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('watchlist_items')
    .insert({ watchlist_id: watchlistId, symbol, name, exchange, notes })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeWatchlistItem(itemId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('id', itemId);
  
  if (error) throw error;
}

// ============================================================
// PORTFOLIO
// ============================================================
export async function getPortfolioAccounts(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('portfolio_accounts')
    .select(`
      *,
      portfolio_transactions(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createPortfolioAccount(userId: string, name: string, currency: string = 'NGN') {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('portfolio_accounts')
    .insert({ user_id: userId, name, currency })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function addTransaction(accountId: string, transaction: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('portfolio_transactions')
    .insert({ account_id: accountId, ...transaction })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTransaction(transactionId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('portfolio_transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTransaction(transactionId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('portfolio_transactions')
    .delete()
    .eq('id', transactionId);
  
  if (error) throw error;
}

// ============================================================
// ALERTS
// ============================================================
export async function getAlerts(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createAlert(userId: string, alert: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('alerts')
    .insert({ user_id: userId, ...alert })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateAlert(alertId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteAlert(alertId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);
  
  if (error) throw error;
}

export async function recordAlertTrigger(alertId: string, currentValue: number, thresholdValue: number, message: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('alert_history')
    .insert({
      alert_id: alertId,
      current_value: currentValue,
      threshold_value: thresholdValue,
      message,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update alert status
  await updateAlert(alertId, {
    is_triggered: true,
    triggered_at: new Date().toISOString(),
  });
  
  return data;
}

// ============================================================
// CALENDAR EVENTS
// ============================================================
export async function getCalendarEvents(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function createCalendarEvent(userId: string, event: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ user_id: userId, ...event })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(eventId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(eventId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);
  
  if (error) throw error;
}

// ============================================================
// JOURNAL ENTRIES
// ============================================================
export async function getJournalEntries(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createJournalEntry(userId: string, entry: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userId, ...entry })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateJournalEntry(entryId: string, updates: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(entryId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);
  
  if (error) throw error;
}

// ============================================================
// SAVED RESEARCH
// ============================================================
export async function getSavedResearch(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('saved_research')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createSavedResearch(userId: string, research: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('saved_research')
    .insert({ user_id: userId, ...research })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSavedResearch(researchId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('saved_research')
    .delete()
    .eq('id', researchId);
  
  if (error) throw error;
}

// ============================================================
// SCREENER PRESETS
// ============================================================
export async function getScreenerPresets(userId: string) {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('screener_presets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createScreenerPreset(userId: string, preset: any) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('screener_presets')
    .insert({ user_id: userId, ...preset })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteScreenerPreset(presetId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  
  const { error } = await supabase
    .from('screener_presets')
    .delete()
    .eq('id', presetId);
  
  if (error) throw error;
}
