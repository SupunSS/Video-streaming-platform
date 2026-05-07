'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiMail, FiLock, FiUser, FiCamera, FiVideo, FiFileText } from 'react-icons/fi';
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { uploadService } from '@/services/upload.service';
import { ImageCropper } from '@/components/ui/imagecropper'; // ✅ added

const STUDIO_AGREEMENT = {
  platformName: 'Flux',
  effectiveDate: 'April 30, 2026',
  contactEmail: 'support@flux.com',
};

const studioAgreementSections = [
  {
    title: '1. Studio Registration Information',
    body: [
      'When registering as a Studio, you may be asked to provide studio name, representative name, email address, contact number, studio logo or profile image, studio description, and uploaded film, TV show, trailer, poster, and thumbnail information.',
      'You agree that all information provided is accurate, complete, and up to date.',
    ],
  },
  {
    title: '2. Use of Studio Information',
    body: [
      'Flux may use your information to create and manage your Studio account, verify your identity and account ownership, display your Studio profile to users, allow users to watch, follow, like, rate, or save your content, contact you about account updates, policy changes, or security issues, improve platform performance, safety, and user experience, and prevent fraud, copyright abuse, or unauthorized uploads.',
      'We do not sell Studio information to third parties.',
    ],
  },
  {
    title: '3. Content Ownership and Upload Permission',
    body: [
      'By uploading films, TV shows, trailers, posters, thumbnails, descriptions, or other media, you confirm that you own the uploaded content or have legal permission or a valid license to upload and distribute the content on Flux.',
      'You also confirm that your uploaded content does not violate copyright laws, trademark rights, privacy rights, publicity rights, or any third-party ownership rights.',
      'You are fully responsible for all content uploaded through your Studio account.',
    ],
  },
  {
    title: '4. Platform Permission to Display Content',
    body: [
      'By uploading content, you allow Flux to store your uploaded content, stream your uploaded films, TV shows, and trailers to users, display your titles, descriptions, posters, thumbnails, and Studio profile, and show your content in search results, recommendations, trending sections, and category pages.',
      'This permission is only for operating and promoting your content inside Flux. You keep ownership of your content.',
    ],
  },
  {
    title: '5. Public Studio Information',
    body: [
      'You understand that some Studio information may be visible to users, including studio name, studio logo, studio description, uploaded content, and public engagement data such as views, likes, ratings, and followers.',
    ],
  },
  {
    title: '6. Account Security',
    body: [
      'You are responsible for keeping your login details secure.',
      'If you believe your Studio account has been accessed without permission, you should contact Flux immediately.',
    ],
  },
  {
    title: '7. Account Suspension or Content Removal',
    body: [
      'Flux may remove uploaded content or suspend a Studio account if false information is provided, copyrighted content is uploaded without permission, content violates platform rules or laws, the account is used for harmful, illegal, misleading, or abusive activity, or the Studio misuses user data or platform features.',
    ],
  },
  {
    title: '8. Data Retention',
    body: [
      `Flux may keep Studio information while the account is active or as needed for legal, security, administrative, or business purposes. You may request account deletion by contacting ${STUDIO_AGREEMENT.contactEmail}.`,
    ],
  },
  {
    title: '9. Agreement Updates',
    body: [
      'Flux may update this agreement when needed.',
      'If major changes are made, Studios may be notified through email, account notification, or platform announcement.',
      'Continuing to use the Studio account after updates means you accept the updated agreement.',
    ],
  },
];

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
  const [accountType, setAccountType] = useState<'user' | 'studio'>('user');
  const [studioAgreementAccepted, setStudioAgreementAccepted] = useState(false);
  const [studioAgreementError, setStudioAgreementError] = useState('');

  // ✅ cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // ✅ open cropper instead of directly setting the file
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawAvatarSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);

    // reset so same file can be re-selected
    e.target.value = '';
  };

  // ✅ called when user confirms crop
  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setCropperOpen(false);
    setRawAvatarSrc(null);
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setRawAvatarSrc(null);
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (accountType === 'studio' && !studioAgreementAccepted) {
      setStudioAgreementError('You must agree to the Studio Account Privacy Policy to create a studio account.');
      return;
    }

    setStudioAgreementError('');
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
        accountType,
        studioAgreementAccepted: accountType === 'studio' ? studioAgreementAccepted : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">

      {/* ✅ Avatar cropper modal — 1:1 for profile picture */}
      {cropperOpen && rawAvatarSrc && (
        <ImageCropper
          imageSrc={rawAvatarSrc}
          aspect={1}
          title="Crop Profile Picture"
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/50 mb-8">Join FLUX and start streaming.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-white/5">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
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
                  onChange={handleAvatarChange} // ✅ now opens cropper
                  disabled={isLoading}
                />
              </label>
            </div>

            {/* ✅ show re-crop hint if avatar already selected */}
            <p className="text-sm text-white/50">
              {avatarPreview ? 'Click the camera to re-crop' : 'Add a profile picture'}
            </p>
          </div>

          {/* Account Type Toggle */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAccountType('user');
                  setStudioAgreementError('');
                }}
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

          {accountType === 'studio' && (
            <section className="rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-4">
              <div className="mb-3 flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                  <FiFileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Privacy Policy Agreement For Studio Accounts on {STUDIO_AGREEMENT.platformName}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    Effective Date: {STUDIO_AGREEMENT.effectiveDate}
                    <br />
                    Platform Name: {STUDIO_AGREEMENT.platformName}
                    <br />
                    Contact Email: {STUDIO_AGREEMENT.contactEmail}
                  </p>
                </div>
              </div>

              <p className="mb-3 text-sm leading-6 text-white/65">
                By creating a Studio Account on {STUDIO_AGREEMENT.platformName}, you agree to the
                following terms.
              </p>

              <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-4 pr-3">
                {studioAgreementSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-white/85">{section.title}</h3>
                    <div className="mt-2 space-y-2">
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-xs leading-5 text-white/55">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  checked={studioAgreementAccepted}
                  onChange={(event) => {
                    setStudioAgreementAccepted(event.target.checked);
                    if (event.target.checked) setStudioAgreementError('');
                  }}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 accent-sky-400"
                />
                <span className="text-sm leading-6 text-white/75">
                  I confirm that I have read and agree to the Studio Account Privacy Policy and
                  content ownership terms for Flux.
                </span>
              </label>

              {studioAgreementError && (
                <p className="mt-2 text-sm text-red-400">{studioAgreementError}</p>
              )}
            </section>
          )}

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
            disabled={isLoading || (accountType === 'studio' && !studioAgreementAccepted)}
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
