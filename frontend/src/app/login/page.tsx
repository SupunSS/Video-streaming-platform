'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginUser, googleLoginUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      });
    } catch {
      // errors handled inside useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setIsGoogleLoading(true);

      if (!credentialResponse.credential) {
        toast.error('Google login failed');
        return;
      }

      await googleLoginUser(credentialResponse.credential);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
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
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google login failed')}
                  theme="filled_black"
                  size="large"
                  width="320"
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
        </div>
      </motion.div>
    </div>
  );
}
