// ============================================================
// Premium Settings Page - Account & Application Control Center
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAppState } from '../../store/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../common';
import { checkInvestoHealth } from '../../services/investoClient';
import { getUserSettings, updateUserSettings, getProfile, updateProfile } from '../../services/dataService';
import { 
  User, Shield, Palette, Bell, Database, Globe, Download, Trash2,
  Save, CheckCircle, XCircle, Loader2, AlertCircle, Eye, EyeOff,
  Moon, Sun, Monitor, Lock, Mail, Phone, MapPin, Clock, DollarSign,
  Calendar, Hash, TrendingUp, Activity, FileText, Zap
} from 'lucide-react';

type SettingsTab = 'profile' | 'preferences' | 'appearance' | 'notifications' | 'data' | 'privacy' | 'about';

export function SettingsPage() {
  const { state, dispatch } = useAppState();
  const { user, isConfigured: isAuthConfigured } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [investoStatus, setInvestoStatus] = useState<'checking' | 'configured' | 'not_configured' | 'error'>('checking');
  const [isLoading, setIsLoading] = useState(true);
  
  // Local form state for profile (to avoid saving on every keystroke)
  const [profileForm, setProfileForm] = useState({
    userName: state.settings.userName || '',
    userEmail: state.settings.userEmail || '',
  });
  
  // Update form state when settings change
  useEffect(() => {
    setProfileForm({
      userName: state.settings.userName || '',
      userEmail: state.settings.userEmail || '',
    });
  }, [state.settings.userName, state.settings.userEmail]);

  // Load cloud data when user is authenticated
  useEffect(() => {
    const loadCloudData = async () => {
      if (!user || !isAuthConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        // Load profile
        const profile = await getProfile(user.id);
        if (profile) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              userName: profile.full_name || '',
              userEmail: profile.email || '',
            }
          });
        }

        // Load settings
        const settings = await getUserSettings(user.id);
        if (settings) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              currency: settings.currency || 'NGN',
              dateFormat: settings.date_format || 'YYYY-MM-DD',
              timeFormat: settings.time_format || '24h',
              timezone: settings.timezone || 'Africa/Lagos',
              numberFormat: settings.number_format || 'standard',
              defaultHorizon: settings.default_horizon || 5,
              riskTolerance: settings.risk_tolerance || 'moderate',
              theme: settings.theme || 'dark',
              compactMode: settings.compact_mode || false,
              defaultMarket: settings.default_market || 'NGX',
              preferredIndices: settings.preferred_indices || ['ASI', 'NGX-30'],
              preferredSectors: settings.preferred_sectors || [],
              enablePriceAlerts: settings.enable_price_alerts ?? true,
              enableMarketUpdates: settings.enable_market_updates ?? true,
              enableDividendNotifications: settings.enable_dividend_notifications ?? true,
              enableAnnouncementNotifications: settings.enable_announcement_notifications ?? true,
              enableResearchNotifications: settings.enable_research_notifications ?? true,
              shareAnonymousData: settings.share_anonymous_data ?? false,
              enableAnalytics: settings.enable_analytics ?? false,
            }
          });
        }
      } catch (error) {
        console.error('Failed to load cloud data:', error);
        setErrorMessage('Failed to load settings from cloud');
      } finally {
        setIsLoading(false);
      }
    };

    loadCloudData();
  }, [user, isAuthConfigured, dispatch]);

  // Check Investo status
  useEffect(() => {
    checkInvestoHealth().then(health => {
      if (health.ok && health.investoConfigured) {
        setInvestoStatus('configured');
      } else if (health.ok && !health.investoConfigured) {
        setInvestoStatus('not_configured');
      } else {
        setInvestoStatus('error');
      }
    }).catch(() => setInvestoStatus('error'));
  }, []);

  // Auto-clear status messages
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Save profile to Supabase
  const handleSaveProfile = async (updates: { userName?: string; userEmail?: string }) => {
    if (!user || !isAuthConfigured) {
      // Fallback to localStorage for unauthenticated users
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const profileUpdates: any = {};
      if (updates.userName !== undefined) profileUpdates.full_name = updates.userName;
      if (updates.userEmail !== undefined) profileUpdates.email = updates.userEmail;

      await updateProfile(user.id, profileUpdates);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      setSaveStatus('saved');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Failed to save profile to cloud');
    }
  };

  // Save settings to Supabase
  const handleSaveSettings = async (updates: any) => {
    if (!user || !isAuthConfigured) {
      // Fallback to localStorage for unauthenticated users
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      // Map frontend keys to database keys
      const dbUpdates: any = {};
      
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.dateFormat !== undefined) dbUpdates.date_format = updates.dateFormat;
      if (updates.timeFormat !== undefined) dbUpdates.time_format = updates.timeFormat;
      if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
      if (updates.numberFormat !== undefined) dbUpdates.number_format = updates.numberFormat;
      if (updates.defaultHorizon !== undefined) dbUpdates.default_horizon = updates.defaultHorizon;
      if (updates.riskTolerance !== undefined) dbUpdates.risk_tolerance = updates.riskTolerance;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.compactMode !== undefined) dbUpdates.compact_mode = updates.compactMode;
      if (updates.defaultMarket !== undefined) dbUpdates.default_market = updates.defaultMarket;
      if (updates.preferredIndices !== undefined) dbUpdates.preferred_indices = updates.preferredIndices;
      if (updates.preferredSectors !== undefined) dbUpdates.preferred_sectors = updates.preferredSectors;
      if (updates.enablePriceAlerts !== undefined) dbUpdates.enable_price_alerts = updates.enablePriceAlerts;
      if (updates.enableMarketUpdates !== undefined) dbUpdates.enable_market_updates = updates.enableMarketUpdates;
      if (updates.enableDividendNotifications !== undefined) dbUpdates.enable_dividend_notifications = updates.enableDividendNotifications;
      if (updates.enableAnnouncementNotifications !== undefined) dbUpdates.enable_announcement_notifications = updates.enableAnnouncementNotifications;
      if (updates.enableResearchNotifications !== undefined) dbUpdates.enable_research_notifications = updates.enableResearchNotifications;
      if (updates.shareAnonymousData !== undefined) dbUpdates.share_anonymous_data = updates.shareAnonymousData;
      if (updates.enableAnalytics !== undefined) dbUpdates.enable_analytics = updates.enableAnalytics;

      await updateUserSettings(user.id, dbUpdates);
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
      setSaveStatus('saved');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setErrorMessage(error.message || 'Failed to save settings to cloud');
    }
  };

  const handleExportData = () => {
    const data = {
      settings: state.settings,
      watchlist: state.watchlist,
      reports: state.reports,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicta_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingsIcon size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'data', label: 'Data & Storage', icon: <Database size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> },
    { id: 'about', label: 'About', icon: <Globe size={16} /> },
  ];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-2 sticky top-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent-blue-glow)] text-[var(--color-accent-blue)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Profile Information</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Update your personal information</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.userName}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, userName: e.target.value });
                      }}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || profileForm.userEmail}
                      disabled
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50 opacity-60 cursor-not-allowed"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      {user?.email_confirmed_at ? (
                        <span className="text-[10px] text-[var(--color-positive)] flex items-center gap-1">
                          <CheckCircle size={10} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-warning)] flex items-center gap-1">
                          <AlertCircle size={10} />
                          Not verified
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        Email changes require verification
                      </span>
                    </div>
                  </div>

                  {user?.created_at && (
                    <div>
                      <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Account Created</label>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() => handleSaveProfile({ userName: profileForm.userName })}
                      disabled={saveStatus === 'saving' || profileForm.userName === state.settings.userName}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                          {user && isAuthConfigured ? 'Synced Across Devices' : 'Local Storage'}
                        </p>
                        <p>
                          {user && isAuthConfigured
                            ? 'Your profile information is securely stored and synced across all your devices.'
                            : 'Your profile information is stored locally in your browser. Sign in to sync across devices.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Application Preferences</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Customize how PREDICTA displays information</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <DollarSign size={12} /> Currency
                    </label>
                    <select
                      value={state.settings.currency}
                      onChange={(e) => {
                        handleSaveSettings({ currency: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <Calendar size={12} /> Date Format
                    </label>
                    <select
                      value={state.settings.dateFormat}
                      onChange={(e) => {
                        handleSaveSettings({ dateFormat: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <Clock size={12} /> Time Format
                    </label>
                    <select
                      value={state.settings.timeFormat}
                      onChange={(e) => {
                        handleSaveSettings({ timeFormat: e.target.value as '12h' | '24h' });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value="24h">24-hour</option>
                      <option value="12h">12-hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <MapPin size={12} /> Timezone
                    </label>
                    <select
                      value={state.settings.timezone}
                      onChange={(e) => {
                        handleSaveSettings({ timezone: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/New_York">America/New York</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <Hash size={12} /> Number Format
                    </label>
                    <select
                      value={state.settings.numberFormat}
                      onChange={(e) => {
                        handleSaveSettings({ numberFormat: e.target.value as 'standard' | 'compact' });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value="standard">Standard (1,234,567)</option>
                      <option value="compact">Compact (1.2M)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1.5 flex items-center gap-1">
                      <TrendingUp size={12} /> Default Forecast Horizon
                    </label>
                    <select
                      value={state.settings.defaultHorizon}
                      onChange={(e) => {
                        handleSaveSettings({ defaultHorizon: Number(e.target.value) });
                      }}
                      className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    >
                      <option value={1}>1 Session</option>
                      <option value={5}>5 Sessions</option>
                      <option value={20}>20 Sessions</option>
                      <option value={60}>60 Sessions</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Appearance</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Customize the look and feel of PREDICTA</p>
                </div>

                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setTheme('dark');
                        handleSaveSettings({ theme: 'dark' });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-glow)]'
                          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-secondary)]'
                      }`}
                    >
                      <Moon size={24} className="mx-auto mb-2 text-[var(--color-text-primary)]" />
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">Dark</p>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('light');
                        handleSaveSettings({ theme: 'light' });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-glow)]'
                          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-secondary)]'
                      }`}
                    >
                      <Sun size={24} className="mx-auto mb-2 text-[var(--color-text-primary)]" />
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">Light</p>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('system');
                        handleSaveSettings({ theme: 'system' });
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === 'system'
                          ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-glow)]'
                          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-secondary)]'
                      }`}
                    >
                      <Monitor size={24} className="mx-auto mb-2 text-[var(--color-text-primary)]" />
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">System</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.settings.compactMode}
                      onChange={(e) => {
                        handleSaveSettings({ compactMode: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Compact Mode</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Reduce spacing and padding for denser information display</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Notification Preferences</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Control what notifications you receive</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={16} className="text-[var(--color-positive)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Price Alerts</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Get notified when stocks hit target prices</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enablePriceAlerts}
                      onChange={(e) => {
                        handleSaveSettings({ enablePriceAlerts: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <Activity size={16} className="text-[var(--color-accent-blue)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Market Updates</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Daily market summary and index movements</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enableMarketUpdates}
                      onChange={(e) => {
                        handleSaveSettings({ enableMarketUpdates: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <DollarSign size={16} className="text-[var(--color-positive)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Dividend Notifications</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Announcements and payment dates for dividend stocks</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enableDividendNotifications}
                      onChange={(e) => {
                        handleSaveSettings({ enableDividendNotifications: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-[var(--color-forecast)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Announcement Notifications</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Corporate announcements and filings</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enableAnnouncementNotifications}
                      onChange={(e) => {
                        handleSaveSettings({ enableAnnouncementNotifications: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3">
                      <Zap size={16} className="text-[var(--color-warning)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Research Notifications</p>
                        <p className="text-xs text-[var(--color-text-muted)]">New research reports and analysis</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enableResearchNotifications}
                      onChange={(e) => {
                        handleSaveSettings({ enableResearchNotifications: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Data & Storage Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Data & Storage</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Manage your data and connected services</p>
                </div>

                {/* Data Providers */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Data Providers</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">CSV Import</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">Import data from CSV files</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold">ACTIVE</span>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Market Data (NGX)</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">Real-time Nigerian Exchange data</p>
                        </div>
                        {investoStatus === 'checking' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] font-bold flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" />
                            CHECKING
                          </span>
                        )}
                        {investoStatus === 'configured' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-positive-dim)] text-[var(--color-positive)] font-bold flex items-center gap-1">
                            <CheckCircle size={10} />
                            CONNECTED
                          </span>
                        )}
                        {investoStatus === 'not_configured' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-bold flex items-center gap-1">
                            <XCircle size={10} />
                            NOT CONFIGURED
                          </span>
                        )}
                        {investoStatus === 'error' && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-negative-dim)] text-[var(--color-negative)] font-bold flex items-center gap-1">
                            <XCircle size={10} />
                            ERROR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Data Management</h4>
                  <div className="space-y-3">
                    <Button variant="secondary" onClick={handleExportData} className="w-full justify-start">
                      <Download size={16} />
                      Export All Data
                    </Button>
                    <Button variant="danger" onClick={handleClearData} className="w-full justify-start">
                      <Trash2 size={16} />
                      Clear All Local Data
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Privacy & Security</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Control your privacy and data sharing preferences</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Share Anonymous Usage Data</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Help improve PREDICTA by sharing anonymous usage statistics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.shareAnonymousData}
                      onChange={(e) => {
                        handleSaveSettings({ shareAnonymousData: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Enable Analytics</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Allow performance analytics and error tracking</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.settings.enableAnalytics}
                      onChange={(e) => {
                        handleSaveSettings({ enableAnalytics: e.target.checked });
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-accent-blue)] focus:ring-[var(--color-accent-blue)] focus:ring-2"
                    />
                  </label>
                </div>

                <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-[var(--color-positive)] mt-0.5" />
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      <p className="font-semibold text-[var(--color-text-primary)] mb-2">Your Privacy Matters</p>
                      <ul className="space-y-1">
                        <li>• All data processing occurs locally in your browser</li>
                        <li>• No data is sent to external servers</li>
                        <li>• API keys are stored securely and never exposed</li>
                        <li>• No analytics or tracking scripts are included by default</li>
                        <li>• Imported datasets remain on your device</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">About PREDICTA</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Application information and version details</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">Version</span>
                        <span className="text-[var(--color-text-primary)] font-mono">0.2.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">Category</span>
                        <span className="text-[var(--color-text-primary)]">Financial Intelligence Platform</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">Architecture</span>
                        <span className="text-[var(--color-text-primary)]">React + TypeScript</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">Forecasting Models</span>
                        <span className="text-[var(--color-text-primary)]">5 Models</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Features</h4>
                    <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <li>• AI-powered stock forecasting with walk-forward validation</li>
                      <li>• Advanced technical analysis and anomaly detection</li>
                      <li>• Portfolio tracking with performance analytics</li>
                      <li>• Valuation workbench (DCF, DDM, Multiples)</li>
                      <li>• Investment journal and decision tracking</li>
                      <li>• Liquidity analysis and trading calendar</li>
                      <li>• Corporate actions processing</li>
                      <li>• Real-time NGX market data</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Resources</h4>
                    <div className="space-y-2 text-xs">
                      <a href="https://github.com/elasoruayodeji/predicta" target="_blank" rel="noopener" className="flex items-center gap-2 text-[var(--color-accent-blue)] hover:underline">
                        <Globe size={12} />
                        GitHub Repository
                      </a>
                      <a href="https://investo.ng/developers" target="_blank" rel="noopener" className="flex items-center gap-2 text-[var(--color-accent-blue)] hover:underline">
                        <Database size={12} />
                        Market Data Documentation
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Status Indicator */}
            {saveStatus === 'saving' && (
              <div className="fixed bottom-6 right-6 bg-[var(--color-accent-blue)] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="fixed bottom-6 right-6 bg-[var(--color-positive)] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Changes saved</span>
              </div>
            )}
            {saveStatus === 'error' && errorMessage && (
              <div className="fixed bottom-6 right-6 bg-[var(--color-negative)] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <XCircle size={16} />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper icon component
function SettingsIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
