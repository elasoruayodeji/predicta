// ============================================================
// Email Verification Page
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { Mail, CheckCircle, AlertCircle, Loader2, TrendingUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface VerifyEmailPageProps {
  onNavigate: (page: string) => void;
}

export function VerifyEmailPage({ onNavigate }: VerifyEmailPageProps) {
  const { user, resendVerificationEmail, isConfigured } = useAuth();
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Check if we're coming from an email verification link
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');

      if (type === 'signup' && accessToken) {
        handleVerification(accessToken);
      }
    }
  }, []);

  const handleVerification = async (accessToken: string) => {
    setStatus('verifying');
    setMessage('Verifying your email...');

    try {
      // Supabase automatically handles email verification when the user clicks the link
      // We just need to check if the session is valid
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setStatus('error');
        setMessage('Verification failed. The link may have expired or is invalid.');
      } else {
        setStatus('success');
        setMessage('Email verified successfully!');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResending(true);
    setMessage('');

    try {
      const { error } = await resendVerificationEmail(user.email);

      if (error) {
        setMessage(error.message || 'Failed to resend verification email');
      } else {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred');
    } finally {
      setResending(false);
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
            Email verification is currently unavailable. Please try again later.
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

        {/* Verification Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-8">
          {status === 'pending' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-[var(--color-accent-blue)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  We've sent a verification link to <strong className="text-[var(--color-text-primary)]">{user?.email}</strong>
                </p>
              </div>

              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 mb-6">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  <strong className="text-[var(--color-text-primary)]">What's next?</strong>
                </p>
                <ol className="text-xs text-[var(--color-text-secondary)] space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the verification link</li>
                  <li>Return to PREDICTA to access your account</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Home
                </Button>
              </div>

              {message && (
                <div className="mt-4 p-3 rounded-lg bg-[var(--color-accent-blue-glow)] border border-[var(--color-accent-blue)]/20">
                  <p className="text-xs text-[var(--color-accent-blue)]">{message}</p>
                </div>
              )}
            </>
          )}

          {status === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 size={48} className="animate-spin text-[var(--color-accent-blue)] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                Verifying Email
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[var(--color-positive)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                Email Verified!
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">{message}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--color-negative)]/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-[var(--color-negative)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Verification Failed
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Home
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
              onClick={handleResendVerification}
              disabled={resending}
              className="text-[var(--color-accent-blue)] hover:underline"
            >
              resend it
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
