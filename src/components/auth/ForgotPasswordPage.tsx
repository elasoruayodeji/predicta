// ============================================================
// Forgot Password Page
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Mail, AlertCircle, Loader2, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { resetPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message || 'Failed to send password reset email');
      } else {
        setSuccess(true);
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
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Service Not Available</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Password reset is currently unavailable. Please try again later.
          </p>
          <Button variant="secondary" onClick={() => onNavigate('landing')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>
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

        {/* Forgot Password Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-[var(--color-accent-blue)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Forgot Password?
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No worries, we'll send you reset instructions
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]">
                <button
                  onClick={() => onNavigate('auth?mode=signin')}
                  className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-accent-blue)] hover:underline"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-[var(--color-positive)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Check Your Email
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  We've sent password reset instructions to <strong className="text-[var(--color-text-primary)]">{email}</strong>
                </p>
              </div>

              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 mb-6">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  <strong className="text-[var(--color-text-primary)]">What's next?</strong>
                </p>
                <ol className="text-xs text-[var(--color-text-secondary)] space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Try Different Email
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => onNavigate('auth?mode=signin')}
                  className="w-full"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => {
                setSuccess(false);
                setError('');
              }}
              className="text-[var(--color-accent-blue)] hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
