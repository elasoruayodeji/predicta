// ============================================================
// Reset Password Page
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Lock, AlertCircle, Loader2, TrendingUp, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const { updatePassword, isConfigured } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkRecoveryToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidToken(true);
      }
    };
    checkRecoveryToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error.message || 'Failed to update password');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('auth?mode=signin');
        }, 3000);
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
            Password reset requires Supabase configuration.
          </p>
          <Button variant="secondary" onClick={() => onNavigate('landing')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidToken && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
        <div className="max-w-md w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-negative)]/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-[var(--color-negative)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button
              variant="primary"
              onClick={() => onNavigate('auth/forgot-password')}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
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
        </div>

        {/* Reset Password Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-[var(--color-accent-blue)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Reset Your Password
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Create a new secure password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">New Password</label>
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
                </div>

                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-negative-dim)] border border-[var(--color-negative)]/20">
                    <AlertCircle size={16} className="text-[var(--color-negative)] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--color-negative)]">{error}</p>
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
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]">
                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  Password must be at least 6 characters long
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[var(--color-positive)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                Password Updated!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Your password has been successfully reset
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Redirecting to sign in...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
