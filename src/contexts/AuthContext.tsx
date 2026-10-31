// ============================================================
// Authentication Context & Provider
// ============================================================
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  isConfigured: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    return { error };
  };

  // Check if user's email is verified
  const isEmailVerified = user?.email_confirmed_at !== undefined;

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    isConfigured: isSupabaseConfigured(),
    isEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
