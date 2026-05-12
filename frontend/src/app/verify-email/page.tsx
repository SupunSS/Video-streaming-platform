'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiMail, FiRefreshCw } from 'react-icons/fi';
import { authService } from '@/services/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { notify } from '@/components/ui/CustomToast';
import { getErrorMessage } from '@/lib/api-error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const token = searchParams.get('token') ?? '';
  const initialEmail = searchParams.get('email') ?? '';
  const devVerificationUrl = searchParams.get('devVerificationUrl') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const title = useMemo(
    () => (token ? 'Verify your email' : 'Check your inbox'),
    [token],
  );

  const handleVerify = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await authService.verifyEmail(token);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      setVerified(true);
      notify.success('Email verified');
      router.push('/');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Email verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      notify.error('Enter your email first');
      return;
    }

    try {
      setLoading(true);
      const data = await authService.resendVerification(email.trim());
      notify.success(data.message || 'Verification email sent');
    } catch (err: unknown) {
      notify.error(getErrorMessage(err, 'Failed to resend verification email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient px-4 py-10 text-white">
      <main className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-8 backdrop-blur-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200">
            {verified ? <FiCheckCircle className="h-7 w-7" /> : <FiMail className="h-7 w-7" />}
          </div>

          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            {token
              ? 'Click the button below to approve your FLUX account.'
              : 'We sent a verification button to your email. Open it to approve your account before signing in.'}
          </p>

          {token ? (
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || verified}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              {loading && <FiRefreshCw className="animate-spin" />}
              Verify Email
            </button>
          ) : (
            <div className="mt-7 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="input-glass"
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {loading && <FiRefreshCw className="animate-spin" />}
                Resend Verification Email
              </button>
            </div>
          )}

          {devVerificationUrl && (
            <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              SMTP is not configured locally. Open this development verification link:
              <Link
                href={devVerificationUrl}
                className="mt-2 block break-all font-medium text-amber-200 underline"
              >
                {devVerificationUrl}
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/45">
            Already verified?{' '}
            <Link href="/login" className="font-medium text-sky-200 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
