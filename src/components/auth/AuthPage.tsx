// ============================================================
// Authentication Page - Login/Signup
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Mail, Lock, User, AlertCircle, Loader2, TrendingUp } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('Full name is required');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, { full_name: fullName });
        
        if (error) {
          setError(error.message || 'Failed to create account');
        } else {
          setSuccess('Account created! Please check your email to verify your account, then sign in.');
          setMode('signin');
          setPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          setError(error.message || 'Invalid email or password');
        }
        // Success is handled by AuthContext redirecting
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
        <div className="max-w-md w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle size={24} className="text-[var(--color-warning)]" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Supabase Not Configured</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Cloud features require Supabase configuration. The application will work in offline mode with localStorage.
          </p>
          <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 mb-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Required environment variables:</p>
            <code className="text-xs text-[var(--color-text-primary)] block">
              VITE_SUPABASE_URL=your-project-url<br />
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </code>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            See CLOUD_SETUP_GUIDE.md for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-blue)] flex items-center justify-center">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">PREDICTA</h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Nigerian Stock Market Intelligence Platform
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-negative-dim)] border border-[var(--color-negative)]/20">
                <AlertCircle size={16} className="text-[var(--color-negative)] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--color-negative)]">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-positive-dim)] border border-[var(--color-positive)]/20">
                <AlertCircle size={16} className="text-[var(--color-positive)] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--color-positive)]">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                  setSuccess('');
                }}
                className="text-[var(--color-accent-blue)] hover:underline font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-[var(--color-text-muted)] mt-6">
          Your data is securely stored in the cloud and synced across devices.
        </p>
      </div>
    </div>
  );
}
