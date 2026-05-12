'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiLock, FiEye, FiEyeOff, FiTrash2, FiUser } from 'react-icons/fi';
import Image from 'next/image';
import { CredentialResponse, useGoogleOAuth } from '@react-oauth/google';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/useAuth';
import { API_CONFIG } from '@/config/api.config';
import {
  forgetRememberedAccount,
  getRememberedAccounts,
  EMPTY_REMEMBERED_ACCOUNTS,
  subscribeToRememberedAccounts,
} from '@/lib/remembered-accounts';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: 'filled_black';
              size: 'large';
              width: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
    __fluxGoogleIdentityClientId?: string;
    __fluxGoogleCredentialHandler?: (response: CredentialResponse) => void;
  }
}

const buildAvatarSrc = (avatar?: string) => {
  if (!avatar) return '';
  return avatar.startsWith('http')
    ? avatar
    : `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/${avatar.replace(/^\/+/, '')}`;
};

function FluxGoogleLoginButton({
  onSuccess,
  onError,
}: {
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
}) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const { clientId, locale, scriptLoadedSuccessfully } = useGoogleOAuth();

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!scriptLoadedSuccessfully || !buttonRef.current) return;

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) return;

    window.__fluxGoogleCredentialHandler = (credentialResponse) => {
      if (!credentialResponse.credential) {
        onErrorRef.current();
        return;
      }

      onSuccessRef.current(credentialResponse);
    };

    if (window.__fluxGoogleIdentityClientId !== clientId) {
      googleIdentity.initialize({
        client_id: clientId,
        callback: (credentialResponse) => {
          window.__fluxGoogleCredentialHandler?.(credentialResponse);
        },
      });
      window.__fluxGoogleIdentityClientId = clientId;
    }

    buttonRef.current.replaceChildren();
    googleIdentity.renderButton(buttonRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: '320',
      locale,
    });
  }, [clientId, locale, scriptLoadedSuccessfully]);

  return <div ref={buttonRef} className="min-h-10" />;
}

export default function LoginPage() {
  const { loginUser, googleLoginUser, switchRememberedAccount } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const rememberedAccounts = useSyncExternalStore(
    subscribeToRememberedAccounts,
    getRememberedAccounts,
    () => EMPTY_REMEMBERED_ACCOUNTS,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      await loginUser({
        email: data.email,
        password: data.password,
      }, { remember: rememberMe });
    } catch {
      // errors handled inside useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setIsGoogleLoading(true);

      if (!credentialResponse.credential) {
        toast.error('Google login failed');
        return;
      }

      await googleLoginUser(credentialResponse.credential, {
        remember: rememberMe,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLoginUser, rememberMe]);

  const handleGoogleError = useCallback(() => {
    toast.error('Google login failed');
  }, []);

  const handleForgetAccount = (accountId: string) => {
    forgetRememberedAccount(accountId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cyber-gradient relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-magenta/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="relative w-16 h-16"
            >
              <Image
                src="/images/Flux_Logo.png"
                alt="Flux Logo"
                fill
                sizes="64px"
                className="object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                priority
              />
            </motion.div>

            <span
              className="text-2xl font-black tracking-widest text-white"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.2em',
              }}
            >
              FLUX
            </span>
          </div>

          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent">
            Welcome Back
          </h2>

          <p className="text-center text-white/60 mb-8">
            Sign in to continue to FLUX
          </p>

          {rememberedAccounts.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">
                  Remembered accounts
                </p>
                <span className="text-xs text-white/35">
                  Click to switch
                </span>
              </div>

              <div className="space-y-2">
                {rememberedAccounts.map((account) => {
                  const accountAvatar = buildAvatarSrc(account.user.avatar);

                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <button
                        type="button"
                        onClick={() => switchRememberedAccount(account)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
                          {accountAvatar ? (
                            <Image
                              src={accountAvatar}
                              alt={account.user.username}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FiUser className="h-4 w-4 text-white/65" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {account.user.username}
                          </p>
                          <p className="truncate text-xs text-white/45">
                            {account.user.email}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleForgetAccount(account.id)}
                        className="rounded-full p-2 text-white/35 transition hover:bg-white/[0.08] hover:text-red-300"
                        aria-label={`Forget ${account.user.username}`}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email address"
                  className="input-glass pl-12"
                  disabled={isLoading}
                />
              </div>

              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neon-magenta text-sm mt-1"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />

                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="input-glass pl-12 pr-12"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-neon-magenta text-sm mt-1"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-glass-light text-neon-cyan focus:ring-neon-cyan focus:ring-offset-0"
                />
                <span className="text-sm text-white/60">Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-neon-cyan hover:text-neon-magenta transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-neon w-full relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-dark-300 px-2 text-white/40">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              {isGoogleLoading ? (
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-3 px-4 py-2.5 bg-glass-light backdrop-blur-xl border border-white/10 rounded-lg opacity-70"
                >
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-sm font-medium">
                    Connecting to Google...
                  </span>
                </button>
              ) : (
                <FluxGoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />
              )}
            </div>
          </form>

          <p className="text-center text-white/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-neon-cyan hover:text-neon-magenta transition-colors font-semibold"
            >
              Sign up
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-white/45">
            Need a new verification email?{' '}
            <Link
              href="/verify-email"
              className="font-semibold text-neon-cyan transition-colors hover:text-neon-magenta"
            >
              Resend it
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
