'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiDownload,
  FiEye,
  FiHeart,
  FiList,
  FiPlay,
  FiPlus,
  FiShare2,
  FiStar,
} from 'react-icons/fi';
import { notify } from "@/components/ui/CustomToast";

import { Navbar } from '@/components/layout/Navbar';
import { CommentSection } from '@/components/video/CommentSection';
import VideoPlayer from '@/components/video/VideoPlayer';
import { API_CONFIG } from '@/config/api.config';
import { videoService, VideoResponse } from '@/services/video.service';
import axiosInstance from '@/lib/axios';

const BASE_URL = API_CONFIG.BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const buildUrl = (url?: string): string => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
};

const formatViews = (views: number): string => {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatFullDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const formatCompactDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="aspect-video animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
            <div className="glass-card h-40 animate-pulse" />
            <div className="glass-card h-72 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="glass-card h-28 animate-pulse" />
            <div className="glass-card h-28 animate-pulse" />
            <div className="glass-card h-28 animate-pulse" />
            <div className="glass-card h-28 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WatchPageError() {
  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center px-4 pt-24 sm:px-6 lg:px-8">
        <div className="glass-card w-full max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <FiPlay className="text-xl" />
          </div>
          <h1 className="text-2xl font-bold">Video not found</h1>
          <p className="mt-3 text-sm text-white/60">
            The video could not be loaded. It may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaPill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 backdrop-blur-xl">
      <span className="text-white/55">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active = false,
  primary = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  primary?: boolean;
  onClick?: () => void;
}) {
  const className = primary
    ? 'bg-amber-500 text-black hover:bg-amber-400 border-amber-500'
    : active
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'
      : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RecommendationCard({
  video,
  index,
  isFeatured = false,
}: {
  video: VideoResponse;
  index: number;
  isFeatured?: boolean;
}) {
  const thumbnail = buildUrl(video.thumbnailUrl || video.posterUrl);
  const videoHref = `/video/${video._id}`;

  if (isFeatured) {
    return (
      <Link href={videoHref} className="group block">
        <motion.article
          whileHover={{ y: -2 }}
          className="glass-card overflow-hidden p-0 transition-all duration-300 hover:border-amber-500/25"
        >
          <div className="relative aspect-video overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={video.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-white/35">
                No thumbnail
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300 backdrop-blur-xl">
              Play next
            </div>
            <div className="absolute bottom-4 right-4 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
              {formatDuration(video.duration)}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
              <span>Next up</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>#{index + 1}</span>
            </div>

            <h3 className="line-clamp-2 text-base font-semibold text-white transition group-hover:text-amber-300">
              {video.title}
            </h3>

            <div className="mt-3 flex items-center gap-3 text-xs text-white/55">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatCompactDate(video.createdAt)}</span>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  return (
    <Link href={videoHref} className="group block">
      <motion.article
        whileHover={{ x: 4 }}
        className="glass-card flex gap-3 overflow-hidden p-2.5 transition-all duration-300 hover:border-amber-500/20"
      >
        <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={video.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/35">
              No thumbnail
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/35">
            <span>#{index + 1}</span>
          </div>

          <h3 className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-amber-300">
            {video.title}
          </h3>

          <p className="mt-2 text-xs text-white/50">
  {video.ownerId?.username ?? 'Unknown Studio'}
</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{formatCompactDate(video.createdAt)}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function RatingButton({
  value,
  active,
  disabled,
  onClick,
}: {
  value: number;
  active: boolean;
  disabled: boolean;
  onClick: (value: number) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(value)}
      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
        active
          ? 'border-amber-500 bg-amber-500 text-black'
          : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {value}
    </button>
  );
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.id as string;

  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [allVideos, setAllVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isfollowed, setIsFollowed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);

        const [videoData, allData] = await Promise.all([
          videoService.getOne(videoId),
          videoService.getAll(),
        ]);

        setVideo(videoData);
        setAllVideos(allData);

        videoService.incrementViews(videoId).catch(() => undefined);
      } catch (loadError) {
        console.error('Failed to load watch page:', loadError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [videoId]);

  const recommendations = useMemo(
    () => allVideos.filter((item) => item._id !== videoId).slice(0, 12),
    [allVideos, videoId],
  );

  const heroPoster = buildUrl(video?.thumbnailUrl || video?.posterUrl);
  const videoSource = buildUrl(video?.videoUrl);
  const description = video?.description?.trim() || 'No description available for this title.';
  const shouldCollapseDescription = description.length > 220;
  const ratingLabel =
    video && video.ratingsCount > 0
      ? `${video.averageRating.toFixed(1)} / 10`
      : 'No ratings yet';

  const handleRate = async (value: number) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  if (!token) {
   notify.error('Please sign in to rate this movie');
    router.push('/login');
    return;
  }

  if (!videoId) return;

  try {
    setSubmittingRating(true);

    const res = await axiosInstance.patch(
      API_CONFIG.ENDPOINTS.VIDEOS.RATE(videoId),
      { value },
    );

    const updatedVideo = res.data as VideoResponse;

    setVideo(updatedVideo);
    setUserRating(value);
   notify.success(`You rated this title ${value}/10`);
  } catch (rateError) {
    console.error('Failed to submit rating:', rateError);
    notify.error('Failed to submit rating');
  } finally {
    setSubmittingRating(false);
  }
};

  if (loading) return <WatchPageSkeleton />;
  if (error || !video) return <WatchPageError />;

  return (
    <div className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%)]" />

        <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
              >
                <VideoPlayer src={videoSource} poster={heroPoster} title={video.title} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="mt-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <MetaPill icon={<FiStar />}>{ratingLabel}</MetaPill>
                  <MetaPill icon={<FiList />}>
                    {video.ratingsCount > 0 ? `${video.ratingsCount} ratings` : 'Be the first to rate'}
                  </MetaPill>
                  <MetaPill icon={<FiClock />}>{formatDuration(video.duration)}</MetaPill>
                  <MetaPill icon={<FiEye />}>{formatViews(video.views)} views</MetaPill>
                  <MetaPill icon={<FiPlay />}>{formatFullDate(video.createdAt)}</MetaPill>
                </div>

                <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {video.title}
                </h1>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
  {video.ownerId?.avatar ? (
    <img
      src={buildUrl(video.ownerId.avatar)}
      alt={video.ownerId.username}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-black">
      {(video.ownerId?.username ?? 'S').charAt(0).toUpperCase()}
    </div>
  )}
</div>

<div className="min-w-0 flex-1">
  <div className="flex flex-wrap items-center gap-2">
    <p className="min-w-0 text-base font-semibold text-white sm:text-lg">
      <span className="block truncate sm:max-w-[320px] md:max-w-[420px] lg:max-w-[520px] xl:max-w-none">
        {video.ownerId?.username ?? 'Unknown Studio'}
      </span>
    </p>

    {/* Studio badge — only for studio accounts */}
    {video.ownerId?.accountType === 'studio' && (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
        <FiCheck className="text-[11px]" />
        Studio
      </span>
    )}
  </div>

  <p className="mt-1 text-sm leading-6 text-white/55">
    Uploaded on {formatFullDate(video.createdAt)}
  </p>
</div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:max-w-[520px] xl:justify-end">
                      <ActionButton
                        icon={isfollowed ? <FiCheck /> : <FiPlus />}
              label={isfollowed ? 'followed' : 'follow'}
                        primary={!isfollowed}
                        active={isfollowed}
                        onClick={() => setIsFollowed((prev) => !prev)}
                      />
                      <ActionButton
                        icon={<FiHeart />}
                        label={isLiked ? 'Liked' : 'Like'}
                        active={isLiked}
                        onClick={() => setIsLiked((prev) => !prev)}
                      />
                      <ActionButton
                        icon={<FiList />}
                        label={isSaved ? 'Saved' : 'Watchlist'}
                        active={isSaved}
                        onClick={() => setIsSaved((prev) => !prev)}
                      />
                      <ActionButton icon={<FiShare2 />} label="Share" />
                      <ActionButton icon={<FiDownload />} label="Download" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                      About this title
                    </h2>
                    <span className="text-xs text-white/35">{formatCompactDate(video.createdAt)}</span>
                  </div>

                  <p
                    className={`text-sm leading-7 text-white/75 ${
                      showFullDescription ? '' : 'line-clamp-4'
                    }`}
                  >
                    {description}
                  </p>

                  {shouldCollapseDescription && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-300 transition hover:text-amber-200"
                    >
                      {showFullDescription ? (
                        <>
                          <FiChevronUp />
                          Show less
                        </>
                      ) : (
                        <>
                          <FiChevronDown />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                        Rate this title
                      </h2>
                      <p className="mt-2 text-sm text-white/65">
                        Your score updates the live rating shown at the top of the page.
                      </p>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/70">
                      {video.ratingsCount > 0
                        ? `${video.averageRating.toFixed(1)} average from ${video.ratingsCount} ratings`
                        : 'No ratings submitted yet'}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                      <RatingButton
                        key={value}
                        value={value}
                        active={userRating === value}
                        disabled={submittingRating}
                        onClick={handleRate}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/55">
                    <FiStar className="text-amber-300" />
                    <span>
                      {userRating
                        ? `Your rating: ${userRating}/10`
                        : 'Choose a score from 1 to 10'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
                  <CommentSection videoId={videoId} />
                </div>
              </motion.div>
            </section>

            <aside className="xl:sticky xl:top-24 xl:self-start">
              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="space-y-4"
              >
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
                        Up Next
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-white">Keep watching</h2>
                      <p className="mt-1 text-sm text-white/55">
                        {recommendations.length} recommended videos
                      </p>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
                      Auto-play
                    </div>
                  </div>
                </div>

                {recommendations.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
                    No other videos available yet.
                  </div>
                ) : (
                  <>
                    <RecommendationCard video={recommendations[0]} index={0} isFeatured />

                    <div className="space-y-3">
                      {recommendations.slice(1).map((item, index) => (
                        <RecommendationCard
                          key={item._id}
                          video={item}
                          index={index + 1}
                        />
                      ))}
                    </div>
                  </>
                )}

                <Link
                  href="/"
                  className="block rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Explore more
                  </span>
                  <span className="mt-2 block text-base font-semibold">Back to home catalogue</span>
                </Link>
              </motion.div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}