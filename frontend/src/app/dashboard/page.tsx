'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { videoService, VideoResponse } from '@/services/video.service';
import { API_CONFIG } from '@/config/api.config';
import { Video } from '@/types/video.types';

const mapToVideo = (v: VideoResponse): Video => ({
  id: v._id,
  title: v.title,
  description: v.description || '',
  thumbnail: v.thumbnailUrl?.startsWith('http')
    ? v.thumbnailUrl
    : `${API_CONFIG.BASE_URL}${v.thumbnailUrl}`,
  duration: v.duration || 0,
  views: v.views || 0,
  channel: 'My Channel',
  uploadedAt: new Date(v.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  hlsUrl: v.videoUrl?.startsWith('http')
    ? v.videoUrl
    : `${API_CONFIG.BASE_URL}${v.videoUrl}`,
  status: 'ready',
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-5 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-semibold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({
  video,
  onDelete,
}: {
  video: Video;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/[0.07] bg-[#0d0f14] transition-all duration-300"
      style={{
        boxShadow: hovered ? '0 0 0 1.5px rgba(245,165,36,0.35)' : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black/40">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-10 w-10 text-white/10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Play button on hover */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <Link
            href={`/watch/${video.id}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 shadow-lg transition-transform hover:scale-110"
          >
            <svg className="h-5 w-5 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </Link>
        </div>

        {/* Duration badge */}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white/80 font-medium tracking-wide">
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
          </span>
        )}

        {/* Views badge */}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white/50">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {video.views}
        </span>
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-white line-clamp-1 mb-0.5">{video.title}</h3>
        <p className="text-xs text-white/35 line-clamp-1 mb-3">
          {video.description || 'No description'}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/25">{video.uploadedAt}</span>
          <div className="flex gap-2">
            <Link
              href={`/watch/${video.id}`}
              className="rounded-md bg-white/[0.07] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.12] hover:text-white transition-colors"
            >
              View
            </Link>
            <button
              onClick={() => onDelete(video.id)}
              className="rounded-md bg-red-500/[0.12] px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/[0.22] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ video }: { video: Video }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
      {/* Background image */}
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Dark overlays — matches home page style */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end px-10 pb-10 md:px-14">
        {/* Meta badges */}
        <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-medium">8.5</span>
          </span>
          <span className="text-white/30">•</span>
          <span>2024</span>
          <span className="text-white/30">•</span>
          <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            HD
          </span>
          <span className="text-white/30">•</span>
          <span className="text-amber-400 font-medium">#1 on FLUX Today</span>
        </div>

        {/* Title */}
        <h1
          className="mb-3 font-extrabold text-white leading-none tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {video.title}
        </h1>

        {/* Description */}
        <p className="mb-6 max-w-lg text-sm text-white/55 leading-relaxed line-clamp-2">
          {video.description || 'No description available for this video.'}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/watch/${video.id}`}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Link>

          <Link
            href={`/watch/${video.id}`}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/15 backdrop-blur-sm transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
            </svg>
            More Info
          </Link>

          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/15 backdrop-blur-sm transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Row ──────────────────────────────────────────────────────────────
function SectionRow({
  title,
  icon,
  accentColor = 'text-white',
  videos,
  onDelete,
}: {
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  videos: Video[];
  onDelete: (id: string) => void;
}) {
  if (videos.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className={accentColor}>{icon}</span>}
        <h2 className={`text-lg font-semibold ${accentColor}`}>{title}</h2>
        <div className={`mt-0.5 h-0.5 w-8 rounded-full ${accentColor.replace('text-', 'bg-')}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [rawVideos, setRawVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const videos = useMemo(() => rawVideos.map(mapToVideo), [rawVideos]);

  const featuredVideo = videos[0] ?? null;

  // Sort copies for sections
  const recentVideos = [...videos].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  const popularVideos = [...videos].sort((a, b) => b.views - a.views);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchMyVideos = async () => {
      try {
        const data = await videoService.getMyVideos();
        setRawVideos(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchMyVideos();
  }, [router]);

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    // TODO: wire real delete API call here
    setRawVideos((prev) => prev.filter((v) => v._id !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-white/40 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080a0f]">
      <Navbar />

      {/* ── Hero banner (first video) ── */}
     {featuredVideo && !error && <HeroBanner video={featuredVideo} />}


         <main className="px-6 md:px-10 lg:px-14 py-8 pt-24">
        {/* ── Page header row ── */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            <p className="mt-1 text-sm text-white/40">Manage your uploaded videos</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload Video
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Stats row ── */}
        {!error && videos.length > 0 && (
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Videos"
              value={videos.length}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              }
            />
            <StatCard
              label="Total Views"
              value={videos.reduce((s, v) => s + v.views, 0).toLocaleString()}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
            <StatCard
              label="Most Viewed"
              value={popularVideos[0]?.title.slice(0, 14) + '…' ?? '—'}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <StatCard
              label="Latest Upload"
              value={recentVideos[0]?.uploadedAt ?? '—'}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        )}

        {/* ── Empty state ── */}
        {!error && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-white">No videos uploaded yet</h2>
            <p className="mb-6 text-sm text-white/40">Upload your first video and it will appear here.</p>
            <Link
              href="/upload"
              className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              Go to Upload
            </Link>
          </div>
        )}

        {/* ── Video sections ── */}
        {!error && videos.length > 0 && (
          <>
            <SectionRow
              title="All My Videos"
              accentColor="text-white"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              }
              videos={videos}
              onDelete={handleDelete}
            />

            {popularVideos.length > 1 && (
              <SectionRow
                title="Most Viewed"
                accentColor="text-amber-400"
                icon={
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                }
                videos={popularVideos}
                onDelete={handleDelete}
              />
            )}

            <SectionRow
              title="Recent Uploads"
              accentColor="text-sky-400"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              videos={recentVideos}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Delete video?</h3>
            <p className="mt-1 text-sm text-white/40">
              This action cannot be undone. The video will be permanently removed.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] py-2.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-500/80 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}