// ============================================================
// Authentication Page - Login/Signup
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Mail, Lock, User, AlertCircle, Loader2, TrendingUp, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onNavigate?: (page: string) => void;
}

export function AuthPage({ initialMode = 'signin', onNavigate }: AuthPageProps) {
  const { signIn, signUp, signInWithGoogle, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle URL parameters for mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'signup' || urlMode === 'signin') {
      setMode(urlMode);
    }
  }, []);

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

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message || 'Failed to sign in with Google');
        setLoading(false);
      }
      // Success is handled by OAuth callback redirect
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signin' && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('auth/forgot-password')}
                  className="text-xs text-[var(--color-accent-blue)] hover:underline mt-1"
                >
                  Forgot password?
                </button>
              )}
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-primary)]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--color-bg-secondary)] px-2 text-[var(--color-text-muted)]">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Connecting...' : 'Sign in with Google'}
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
