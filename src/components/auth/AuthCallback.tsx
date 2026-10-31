// ============================================================
// OAuth Callback Handler
// ============================================================
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AuthCallbackProps {
  onNavigate?: (page: string) => void;
}

export function AuthCallback({ onNavigate }: AuthCallbackProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a hash with access token (OAuth callback)
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const error = params.get('error');
          const errorDescription = params.get('error_description');

          if (error) {
            setStatus('error');
            setMessage(errorDescription || 'Authentication failed');
            setTimeout(() => onNavigate?.('auth?mode=signin'), 3000);
            return;
          }

          if (accessToken && refreshToken) {
            // Set the session
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setStatus('error');
              setMessage(sessionError.message);
              setTimeout(() => onNavigate?.('auth?mode=signin'), 3000);
              return;
            }

            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            setTimeout(() => onNavigate?.('dashboard'), 1500);
            return;
          }
        }

        // If no hash, check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setMessage('Already authenticated! Redirecting...');
          setTimeout(() => onNavigate?.('dashboard'), 1500);
        } else {
          setStatus('error');
          setMessage('No authentication session found');
          setTimeout(() => onNavigate?.('auth?mode=signin'), 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
        setTimeout(() => onNavigate?.('auth?mode=signin'), 3000);
      }
    };

    handleCallback();
  }, [onNavigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="animate-spin text-[var(--color-accent-blue)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Completing Authentication
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Please wait while we verify your identity...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-[var(--color-positive)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Success!
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-[var(--color-negative)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Authentication Failed
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {message}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Redirecting to sign in page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
