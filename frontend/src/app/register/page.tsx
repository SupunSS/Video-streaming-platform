'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiLock, FiUser, FiCamera, FiVideo } from 'react-icons/fi'; // ✅ added FiVideo
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { uploadService } from '@/services/upload.service';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'studio'>('user'); // ✅ moved inside component

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      let avatar = '';

      if (avatarFile) {
        const uploadRes = await uploadService.uploadThumbnail(avatarFile);
        avatar = uploadRes.path || uploadRes.thumbnailUrl || uploadRes.url || '';
      }

      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        avatar,
        accountType, // ✅ passed to registerUser
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/50 mb-8">Join FLUX and start streaming.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-white/5">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/30">
                    <FiUser className="h-10 w-10" />
                  </div>
                )}
              </div>

              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:bg-amber-400 transition-colors">
                <FiCamera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isLoading}
                />
              </label>
            </div>
            <p className="text-sm text-white/50">Add a profile picture</p>
          </div>

          {/* Account Type Toggle */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                  accountType === 'user'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <FiUser className="h-4 w-4" />
                Viewer
              </button>

              <button
                type="button"
                onClick={() => setAccountType('studio')}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                  accountType === 'studio'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                <FiVideo className="h-4 w-4" />
                Studio
              </button>
            </div>
            <p className="mt-1.5 text-xs text-white/35">
              {accountType === 'studio'
                ? 'Studio accounts can upload films and TV shows.'
                : 'Viewer accounts can watch and follow studios.'}
            </p>
          </div>

          {/* Username */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
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