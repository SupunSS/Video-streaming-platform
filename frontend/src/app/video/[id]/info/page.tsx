'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FiCalendar,
  FiClock,
  FiEye,
  FiFilm,
  FiInfo,
  FiPlay,
  FiStar,
  FiTag,
  FiTv,
  FiUser,
} from 'react-icons/fi';

import { Navbar } from '@/components/layout/Navbar';
import { API_CONFIG } from '@/config/api.config';
import { getErrorMessage } from '@/lib/api-error';
import { videoService, VideoResponse } from '@/services/video.service';

const buildUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatDuration = (seconds?: number) => {
  if (typeof seconds !== 'number' || seconds <= 0 || !Number.isFinite(seconds)) {
    return 'Unknown';
  }
  const roundedSeconds = Math.round(seconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const remainingSeconds = roundedSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
};

const formatViews = (views: number) => {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return `${views}`;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="border-b border-white/10 py-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-white/80">{value}</dd>
    </div>
  );
}

export default function VideoInfoPage() {
  const params = useParams();
  const videoId = params?.id as string;

  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [metadataDuration, setMetadataDuration] = useState<{
    videoId: string;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await videoService.getOne(videoId);
        setVideo(data);
      } catch (loadError) {
        console.warn(
          getErrorMessage(loadError, 'Failed to load video info. Check that the API server is running.'),
        );
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [videoId]);

  useEffect(() => {
    if (!video || video.duration > 0 || !video.videoUrl) return;

    let cancelled = false;
    const media = document.createElement('video');
    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      if (!cancelled && Number.isFinite(media.duration) && media.duration > 0) {
        setMetadataDuration({
          videoId: video._id,
          duration: Math.round(media.duration),
        });
      }
    };
    media.src = buildUrl(video.videoUrl);

    return () => {
      cancelled = true;
      media.removeAttribute('src');
      media.load();
    };
  }, [video]);

  const poster = buildUrl(video?.posterUrl || video?.thumbnailUrl);
  const backdrop = buildUrl(video?.thumbnailUrl || video?.posterUrl);
  const isTvShow = video?.type === 'tv_show';
  const runtime =
    video?.duration && video.duration > 0
      ? video.duration
      : metadataDuration && metadataDuration.videoId === video?._id
        ? metadataDuration.duration
        : undefined;
  const displayTitle = isTvShow && video?.seriesTitle ? video.seriesTitle : video?.title;
  const displaySubtitle = isTvShow
    ? `${video?.seasonNumber ? `Season ${video.seasonNumber}` : 'Special'}${
        video?.episodeNumber ? `, Episode ${video.episodeNumber}` : ''
      }${video?.episodeTitle ? `: ${video.episodeTitle}` : ''}`
    : 'Film';
  const ratingLabel = useMemo(() => {
    if (!video || video.ratingsCount <= 0) return 'No ratings yet';
    return `${video.averageRating.toFixed(1)} / 10`;
  }, [video]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cyber-gradient text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
          <div className="h-[560px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.05]" />
        </div>
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="min-h-screen bg-cyber-gradient text-white">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-4 pt-24">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center">
            <FiInfo className="mx-auto mb-4 h-10 w-10 text-white/35" />
            <h1 className="text-2xl font-bold">Title information unavailable</h1>
            <p className="mt-2 text-sm text-white/55">
              This film or episode could not be loaded.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-24">
        {backdrop && (
          <Image
            src={backdrop}
            alt={video.title}
            fill
            sizes="100vw"
            priority
            unoptimized
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#060814]/70 via-[#060814]/92 to-[#060814]" />

        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
          <div className="relative mx-auto aspect-2/3 w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-2xl lg:mx-0">
            {poster ? (
              <Image
                src={poster}
                alt={video.title}
                fill
                sizes="340px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/35">
                No poster
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-end">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white/75">
                {isTvShow ? <FiTv /> : <FiFilm />}
                {isTvShow ? 'TV Episode' : 'Film'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-sm text-amber-200">
                <FiStar />
                {ratingLabel}
              </span>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/90">
              {displaySubtitle}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {displayTitle}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
              {video.description || 'No synopsis has been added for this title yet.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/video/${video._id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                <FiPlay />
                Watch
              </Link>
              {video.ownerId?._id && (
                <Link
                  href={`/studio/${video.ownerId._id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white"
                >
                  <FiUser />
                  Visit Studio
                </Link>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <FiStar className="mb-2 text-amber-300" />
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Rating</p>
                <p className="mt-1 text-xl font-bold">{ratingLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <FiEye className="mb-2 text-sky-300" />
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Views</p>
                <p className="mt-1 text-xl font-bold">{formatViews(video.views)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <FiClock className="mb-2 text-cyan-300" />
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Runtime</p>
                <p className="mt-1 text-xl font-bold">{formatDuration(runtime)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <FiCalendar className="mb-2 text-violet-300" />
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Release</p>
                <p className="mt-1 text-xl font-bold">{video.releaseYear ?? 'TBA'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">Storyline</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">
            {video.description || 'No storyline is available for this title.'}
          </p>

          {(video.genres?.length || video.categories?.length) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {[...(video.genres ?? []), ...(video.categories ?? [])].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70"
                >
                  <FiTag />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <dl className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-2 text-xl font-bold">Details</h2>
          <DetailItem label="Original title" value={video.title} />
          <DetailItem label="Studio" value={video.ownerId?.username ?? 'Unknown Studio'} />
          <DetailItem label="Content type" value={isTvShow ? 'TV Show Episode' : 'Film'} />
          <DetailItem label="Runtime" value={formatDuration(runtime)} />
          <DetailItem label="Language" value={video.language} />
          <DetailItem label="Age rating" value={video.ageRating} />
          <DetailItem label="Uploaded" value={formatDate(video.createdAt)} />
          {isTvShow && (
            <>
              <DetailItem label="Series" value={video.seriesTitle} />
              <DetailItem label="Season" value={video.seasonNumber} />
              <DetailItem label="Episode" value={video.episodeNumber} />
              <DetailItem label="Episode title" value={video.episodeTitle} />
            </>
          )}
        </dl>
      </section>
    </main>
  );
}
