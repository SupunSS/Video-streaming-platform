'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiLock, FiMail, FiUser } from 'react-icons/fi';
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080a0f] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
        <p className="mb-8 text-white/50">Join FLUX and start streaming.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                <FiUser className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Viewer account</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Content uploads are managed by FLUX admins.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Username</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3">
              <FiUser className="text-white/40" />
              <input
                {...register('username')}
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="Enter username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3">
              <FiMail className="text-white/40" />
              <input
                {...register('email')}
                type="email"
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="Enter email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Password</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3">
              <FiLock className="text-white/40" />
              <input
                {...register('password')}
                type="password"
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="Enter password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Confirm Password</label>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 px-3">
              <FiLock className="text-white/40" />
              <input
                {...register('confirmPassword')}
                type="password"
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                placeholder="Confirm password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
