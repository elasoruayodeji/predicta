// ============================================================
// Theme Context & Provider
// ============================================================
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings } from '../services/dataService';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured } = useAuth();
  // Default to light mode for unauthenticated users (landing page)
  const [theme, setThemeState] = useState<Theme>(user ? 'dark' : 'light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(user ? 'dark' : 'light');

  // Load theme from cloud or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      if (user && isConfigured) {
        try {
          const settings = await getUserSettings(user.id);
          if (settings?.theme) {
            setThemeState(settings.theme as Theme);
          }
        } catch (error) {
          console.error('Failed to load theme from cloud:', error);
        }
      } else {
        // For unauthenticated users, default to light mode
        // Check localStorage for authenticated user's preference
        const saved = localStorage.getItem('predicta_theme') as Theme;
        if (saved && user) {
          setThemeState(saved);
        } else {
          // Default to light for landing page
          setThemeState('light');
        }
      }
    };

    loadTheme();
  }, [user, isConfigured]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both theme classes first
    root.classList.remove('light', 'dark');
    
    // Determine resolved theme
    let resolved: 'light' | 'dark' = 'dark';
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      resolved = systemTheme;
    } else {
      resolved = theme;
    }
    
    // Apply theme
    root.classList.add(resolved);
    setResolvedTheme(resolved);
    
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to cloud if authenticated
    if (user && isConfigured) {
      try {
        await updateUserSettings(user.id, { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme to cloud:', error);
      }
    }
    
    // Always save to localStorage as fallback
    localStorage.setItem('predicta_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
