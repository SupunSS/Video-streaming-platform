'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiCamera, FiCheck, FiLoader } from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';
import { ImageCropper } from '@/components/ui/imagecropper';
import { uploadService } from '@/services/upload.service';
import { userService } from '@/services/user.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { notify } from '@/components/ui/CustomToast';
import { API_CONFIG } from '@/config/api.config';

const BASE_URL = API_CONFIG.BASE_URL || 'http://localhost:3000';

const buildUrl = (url?: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // avatar state
  const [avatarPreview, setAvatarPreview] = useState('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);
  const [croppedAvatarFile, setCroppedAvatarFile] = useState<File | null>(null);

  // loading states per section
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user) {
      setUsername(user.username ?? '');
      setEmail(user.email ?? '');
      setAvatarPreview(buildUrl(user.avatar));
    }
  }, [isAuthenticated, user, router]);

  // ── Avatar crop flow ──────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawAvatarSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File) => {
    setCroppedAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setCropperOpen(false);
    setRawAvatarSrc(null);
  };

  const handleSaveAvatar = async () => {
    if (!croppedAvatarFile) return;
    setSavingAvatar(true);
    try {
      const uploadRes = await uploadService.uploadThumbnail(croppedAvatarFile);
      const avatarPath = uploadRes.path || uploadRes.thumbnailUrl || uploadRes.url || '';
      const updated = await userService.updateProfile({ avatar: avatarPath });
      dispatch(setUser({ ...user!, ...updated, avatar: avatarPath }));
      setCroppedAvatarFile(null);
      notify.success('Profile picture updated!');
    } catch {
      notify.error('Failed to update profile picture');
    } finally {
      setSavingAvatar(false);
    }
  };

  // ── Username ─────────────────────────────────────────────
  const handleSaveUsername = async () => {
    if (!username.trim() || username === user?.username) return;
    setSavingUsername(true);
    try {
      const updated = await userService.updateProfile({ username: username.trim() });
      dispatch(setUser({ ...user!, username: updated.username }));
      notify.success('Username updated!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  // ── Email ─────────────────────────────────────────────────
  const handleSaveEmail = async () => {
    if (!email.trim() || email === user?.email) return;
    setSavingEmail(true);
    try {
      const updated = await userService.updateProfile({ email: email.trim() });
      dispatch(setUser({ ...user!, email: updated.email }));
      notify.success('Email updated!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <Navbar />

      {/* Avatar cropper modal */}
      {cropperOpen && rawAvatarSrc && (
        <ImageCropper
          imageSrc={rawAvatarSrc}
          aspect={1}
          title="Crop Profile Picture"
          onComplete={handleCropComplete}
          onCancel={() => { setCropperOpen(false); setRawAvatarSrc(null); }}
        />
      )}

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-28 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-white/40 text-sm mb-10">Manage your account details</p>

          <div className="space-y-4">

            {/* ── Profile Picture ── */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">
                Profile Picture
              </h2>

              <div className="flex items-center gap-6">
                {/* Avatar preview */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-white/30">
                        <FiUser className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Camera button */}
                  <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-black shadow-lg hover:bg-amber-400 transition-colors">
                    <FiCamera className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 mb-1">
                    {croppedAvatarFile ? (
                      <span className="text-amber-400">New picture ready — save to apply</span>
                    ) : (
                      'Click the camera icon to change your picture'
                    )}
                  </p>
                  <p className="text-xs text-white/30">JPG or PNG. Will be cropped to a square.</p>
                </div>

                {/* Save avatar button — only shows when a new crop is ready */}
                {croppedAvatarFile && (
                  <button
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar}
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    {savingAvatar ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    ) : (
                      <FiCheck className="h-4 w-4" />
                    )}
                    Save
                  </button>
                )}
              </div>
            </section>

            {/* ── Username ── */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">
                Username
              </h2>

              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4">
                  <FiUser className="shrink-0 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    placeholder="Enter username"
                  />
                </div>

                <button
                  onClick={handleSaveUsername}
                  disabled={savingUsername || !username.trim() || username === user.username}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingUsername ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  ) : (
                    <FiCheck className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>

              {username !== user.username && username.trim() && (
                <p className="mt-2 text-xs text-amber-400/80">Unsaved changes</p>
              )}
            </section>

            {/* ── Email ── */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-5">
                Email Address
              </h2>

              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/[0.05] px-4">
                  <FiMail className="shrink-0 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    placeholder="Enter email"
                  />
                </div>

                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !email.trim() || email === user.email}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingEmail ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  ) : (
                    <FiCheck className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>

              {email !== user.email && email.trim() && (
                <p className="mt-2 text-xs text-amber-400/80">Unsaved changes</p>
              )}
            </section>

          </div>
        </motion.div>
      </main>
    </div>
  );
}